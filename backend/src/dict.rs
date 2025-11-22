use once_cell::sync::Lazy;
use rand::{prelude::*, rng};
use std::collections::HashSet;

use crate::game::GameId;

const ALLOWED_GUESS_WORDS: &str = include_str!("../wordle-allowed-guesses.txt");
const ALLOWED_SOLUTION_WORDS: &str = include_str!("../wordle-answers-alphabetical.txt");
const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ";

pub static VALID_GUESS_WORDS: Lazy<HashSet<String>> = Lazy::new(|| {
    let mut set = HashSet::new();

    for line in ALLOWED_GUESS_WORDS.lines() {
        let word = line.trim().to_uppercase();
        if !word.is_empty() {
            set.insert(word);
        }
    }
    set
});

pub static VALID_SOLUTION_WORDS: Lazy<Vec<String>> = Lazy::new(|| {
    ALLOWED_SOLUTION_WORDS
        .lines()
        .filter_map(|line| {
            let word = line.trim().to_uppercase();
            if word.is_empty() { None } else { Some(word) }
        })
        .collect()
});

pub fn valid_guess(guess: &str) -> bool {
    VALID_GUESS_WORDS.contains(&guess.to_uppercase()) || VALID_SOLUTION_WORDS.contains(&guess.to_uppercase())
}

pub fn random_solution() -> String {
    let solutions = VALID_SOLUTION_WORDS.as_slice();
    let mut rng = rng();

    solutions
        .choose(&mut rng)
        .cloned()
        .unwrap_or_else(|| panic!("Solution word vec is empty"))
}

pub fn random_game_id() -> GameId {
    let mut rng = rng();
    let game_id: Vec<u8> = (0..5).map(|_| {
        *ALPHABET.choose(&mut rng).unwrap()
    }).collect();

    String::from_utf8(game_id).expect("Failed to make random game if")
}
