use crate::dict;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc::{self, Receiver};
use tracing::{error, instrument, warn};

pub type GameId = String;
pub type PlayerId = String;
pub type PlayerSender = mpsc::Sender<ServerMessage>;
pub type CommandSender = mpsc::Sender<GameCommand>;

const MAX_GUESSES: usize = 6;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "status", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum ServerMessage {
    Created {
        game_status: GameStatus,
        game_id: GameId,
    },
    Joined {
        board_state: BoardState,
        game_id: GameId,
    },
    GameUpdate {
        board_state: BoardState,
        solution: Option<String>,
    },
    NewGame {
        board_state: BoardState,
    },
    Welcome {
        player_id: PlayerId,
        message: String,
    },
    Error {
        message: String,
    },
    PlayerData {
        game_id: Option<GameId>,
        player_id: Option<PlayerId>,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum GameStatus {
    Waiting,
    InProgress,
    Won,
    Lost,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum GameColor {
    Gray,
    Yellow,
    Green,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
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

#[derive(Clone, Debug)]
pub enum GameCommand {
    Create {
        player_id: PlayerId,
        reply_sender: PlayerSender,
    },
    Join {
        game_id: GameId,
        player_id: PlayerId,
        reply_sender: PlayerSender,
    },
    New {
        game_id: GameId,
        reply_sender: PlayerSender,
    },
    Guess {
        game_id: GameId,
        player_id: PlayerId,
        word: String,
        reply_sender: PlayerSender,
    },
    Disconnect {
        game_id: GameId,
        player_id: PlayerId,
    },
}

impl GameCommand {
    fn get_game_id(&self) -> Option<GameId> {
        match &self {
            &Self::Join { game_id, .. }
            | &Self::Guess { game_id, .. }
            | &Self::New { game_id, .. }
            | &Self::Disconnect { game_id, .. } => Some(game_id.clone()),
            _ => None,
        }
    }

    fn get_reply_sender(&self) -> Option<PlayerSender> {
        match &self {
            &Self::Join { reply_sender, .. }
            | &Self::Guess { reply_sender, .. }
            | &Self::New { reply_sender, .. }
            | &Self::Create { reply_sender, .. } => Some(reply_sender.clone()),
            _ => None,
        }
    }
}

#[derive(Debug)]
struct Game {
    solution_word: String,
    player_senders: HashMap<PlayerId, PlayerSender>,
    board_state: BoardState,
    rx: Receiver<GameCommand>,
}

impl Game {
    fn new(player_id: PlayerId, sender: PlayerSender) -> (CommandSender, Self) {
        let solution = dict::random_solution();
        let (tx, rx) = mpsc::channel::<GameCommand>(32);

        let board_state = BoardState {
            guesses: Vec::new(),
            current_turn: player_id.clone(),
            game_status: GameStatus::InProgress,
            keyboard_status: HashMap::new(),
            players: vec![player_id.clone()],
        };
        let mut game = Game {
            solution_word: solution,
            player_senders: HashMap::new(),
            board_state: board_state,
            rx,
        };
        game.player_senders.insert(player_id, sender);
        (tx, game)
    }

    async fn run(&mut self) {
        while let Some(cmd) = self.rx.recv().await {
            if let Err(err) = self.process_command(cmd.clone()).await {
                if err == "Stop Game" {
                    break;
                }
                let error_message = ServerMessage::Error { message: err.clone() };
                if let Some(reply_sender) = cmd.get_reply_sender() {
                    if let Err(err) = reply_sender.send(error_message).await {
                        error!("{err}");
                    }
                }
            }
        }
    }

    fn reset(&mut self) {
        self.solution_word = dict::random_solution();
        self.board_state.next_turn();
        let new_board_state = BoardState {
            guesses: Vec::new(),
            current_turn: self.board_state.current_turn.clone(),
            game_status: GameStatus::InProgress,
            keyboard_status: HashMap::new(),
            players: self.board_state.players.clone(),
        };
        self.board_state = new_board_state;
    }

    fn check_guess(&self, guess: String) -> GuessResult {
        let mut solution_vec: Vec<char> = self.solution_word.to_uppercase().chars().collect();
        let mut guess_vec: Vec<char> = guess.to_uppercase().chars().collect();
        let mut guess_result = GuessResult::new(guess);
        let word_len = solution_vec.len();

        for i in 0..word_len {
            if guess_vec[i] == solution_vec[i] {
                guess_result.status[i] = GameColor::Green;
                guess_vec[i] = '*';
                solution_vec[i] = '*';
            }
        }
        for j in 0..word_len {
            if guess_vec[j] == '*' {
                continue;
            }
            if let Some(pos) = solution_vec.iter().position(|&c| c == guess_vec[j]) {
                guess_result.status[j] = GameColor::Yellow;
                guess_vec[j] = '*';
                solution_vec[pos] = '*';
            }
        }
        guess_result
    }

    fn has_ended(&self) -> bool {
        match self.board_state.game_status {
            GameStatus::InProgress => false,
            _ => true,
        }
    }

    fn has_player(&self, player_id: &PlayerId) -> bool {
        self.board_state.players.iter().any(|x| x == player_id)
    }

    async fn process_command(&mut self, command: GameCommand) -> Result<(), String> {
        match command {
            GameCommand::Join {
                game_id,
                player_id,
                reply_sender,
            } => {
                if let Err(err) = self.handle_join(player_id, game_id, reply_sender.clone()).await {
                    return Err(err.to_string());
                }
            }
            GameCommand::New { .. } => {
                if let Err(err) = self.handle_new().await {
                    return Err(err.to_string());
                }
            }
            GameCommand::Guess { player_id, word, .. } => {
                if let Err(err) = self.handle_guess(player_id, word).await {
                    return Err(err.to_string());
                }
            }
            GameCommand::Disconnect { player_id, .. } => {
                if let Err(err) = self.handle_disconnect(player_id).await {
                    return Err(err.to_string());
                }
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_join(&mut self, player_id: PlayerId, game_id: GameId, sender: PlayerSender) -> Result<(), String> {
        if self.player_senders.len() > 1 {
            return Err("Already two players in this game".to_string());
        }

        self.player_senders.insert(player_id.clone(), sender.clone());
        self.board_state.add_player(player_id.clone());

        if !self.has_player(&self.board_state.current_turn) {
            self.board_state.current_turn = player_id.clone();
        }

        let join_message = ServerMessage::Joined {
            board_state: self.board_state.clone(),
            game_id: game_id.clone(),
        };
        Self::broadcast_message(self, join_message).await;

        let data_message = ServerMessage::PlayerData {
            game_id: Some(game_id),
            player_id: Some(player_id),
        };
        if let Err(err) = sender.send(data_message).await {
            error!("Failed to send PlayerData to new player: {err}");
        }
        Ok(())
    }

    async fn handle_new(&mut self) -> Result<(), String> {
        self.reset();
        let new_message = ServerMessage::NewGame {
            board_state: self.board_state.clone(),
        };
        Self::broadcast_message(self, new_message).await;
        Ok(())
    }

    async fn handle_guess(&mut self, player_id: PlayerId, word: String) -> Result<(), String> {
        if self.has_ended() {
            return Err("Game has ended you cant guess".to_string());
        }

        let mut solution = None;

        if self.board_state.current_turn != player_id {
            return Err("Not your turn to guess".to_string());
        }
        if !dict::valid_guess(&word) {
            return Err("Not a valid word".to_string());
        }
        let guess = self.check_guess(word);
        self.board_state.guesses.push(guess.clone());

        let win = guess.status.iter().all(|x| *x == GameColor::Green);
        if win {
            self.board_state.game_status = GameStatus::Won;
            solution = Some(self.solution_word.clone());
        } else if self.board_state.guesses.len() >= MAX_GUESSES {
            self.board_state.game_status = GameStatus::Lost;
            solution = Some(self.solution_word.clone());
        }
        Self::update_keyboard_status(self, &guess);
        self.board_state.next_turn();

        let game_update = ServerMessage::GameUpdate {
            board_state: self.board_state.clone(),
            solution,
        };
        Self::broadcast_message(self, game_update).await;

        Ok(())
    }

    async fn handle_disconnect(&mut self, player_id: PlayerId) -> Result<(), String> {
        self.player_senders.remove(&player_id);
        self.board_state.players.retain(|id| id != &player_id);

        if self.board_state.players.is_empty() {
            return Err("Stop Game".to_string());
        }

        let game_update = ServerMessage::GameUpdate {
            board_state: self.board_state.clone(),
            solution: None,
        };

        Self::broadcast_message(self, game_update).await;
        Ok(())
    }

    fn update_keyboard_status(&mut self, guess: &GuessResult) {
        let guess_chars: Vec<char> = guess.word.to_uppercase().chars().collect();
        for i in 0..guess_chars.len() {
            let char_key = guess_chars[i];
            let guess_color = guess.status[i].clone();

            let current_color = self.board_state.keyboard_status.get(&char_key);

            let new_color = match (current_color, &guess_color) {
                (Some(GameColor::Green), _) => None,
                (Some(GameColor::Yellow), GameColor::Green) => Some(GameColor::Green),
                (Some(GameColor::Yellow), _) => None,
                _ => Some(guess_color),
            };
            if let Some(color) = new_color {
                self.board_state.keyboard_status.insert(char_key, color);
            }
        }
    }

    #[instrument(skip(game))]
    async fn broadcast_message(game: &mut Game, message: ServerMessage) {
        for (_, sender) in &game.player_senders {
            if let Err(err) = sender.send(message.clone()).await {
                error!("{err}");
            }
        }
    }
}

#[derive(Debug)]
pub struct GameCoordinator {
    games: HashMap<GameId, mpsc::Sender<GameCommand>>,
    player_games: HashMap<PlayerId, GameId>,
    rx: mpsc::Receiver<GameCommand>,
}

impl GameCoordinator {
    pub fn new() -> (mpsc::Sender<GameCommand>, Self) {
        let _ = dict::VALID_GUESS_WORDS.len();
        let _ = dict::VALID_SOLUTION_WORDS.len();

        let (tx, rx) = mpsc::channel(32);
        let coordinator = GameCoordinator {
            games: HashMap::new(),
            player_games: HashMap::new(),
            rx,
        };
        (tx, coordinator)
    }

    #[instrument(skip(self))]
    pub async fn run(mut self) {
        while let Some(cmd) = self.rx.recv().await {
            match &cmd {
                GameCommand::Create {
                    player_id,
                    reply_sender,
                } => {
                    self.handle_creating_game(player_id.clone(), reply_sender.clone()).await;
                    continue;
                }
                GameCommand::Join { player_id, game_id, .. } => {
                    self.disconnect_from_game(player_id).await;
                    self.player_games.insert(player_id.clone(), game_id.clone());
                }
                GameCommand::Disconnect { player_id, .. } => {
                    self.disconnect_from_game(player_id).await;
                }
                _ => {}
            }
            if let Some(game_id) = cmd.get_game_id() {
                self.relay_command(game_id, cmd).await;
            }
        }
    }

    async fn relay_command(&mut self, game_id: GameId, command: GameCommand) {
        if let Some(sender) = self.games.get(&game_id) {
            if let Err(err) = sender.send(command).await {
                warn!("Game actor is dead: {err}");
                self.games.remove(&game_id);
            }
            return;
        }
        if let Some(reply_sender) = command.get_reply_sender() {
            let error_message = ServerMessage::Error {
                message: "Game doesnt exist".to_string(),
            };
            if let Err(err) = reply_sender.send(error_message).await {
                error!("{err}");
            }
        }
    }

    async fn handle_creating_game(&mut self, player_id: PlayerId, player_sender: PlayerSender) {
        let (sender, mut game) = Game::new(player_id.clone(), player_sender.clone());

        self.disconnect_from_game(&player_id).await;
        let game_id = dict::random_game_id();

        self.add_game(game_id.clone(), player_id.clone(), sender);

        tokio::spawn(async move {
            game.run().await;
        });

        let data_message = ServerMessage::PlayerData {
            game_id: Some(game_id.clone()),
            player_id: Some(player_id),
        };
        if let Err(err) = player_sender.send(data_message).await {
            error!("Failed to send PlayerData to new player: {err}");
            return;
        }

        let create_message = ServerMessage::Created {
            game_status: GameStatus::Waiting,
            game_id: game_id,
        };
        if let Err(err) = player_sender.send(create_message).await {
            error!("Failed to send created message to new player: {err}");
            return;
        }
    }

    async fn disconnect_from_game(&mut self, player_id: &PlayerId) {
        if let Some(game_id) = self.player_games.remove(player_id) {
            if let Some(sender) = self.games.get(&game_id) {
                let disconnect_message = GameCommand::Disconnect {
                    player_id: player_id.clone(),
                    game_id: game_id.clone(),
                };
                if let Err(_) = sender.send(disconnect_message).await {
                    self.games.remove(&game_id);
                }
            }
        }
    }

    fn add_game(&mut self, game_id: GameId, player_id: PlayerId, sender: CommandSender) {
        self.games.insert(game_id.clone(), sender);
        self.player_games.insert(player_id, game_id);
    }
}
