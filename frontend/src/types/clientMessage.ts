export type ClientMessage =
	| { action: "connect", gameId: string | null, oldPlayerId: string | null}
	| { action: "joinGame", gameId: string }
	| { action: "guessWord", word: string }
	| { action: "createGame" }
	| { action: "newGame"}
	| { action: "disconnectPlayer"};
