use crate::dict;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;

pub type GameId = String;
pub type PlayerId = String;
pub type ServerMessageSender = mpsc::Sender<ServerMessage>;

const MAX_GUESSES: usize = 6;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "action", rename_all_fields = "camelCase")]
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
        let word_length = word.len();
        GuessResult {
            word: word,
            status: vec![GameColor::Gray; word_length],
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
    player_senders: HashMap<PlayerId, ServerMessageSender>,
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

    fn add_sender(&mut self, player_id: PlayerId, reply_sender: ServerMessageSender) {
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
                solution_vec[pos] = '0';
            }
        }
        guess_result
    }
}

pub enum GameCommand {
    Create {
        player_id: PlayerId,
        reply_sender: ServerMessageSender,
    },
    Join {
        game_id: GameId,
        player_id: PlayerId,
        reply_sender: ServerMessageSender,
    },
    Guess {
        game_id: GameId,
        player_id: PlayerId,
        word: String,
        reply_sender: ServerMessageSender,
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
                    if let Err(err) = self
                        .handle_join(player_id, game_id, reply_sender.clone())
                        .await
                    {
                        let error_message = ServerMessage::Error {
                            message: err.clone(),
                        };
                        if reply_sender.send(error_message).await.is_err() {
                            println!("ERROR: {err}");
                        }
                    }
                }
                GameCommand::Create {
                    player_id,
                    reply_sender,
                } => {
                    let game_id = self.handle_create(player_id, reply_sender.clone()).await;

                    let created_message = ServerMessage::CreatedStatus {
                        game_id: game_id,
                        status: "Success".to_string(),
                    };
                    if reply_sender.send(created_message).await.is_err() {
                        println!("ERROR: Sending game id");
                    }
                }
                GameCommand::Guess {
                    game_id,
                    player_id,
                    word,
                    reply_sender,
                } => {
                    if let Err(err) = self.handle_guess(player_id, game_id, word).await {
                        let error_message = ServerMessage::Error {
                            message: err.to_string(),
                        };
                        if reply_sender.send(error_message).await.is_err() {
                            println!("ERROR: {err}");
                        }
                    }
                }
                GameCommand::Disconnect { game_id, player_id } => {
                    if let Err(err) = self.handle_disconnect(player_id, game_id).await {
                        println!("ERROR: {err}");
                    };
                }
            }
        }
    }

    async fn handle_join(
        &mut self,
        player_id: PlayerId,
        game_id: GameId,
        sender: ServerMessageSender,
    ) -> Result<(), String> {
        let game = self
            .games
            .get_mut(&game_id)
            .ok_or_else(|| "Game not found".to_string())?;
        game.add_sender(player_id.clone(), sender.clone());
        game.board_state.add_player(player_id);
        let join_message = ServerMessage::JoinStatus {
            status: "success".to_string(),
            board_state: game.board_state.clone(),
        };
        sender.send(join_message).await.map_err(|err| err.to_string())?;
        Ok(())
    }

    async fn handle_create(&mut self, player_id: PlayerId, sender: ServerMessageSender) -> GameId {
        let solution_word = dict::random_solution();
        let game_id = dict::random_game_id();

        let mut new_game = Game::new(solution_word, player_id.clone());
        new_game.add_sender(player_id.clone(), sender);
        new_game.board_state.add_player(player_id);

        self.add_game(game_id.clone(), new_game);

        game_id
    }

    async fn handle_guess(
        &mut self,
        player_id: PlayerId,
        game_id: GameId,
        word: String,
    ) -> Result<(), String> {
        let game = self
            .games
            .get_mut(&game_id)
            .ok_or_else(|| "Game not found".to_string())?;

        if game.board_state.current_turn != player_id {
            return Err("Not your turn to guess".to_string());
        }
        if !dict::valid_guess(&word) {
            return Err("Not a valid word".to_string());
        }
        let guess = game.check_guess(word);
        game.board_state.guesses.push(guess.clone());

        let win = guess.status.iter().all(|x| *x == GameColor::Green);
        if win {
            game.board_state.game_status = GameStatus::Won;
        } else if game.board_state.guesses.len() >= MAX_GUESSES {
            game.board_state.game_status = GameStatus::Lost;
        }
        GameCoordinator::update_keyboard_status(game, &guess);
        game.board_state.next_turn();

        let game_update = ServerMessage::GameUpdate {
            board_state: game.board_state.clone(),
        };
        GameCoordinator::broadcast_message(game, game_update).await;

        Ok(())
    }

    async fn handle_disconnect(
        &mut self,
        player_id: PlayerId,
        game_id: GameId,
    ) -> Result<(), String> {
        let game = self
            .games
            .get_mut(&game_id)
            .ok_or_else(|| "Game not found".to_string())?;

        game.player_senders.remove(&player_id);
        game.board_state.players.retain(|id| id != &player_id);

        if game.board_state.current_turn == player_id {
            game.board_state.next_turn();
        }

        if game.board_state.players.is_empty() {
            self.games.remove(&game_id);
            return Ok(());
        }

        let game_update = ServerMessage::GameUpdate {
            board_state: game.board_state.clone(),
        };

        GameCoordinator::broadcast_message(game, game_update).await;
        Ok(())
    }

    fn update_keyboard_status(game: &mut Game, guess: &GuessResult) {
        let guess_chars: Vec<char> = guess.word.to_uppercase().chars().collect();
        for i in 0..guess_chars.len() {
            let char_key = guess_chars[i];
            let guess_color = guess.status[i].clone();

            let current_color = game.board_state.keyboard_status.get(&char_key);

            let new_color = match (current_color, &guess_color) {
                (Some(GameColor::Green), _) => None,
                (Some(GameColor::Yellow), GameColor::Green) => Some(GameColor::Green),
                (Some(GameColor::Yellow), _) => None,
                _ => Some(guess_color),
            };
            if let Some(color) = new_color {
                game.board_state.keyboard_status.insert(char_key, color);
            }
        }
    }

    async fn broadcast_message(game: &mut Game, message: ServerMessage) {
        for (_, sender) in &game.player_senders {
            if sender.send(message.clone()).await.is_err() {
                println!("ERROR: Unable to broadcast message to players");
            }
        }
    }
}
