export type GameColor = 'gray' | 'yellow' | 'green';

type GameStatus = 'waiting' | 'inProgress' | 'won' | 'lost' | "pending";

export interface Guess {
	word: string,
	status: GameColor[],
}

interface BoardState {
	guesses: Guess[],
	currentTurn: string,
	gameStatus: GameStatus,
	keyboardStatus: { [key: string]: GameColor },
	players: string[],
};

export type ServerMessage =
	| { status: 'created', gameStatus: GameStatus, gameId: string, }
	| { status: 'joined', boardState: BoardState, gameId: string, }
	| { status: 'gameUpdate', boardState: BoardState, solution: string | null, }
	| { status: 'newGame', boardState: BoardState }
	| { status: 'welcome', playerId: string, message: string }
	| { status: 'error', message: string }
	| { status: "exited", boardState: BoardState};
