export type ClientMessage =
	| { action: "createGame", playerId: string }
	| { action: "joinGame", playerId: string, gameId: string }
	| { action: "guessWord", playerId: string, gameId: string, word: string }
	| { action: "newGame", gameId: string }
	| { action: "connect", gameId: string | null, playerId: string | null };

