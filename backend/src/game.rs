use crate::dict::{self, random_game_id};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;

pub type GameId = String;
pub type PlayerId = String;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "action", rename_all = "camelCase")]
pub enum ServerMessage {
    CreatedStatus {
        game_id: GameId,
        status: String,
    },
    JoinStatus {
        status: String,
        board_state: BoardState,
    },
    GameUpdate {
        board_state: BoardState,
    },
    Welcome {
        player_id: PlayerId,
        message: String,
    },
    Error {
        message: String,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BoardState {
    guesses: Vec<String>,
    current_turn: PlayerId,
    game_status: String,
}

#[derive(Debug)]
struct Game {
    solution_word: String,
    players: HashMap<PlayerId, mpsc::Sender<ServerMessage>>,
    board_state: BoardState,
}

pub enum GameCommand {
    Create {
        player_id: PlayerId,
        reply_sender: mpsc::Sender<ServerMessage>,
    },
    Join {
        game_id: GameId,
        player_id: PlayerId,
        reply_sender: mpsc::Sender<ServerMessage>,
    },
    Guess {
        game_id: GameId,
        player_id: PlayerId,
        word: String,
    },
    Disconnect {
        game_id: GameId,
        player_id: PlayerId,
    },
}

#[derive(Debug)]
pub struct GameCoordinator {
    games: HashMap<GameId, Game>,
    rx: mpsc::Receiver<GameCommand>,
}

impl GameCoordinator {
    pub fn new() -> (mpsc::Sender<GameCommand>, Self) {
        let _ = dict::VALID_GUESS_WORDS.len();
        let _ = dict::VALID_SOLUTION_WORDS.len();

        let (tx, rx) = mpsc::channel(32);
        let coordinator = GameCoordinator {
            games: HashMap::new(),
            rx,
        };
        (tx, coordinator)
    }

    pub async fn run(mut self) {
        while let Some(msg) = self.rx.recv().await {
            match msg {
                GameCommand::Join {
                    game_id,
                    player_id,
                    reply_sender,
                } => {
                    if let Some(game) = self.games.get_mut(&game_id) {
                        game.players.insert(player_id, reply_sender.clone());

                        let reply_message = ServerMessage::JoinStatus {
                            status: "success".to_string(),
                            board_state: game.board_state.clone(),
                        };
                        reply_sender.send(reply_message).await.unwrap();
                    }
                    println!("{:?}", self.games);
                }
                GameCommand::Create {
                    player_id,
                    reply_sender,
                } => {
                    let solution = dict::random_solution();
                    let game_id = random_game_id();
                    let mut new_game = Game {
                        solution_word: solution,
                        players: HashMap::new(),
                        board_state: BoardState {
                            guesses: Vec::new(),
                            current_turn: player_id.clone(),
                            game_status: "".to_string(),
                        },
                    };
                    new_game
                        .players
                        .insert(player_id.clone(), reply_sender.clone());

                    self.games.insert(game_id.clone(), new_game);
                    let reply_message = ServerMessage::CreatedStatus {
                        game_id: game_id,
                        status: "success".to_string(),
                    };
                    reply_sender.send(reply_message).await.unwrap();
                }
                _ => {}
            }
        }
    }
}
