import { create } from 'zustand'
import {ReadyState} from "react-use-websocket";

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
	readyState: ReadyState;

	setGameId: (id: string) => void,
	setPlayerId: (id: string) => void,
	setGameStatus: (status: string) => void,
	setSolution: (solution: string) => void,
	setReadyState: (state: ReadyState) => void,
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
	readyState: ReadyState.UNINSTANTIATED,

	setGameId: (id: string) => set({ gameId: id }),
	setPlayerId: (id: string) => set({ playerId: id }),
	setGameStatus: (status: string) => set({gameStatus: status}),
	setSolution : (solution: string) => set({solution: solution}),
	setReadyState: (state: ReadyState) => set({readyState: state}),
	setGameData: (currentTurn, guesses, gameStatus, keyboardStatus, players) => set({
		currentTurn,
		guesses,
		gameStatus,
		keyboardStatus,
		players,
	})

}))

export default useGame;
