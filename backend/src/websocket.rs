use crate::game::{GameCommand, GameId, ServerMessage};
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
    Connect { game_id: Option<GameId> },
    JoinGame { game_id: GameId },
    GuessWord { word: String },
    CreateGame,
    NewGame,
    DisconnectPlayer,
}

#[instrument(skip(socket, tx))]
pub async fn handle_socket(socket: WebSocket, tx: mpsc::Sender<GameCommand>) {
    let (player_tx, mut player_rx) = mpsc::channel::<ServerMessage>(32);
    let mut session_game_id: Option<String> = None;
    let mut session_player_id: Option<String> = None;

    let (mut tw, mut rw) = socket.split();

    let quota = Quota::per_second(nonzero!(1u32)).allow_burst(nonzero!(6u32));
    let limit = RateLimiter::direct(quota);

    loop {
        tokio::select! {
            Some(msg) = player_rx.recv() => {
                if let ServerMessage::Created {game_id, ..} = &msg {
                    session_game_id = Some(game_id.clone());
                }
                let Ok(message) = serde_json::to_string(&msg) else {
                    error!("Failed to serialize message");
                    continue;
                };
                if let Err(err) = tw.send(Message::Text(message.into())).await {
                    error!("Unable to send message to client {err}");
                }
            }

            Some(Ok(msg)) = rw.next() => {
                match msg {
                    Message::Text(text) => {
                        if limit.check().is_err() {
                            let error_message = serde_json::json!({
                                "status": "error",
                                "error": {
                                    "type": "rateLimitError",
                                    "message": "Rate limit reached"
                                }
                            }).to_string();

                            if let Err(_) = tw.send(Message::Text(error_message.into())).await {
                                error!("Error sending rate limite messgae");
                            }
                            continue;
                        }
                        let Ok(request) = serde_json::from_str::<ClientMessage>(&text.to_string()) else {continue;};

                        if let ClientMessage::Connect {game_id} = &request {
                            let new_player_id = Uuid::new_v4().to_string();

                            session_player_id = Some(new_player_id.clone());
                            session_game_id = game_id.clone();

                            info!("player connected {}", &new_player_id);
                            let welcome_message = serde_json::to_string(&ServerMessage::Welcome {
                                player_id: new_player_id.clone(),
                                message: "Welcome new player".to_string(),
                            });
                            if let Ok(message) = welcome_message {
                                if tw.send(Message::Text(message.into())).await.is_err() {
                                    error!("Unable to send welcome message");
                                }
                            }

                            let Some(id) = game_id else {continue};
                            if let Err(err) = tx.send(GameCommand::Join { game_id: id.clone(), player_id: new_player_id, reply_sender: player_tx.clone()}).await {
                                error!("Unable to send message to game coordinator {err}");
                                break;
                            }
                            continue;
                        }

                        let command = match (request, session_player_id.clone(), session_game_id.clone()) {
                            (ClientMessage::Connect {..}, _, _) => unreachable!(),
                            (ClientMessage::CreateGame, Some(pid), _) => {
                                GameCommand::Create { player_id: pid, reply_sender: player_tx.clone()}
                            },
                            (ClientMessage::JoinGame { game_id }, Some(pid), _) => {
                                session_game_id = Some(game_id.clone());
                                GameCommand::Join { game_id: game_id, player_id: pid, reply_sender: player_tx.clone()}
                            },
                            (ClientMessage::NewGame, _, Some(gid)) => {
                                GameCommand::New { game_id: gid, reply_sender: player_tx.clone()}
                            },
                            (ClientMessage::GuessWord { word }, Some(pid), Some(gid)) => {

                                GameCommand::Guess { game_id: gid, player_id: pid, word: word.clone(), reply_sender: player_tx.clone()}
                            },
                            (ClientMessage::DisconnectPlayer, Some(pid), Some(gid)) => {
                                GameCommand::Disconnect { game_id: gid, player_id: pid, }
                            },
                            _ => {continue}
                        };

                        if let Err(err) = tx.send(command).await {
                            error!("Unable to send message to game coordinator {err}");
                            break;
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

    if let (Some(player_id), Some(game_id)) = (session_player_id.clone(), session_game_id.clone()) {
        let _ = tx.send(GameCommand::Disconnect { game_id, player_id }).await;
    }
}
