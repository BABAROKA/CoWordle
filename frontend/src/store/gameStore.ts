import { createStore } from "solid-js/store";
import type { GameStore } from "../types";

const initialState: GameStore = {
	playerId: null,
	gameId: null,
	solution: null,
	currentTurn: "",
	guesses: [],
	gameStatus: "pending",
	keyboardStatus: {},
	players: [],
	toasts: [],
};

export const [gameStore, setGameStore] = createStore<GameStore>(initialState);

export const resetGame = () => setGameStore({
	gameId: null,
	solution: null,
	currentTurn: "",
	guesses: [],
	gameStatus: "pending",
	keyboardStatus: {},
	players: [],
	toasts: [],
});
