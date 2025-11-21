use crate::dict;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;

pub type GameId = String;
pub type PlayerId = String;
const MAX_GUESSES: usize = 6;

#[derive(Serialize, Deserialize, Debug, Clone)]
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
pub enum GameStatus {
    InProgress,
    Won,
    Lost,
    Aborted,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum GameColor {
    Gray,
    Yellow,
    Green,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GuessResult {
    word: String,
    status: Vec<GameColor>,
}

impl GuessResult {
    fn new(word: String) -> Self {
        GuessResult {
            word: word,
            status: vec![GameColor::Gray; 5],
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BoardState {
    guesses: Vec<GuessResult>,
    current_turn: PlayerId,
    game_status: GameStatus,
    keyboard_status: HashMap<char, GameColor>,
    players: Vec<PlayerId>,
}

impl BoardState {
    fn add_player(&mut self, player_id: PlayerId) {
        if !self.players.contains(&player_id) {
            self.players.push(player_id);
        }
    }

    fn next_turn(&mut self) {
        let num_players = self.players.len();
        let players = &self.players;
        let current_player = &self.current_turn;

        if let Some(player_index) = players.iter().position(|id| id == current_player) {
            let next_index = (player_index + 1) % num_players;
            let next_player = players[next_index].clone();
            self.current_turn = next_player;
        }
    }
}

#[derive(Debug)]
struct Game {
    solution_word: String,
    player_senders: HashMap<PlayerId, mpsc::Sender<ServerMessage>>,
    board_state: BoardState,
}

impl Game {
    fn new(solution: String, player_id: PlayerId) -> Self {
        Game {
            solution_word: solution,
            player_senders: HashMap::new(),
            board_state: BoardState {
                guesses: Vec::new(),
                current_turn: player_id,
                game_status: GameStatus::InProgress,
                keyboard_status: HashMap::new(),
                players: Vec::new(),
            },
        }
    }

    fn add_sender(&mut self, player_id: PlayerId, reply_sender: mpsc::Sender<ServerMessage>) {
        if !self.player_senders.contains_key(&player_id) {
            self.player_senders.insert(player_id, reply_sender);
        }
    }

    fn check_guess(&self, guess: String) -> GuessResult {
        let mut solution_vec: Vec<char> = self.solution_word.to_uppercase().chars().collect();
        let mut guess_vec: Vec<char> = guess.to_uppercase().chars().collect();
        let mut guess_result = GuessResult::new(guess);

        for i in 0..5 {
            if guess_vec[i] == solution_vec[i] {
                guess_result.status[i] = GameColor::Green;
                guess_vec[i] = '0';
                solution_vec[i] = '0';
            }
        }
        for j in 0..5 {
            if guess_vec[j] == '0' {
                continue;
            }
            if let Some(pos) = solution_vec.iter().position(|&c| c == guess_vec[j]) {
                guess_result.status[j] = GameColor::Yellow;
                guess_vec[j] = '0';
                solution_vec.remove(pos);
            }
        }
        guess_result
    }
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

    fn add_game(&mut self, game_id: GameId, game: Game) {
        if !self.games.contains_key(&game_id) {
            self.games.insert(game_id, game);
        }
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
                        game.add_sender(player_id.clone(), reply_sender.clone());
                        game.board_state.add_player(player_id);

                        let reply_message = ServerMessage::JoinStatus {
                            status: "success".to_string(),
                            board_state: game.board_state.clone(),
                        };
                        if reply_sender.send(reply_message).await.is_err() {
                            println!("Failed to send Join Message");
                        };
                    } else {
                        let error_message = ServerMessage::Error { message: "Game not found".to_string() };
                        if reply_sender.send(error_message).await.is_err() {
                            println!("Failed to send Join Message no game");
                        };
                    }
                }
                GameCommand::Create {
                    player_id,
                    reply_sender,
                } => {
                    let solution_word = dict::random_solution();
                    let game_id = dict::random_game_id();

                    let mut new_game = Game::new(solution_word, player_id.clone());
                    new_game.add_sender(player_id.clone(), reply_sender.clone());
                    new_game.board_state.add_player(player_id);

                    self.add_game(game_id.clone(), new_game);

                    let reply_message = ServerMessage::CreatedStatus {
                        game_id: game_id,
                        status: "success".to_string(),
                    };
                    if reply_sender.send(reply_message).await.is_err() {
                        println!("Failed to send Create Message")
                    }
                }
                GameCommand::Guess {
                    game_id,
                    player_id,
                    word,
                } => {
                    if let Some(game) = self.games.get_mut(&game_id) {
                        if game.board_state.current_turn != player_id {
                            let error_message = ServerMessage::Error {
                                message: "Not your turn".to_string(),
                            };
                            if let Some(sender) = game.player_senders.get(&player_id) {
                                if sender.send(error_message).await.is_err() {
                                    println!("Failed to send game not found in guess");
                                }
                            }
                            return;
                        }
                        if !dict::valid_guess(&word) {
                            let error_message = ServerMessage::Error {
                                message: "Not valid guess".to_string(),
                            };
                            if let Some(sender) = game.player_senders.get(&player_id) {
                                if sender.send(error_message).await.is_err() {
                                    println!("Failed to send game not found in guess valid word");
                                }
                            }
                            return;
                        }
                        let guess = game.check_guess(word);
                        game.board_state.guesses.push(guess.clone());

                        if guess.status.iter().all(|x| *x == GameColor::Green) {
                            game.board_state.game_status = GameStatus::Won;
                        } else if game.board_state.guesses.len() >= MAX_GUESSES {
                            game.board_state.game_status = GameStatus::Lost;
                        }

                        let guess_chars: Vec<char> = guess.word.to_uppercase().chars().collect();
                        for i in 0..guess_chars.len() {
                            let char_key = guess_chars[i];
                            let guess_color = guess.status[i].clone();

                            let current_color = game.board_state.keyboard_status.get(&char_key);

                            let new_color = match (current_color, &guess_color) {
                                (Some(GameColor::Green), _) => None,
                                (Some(GameColor::Yellow), GameColor::Green) => {
                                    Some(GameColor::Green)
                                }
                                (Some(GameColor::Yellow), _) => None,
                                _ => Some(guess_color),
                            };

                            if let Some(color) = new_color {
                                game.board_state.keyboard_status.insert(char_key, color);
                            }
                        }
                        game.board_state.next_turn();

                        let game_update = ServerMessage::GameUpdate {
                            board_state: game.board_state.clone(),
                        };

                        for (_, sender) in &game.player_senders {
                            if sender.send(game_update.clone()).await.is_err() {
                                println!("Failed to send board state not found in guess");
                            }
                        }
                    }
                }
                GameCommand::Disconnect { game_id, player_id } => {
                    if let Some(game) = self.games.get_mut(&game_id) {
                        game.player_senders.remove(&player_id);
                        game.board_state.players.retain(|id| id != &player_id);

                        if game.board_state.current_turn == player_id {
                            game.board_state.next_turn();
                        }

                        if game.board_state.players.is_empty() {
                            self.games.remove(&game_id);
                            return;
                        }

                        let game_update = ServerMessage::GameUpdate {
                            board_state: game.board_state.clone(),
                        };

                        for (_, sender) in &game.player_senders {
                            sender.send(game_update.clone()).await;
                        }
                    }
                }
            }
        }
    }
}
