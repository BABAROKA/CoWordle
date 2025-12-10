import { createStore } from "solid-js/store";
import type { GameStore } from "../types";

const initialState: GameStore = {
	playerId: null,
	gameId: null,
	solution: null,
	currentTurn: "",
	guesses: [],
	gameStatus: "PENDING",
	keyboardStatus: {},
	players: [],
}

export const [gameStore, setGameStore] = createStore<GameStore>(initialState);
