import { createSignal, type JSXElement } from "solid-js";
import { guessContext } from "../context/guessContext";
import { useWebsocket } from "../context/websocketContext";
import { gameStore, setGameStore } from "../store/gameStore";
import type { ClientMessage, Error } from "../types";

const GuessProvider = (props: { children: JSXElement }) => {
	const { sendMessage } = useWebsocket();
	const [currentGuess, setCurrentGuess] = createSignal("");

	const actions = {
		addLetter(key: string) {
			if (currentGuess().length < 5) {
				setCurrentGuess(prev => prev + key.toUpperCase());
			}
		},
		removeLetter() {
			if (currentGuess().length > 0) {
				setCurrentGuess(prev => prev.slice(0, -1));
			}
		},
		resetGuess() {
			setCurrentGuess("");
		},
		sendGuess() {
			if (!gameStore.playerId || !gameStore.gameId) return;
			if (gameStore.currentTurn != gameStore.playerId) {
				const id = Date.now();
				const error: Error = {type: "guessError", message: "Not your turn to guess"};
				setGameStore("toasts", toasts => [...toasts, { id, error }].slice(-3));
				return;
			}

			const guessMessage: ClientMessage = {
				action: "guessWord",
				word: currentGuess(),
			}

			sendMessage(guessMessage);
		}
	}

	return (
		<guessContext.Provider value={{ currentGuess, actions }}>
			{props.children}
		</guessContext.Provider>
	)
}

export default GuessProvider;
