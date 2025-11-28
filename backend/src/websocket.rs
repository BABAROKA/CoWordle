use crate::game::{GameCommand, GameId, PlayerId, ServerMessage};
use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use governor::{Quota, RateLimiter};
use nonzero_ext::*;
use serde::{Deserialize, Serialize};
use serde_json;
use tokio::sync::mpsc;
use tracing::{error, info, instrument};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum ClientMessage {
    Connect {
        game_id: Option<PlayerId>,
        player_id: Option<PlayerId>,
    },
    CreateGame {
        player_id: PlayerId,
    },
    JoinGame {
        game_id: GameId,
        player_id: PlayerId,
    },
    NewGame {
        game_id: GameId,
    },
    GuessWord {
        game_id: GameId,
        player_id: PlayerId,
        word: String,
    },
    DisconnectPlayer {
        game_id: GameId,
        player_id: PlayerId,
    },
}

#[instrument(skip(socket, tx))]
pub async fn handle_socket(socket: WebSocket, tx: mpsc::Sender<GameCommand>) {
    info!("player connected");
    let mut game_id_disconnect: Option<String> = None;
    let mut player_id_disconnect: Option<String> = None;
    let (player_tx, mut player_rx) = mpsc::channel::<ServerMessage>(32);

    let (mut tw, mut rw) = socket.split();

    let quota = Quota::per_second(nonzero!(1u32)).allow_burst(nonzero!(6u32));
    let limit = RateLimiter::direct(quota);

    loop {
        tokio::select! {
            Some(msg) = player_rx.recv() => {
                match &msg {
                    ServerMessage::PlayerData {game_id, player_id} => {
                        game_id_disconnect = game_id.clone();
                        player_id_disconnect = player_id.clone();
                    }
                    _ => {
                        match serde_json::to_string(&msg) {
                            Ok(message) => {
                                if let Err(err) = tw.send(Message::Text(message.into())).await {
                                    error!("Unable to send message to client {err}");
                                    break;
                                }
                            },
                            Err(err) => {
                                error!("Failed to serialize message: {:?}", err);
                                break;
                            }
                        }
                    }
                }
            }

            Some(Ok(msg)) = rw.next() => {
                match msg {
                    Message::Text(text) => {
                        if let Err(_) = limit.check() {
                            let error_message = serde_json::to_string(&ServerMessage::Error {
                                message: "Rate limit reached wait".to_string(),
                            });
                            if let Ok(message) = error_message {
                                if let Err(_) = tw.send(Message::Text(message.into())).await {
                                    error!("Error sending rate limite messgae");
                                }
                            }
                            continue;
                        }
                        match serde_json::from_str::<ClientMessage>(&text.to_string()) {
                            Ok(request) => {
                                let command: GameCommand = match request {
                                    ClientMessage::Connect {game_id, player_id} => {
                                        if let Some(gid) = game_id && let Some(pid) = player_id {
                                            GameCommand::Join { game_id: gid, player_id: pid, reply_sender: player_tx.clone()}
                                        } else {
                                            let generated_player_id = format!("User-{}", Uuid::new_v4().to_string());

                                            let welcome_message = serde_json::to_string(&ServerMessage::Welcome {
                                                player_id: generated_player_id.clone(),
                                                message: "Welcome new player".to_string(),
                                            });
                                            if let Ok(message) = welcome_message {
                                                if tw.send(Message::Text(message.into())).await.is_err() {
                                                    error!("Unable to send welcome message");
                                                }
                                            }
                                            continue;
                                        }
                                    },
                                    ClientMessage::CreateGame {player_id} => {
                                        GameCommand::Create { player_id: player_id, reply_sender: player_tx.clone()}
                                    },
                                    ClientMessage::JoinGame {player_id, game_id} => {
                                        GameCommand::Join { game_id: game_id, player_id: player_id, reply_sender: player_tx.clone()}
                                    },
                                    ClientMessage::NewGame {game_id} => {
                                        GameCommand::New { game_id: game_id, reply_sender: player_tx.clone()}
                                    },
                                    ClientMessage::GuessWord {player_id, game_id, word} => {
                                        GameCommand::Guess { game_id: game_id, player_id: player_id, word: word, reply_sender: player_tx.clone()}
                                    },
                                    ClientMessage::DisconnectPlayer {player_id, game_id} => {
                                        GameCommand::Disconnect { game_id: game_id, player_id: player_id }
                                    }
                                };

                                if let Err(err) = tx.send(command).await {
                                    error!("Unable to send message to game coordinator {err}");
                                    break;
                                }
                            }
                            Err(err) => {
                                error!("Failed to serialize message: {:?}", err);
                                break;
                            }
                        }
                    },
                    Message::Close(frame) => {
                        tracing::info!("Client initiated graceful close. Frame: {:?}", frame);
                        break;
                    },
                    _ => {},
                }
            }

            else => break
        }
    }

    match (game_id_disconnect, player_id_disconnect) {
        (Some(gid), Some(pid)) => {
            let command = GameCommand::Disconnect {
                game_id: gid,
                player_id: pid,
            };

            if let Err(err) = tx.send(command).await {
                error!("Unable to send message to game coordinator {err}");
            }
        }
        _ => {}
    }
}
