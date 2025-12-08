import { type Guess } from "./serverMessage";

export interface GameStore {
	playerId: string | null,
	gameId: string | null,
	solution: string | null,
	currentTurn: string,
	guesses: Guess[],
	gameStatus: string,
	letterStatus: { [key: string]: string; },
	players: string[],
}
