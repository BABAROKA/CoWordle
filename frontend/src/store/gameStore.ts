import { createStore } from "solid-js/store";
import type { GameStore } from "../types";

export const initialState: GameStore = {
	playerId: null,
	gameId: null,
	solution: null,
	currentTurn: "",
	guesses: [],
	gameStatus: "pending",
	keyboardStatus: {},
	players: [],
}

export const [gameStore, setGameStore] = createStore<GameStore>(initialState);
