import { create } from 'zustand'

interface guess {
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
	setGameData: (currentTurn, guesses, gameStatus, keyboardStatus, players) => set({
		currentTurn,
		guesses,
		gameStatus,
		keyboardStatus,
		players,
	})

}))

export default useGame;
