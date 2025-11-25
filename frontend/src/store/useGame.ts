import { create } from 'zustand'

export interface guess {
	status: string[],
	word: string,
}

export interface GameStore {
	playerId: string | null,
	gameId: string | null,
	solution: string | null,
	currentTurn: string,
	guesses?: guess[] | null,
	gameStatus: string | null,
	keyboardStatus: Record<string, string>,
	players: string[],

	setGameId: (id: string) => void,
	setPlayerId: (id: string) => void,
	setGameStatus: (status: string) => void,
	setSolution: (solution: string) => void,
	setGameData: (currentTurn: string, guesses: guess[], gameStatus: string, keyboardStatus: Record<string, string>, players: string[]) => void,
}

const useGame = create<GameStore>((set) => ({
	playerId: null,
	gameId: null,
	solution: null,
	currentTurn: "",
	guesses: null,
	gameStatus: null,
	keyboardStatus: {},
	players: [],

	setGameId: (id: string) => set({ gameId: id }),
	setPlayerId: (id: string) => set({ playerId: id }),
	setGameStatus: (status: string) => set({gameStatus: status}),
	setSolution : (solution: string) => set({solution: solution}),
	setGameData: (currentTurn, guesses, gameStatus, keyboardStatus, players) => set({
		currentTurn,
		guesses,
		gameStatus,
		keyboardStatus,
		players,
	})

}))

export default useGame;
