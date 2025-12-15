import { type Guess } from "./serverMessage";

type Toast = {id: number, message: string};

export interface GameStore {
	playerId: string | null,
	gameId: string | null,
	solution: string | null,
	currentTurn: string,
	guesses: Guess[],
	gameStatus: string,
	keyboardStatus: { [key: string]: string; },
	players: string[],
	toasts: Toast[],
}
