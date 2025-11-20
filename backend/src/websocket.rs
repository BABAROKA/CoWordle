use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use serde_json;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::game::{GameCommand, GameId, PlayerId, ServerMessage};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action", rename_all = "camelCase")]
enum ClientMessage {
    CreateGame {
        player_id: PlayerId,
    },
    JoinGame {
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

pub async fn handle_socket(socket: WebSocket, tx: mpsc::Sender<GameCommand>) {
    let player_id = format!("User-{}", Uuid::new_v4().to_string());
    let (player_tx, mut player_rx) = mpsc::channel::<ServerMessage>(32);

    let (mut tw, mut rw) = socket.split();

    let welcome_message = ServerMessage::Welcome {
        player_id: player_id,
        message: "Welcome new player".to_string(),
    };
    match serde_json::to_string(&welcome_message) {
        Ok(message) => {
            if tw.send(Message::Text(message.into())).await.is_err() {
                return;
            }
        }
        Err(_) => {}
    }

    loop {
        tokio::select! {
            Some(msg) = player_rx.recv() => {
                match serde_json::to_string(&msg) {
                    Ok(message) => {
                        if tw.send(Message::Text(message.into())).await.is_err() {
                            break;
                        }
                    },
                    Err(_) => {}
                }
            }

            Some(Ok(msg)) = rw.next() => {
                match msg {
                    Message::Text(text) => {
                        match serde_json::from_str::<ClientMessage>(&text.to_string()) {
                            Ok(request) => {
                                let command = match request {
                                    ClientMessage::CreateGame {player_id} => {
                                        GameCommand::Create { player_id: player_id, reply_sender: player_tx.clone() }
                                    },
                                    ClientMessage::JoinGame {player_id, game_id} => {
                                        GameCommand::Join { game_id: game_id, player_id: player_id, reply_sender: player_tx.clone() }
                                    },
                                    ClientMessage::GuessWord {player_id, game_id, word} => {
                                        GameCommand::Guess { game_id: game_id, player_id: player_id, word: word }
                                    },
                                    ClientMessage::DisconnectPlayer {player_id, game_id} => {
                                        GameCommand::Disconnect { game_id: game_id, player_id: player_id }
                                    }
                                };

                                if let Err(_) = tx.send(command).await {
                                    break;
                                }
                            }
                            Err(_) => {}
                        }
                    },
                    _ => {},
                }
            }

            else => break
        }
    }
}
