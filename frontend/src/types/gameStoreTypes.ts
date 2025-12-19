import type { Guess, Error, GameState, KeyColor } from "./serverMessage";

interface Toast {
	id: number,
	error: Error
};

export interface GameStore {
	playerId: string | null,
	gameId: string | null,
	solution: string | null,
	currentTurn: string,
	guesses: Guess[],
	gameStatus: GameState,
	keyboardStatus: { [key: string]: KeyColor; },
	players: string[],
	toasts: Toast[],
}
