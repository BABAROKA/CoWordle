use crate::game::{GameCommand, GameId, PlayerId, ServerMessage};
use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use serde_json;
use tokio::sync::mpsc;
use tracing::{error, instrument};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action", rename_all = "camelCase", rename_all_fields = "camelCase")]
enum ClientMessage {
    CreateGame {
        player_id: PlayerId,
    },
    JoinGame {
        game_id: GameId,
        player_id: PlayerId,
    },
    NewGame {
        game_id: GameId,
        player_id: PlayerId,
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
    let player_id = format!("User-{}", Uuid::new_v4().to_string());
    let mut game_id_disconnect: Option<String> = None;
    let (player_tx, mut player_rx) = mpsc::channel::<ServerMessage>(32);

    tracing::Span::current().record("player_id", &player_id);
    let (mut tw, mut rw) = socket.split();

    let welcome_message = ServerMessage::Welcome {
        player_id: player_id.clone(),
        message: "Welcome new player".to_string(),
    };
    match serde_json::to_string(&welcome_message) {
        Ok(message) => {
            if tw.send(Message::Text(message.into())).await.is_err() {
                error!("Unable to send welcome message");
                return;
            }
        }
        Err(err) => {
            error!("Failed to serialize welcome message: {:?}", err);
            return;
        }
    }

    let register_message = GameCommand::RegisterPlayer {
        player_id: player_id.clone(),
        reply_sender: player_tx,
    };
    if let Err(err) = tx.send(register_message).await {
        error!("{err}");
    }

    loop {
        tokio::select! {
            Some(msg) = player_rx.recv() => {
                match &msg {
                    ServerMessage::CreatedStatus {game_id} => game_id_disconnect = Some(game_id.clone()),
                    _ => {}
                }
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

            Some(Ok(msg)) = rw.next() => {
                match msg {
                    Message::Text(text) => {
                        match serde_json::from_str::<ClientMessage>(&text.to_string()) {
                            Ok(request) => {
                                let command = match request {
                                    ClientMessage::CreateGame {player_id} => {
                                        GameCommand::Create { player_id: player_id}
                                    },
                                    ClientMessage::JoinGame {player_id, game_id} => {
                                        game_id_disconnect = Some(game_id.clone());
                                        GameCommand::Join { game_id: game_id, player_id: player_id}
                                    },
                                    ClientMessage::NewGame {game_id, player_id} => {
                                        GameCommand::New { game_id: game_id, player_id: player_id }
                                    },
                                    ClientMessage::GuessWord {player_id, game_id, word} => {
                                        GameCommand::Guess { game_id: game_id, player_id: player_id, word: word}
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

    if let Some(id) = &game_id_disconnect {
        let command = GameCommand::Disconnect {
            game_id: id.clone(),
            player_id: player_id.clone(),
        };

        if let Err(err) = tx.send(command).await {
            error!("Unable to send message to game coordinator {err}");
        }
    }
}
