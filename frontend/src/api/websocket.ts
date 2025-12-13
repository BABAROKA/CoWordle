import { createMemo, createSignal, onMount } from "solid-js";
import { setGameStore, gameStore } from "../store/gameStore";
import { onCleanup } from "solid-js";
import type { ClientMessage, ServerMessage, ReadyState, Ready, SendMessage } from "../types";

const websockerUrl = import.meta.env.VITE_WEBSOCKET_URL;
const maxReconnectionAttempts = 2;
const reconnectionInterval = 500;

const createWebsocket = () => {
	const [ws, setWs] = createSignal<WebSocket | null>(null);
	const [retries, setRetries] = createSignal(0);

	let retryTimeout: number | null = null
	let manualClose = false;

	const connectWebsocket = () => {
		manualClose = false;
		const currentWs = ws();
		if (currentWs && (currentWs.readyState == WebSocket.OPEN || currentWs.readyState == WebSocket.CONNECTING)) {
			return;
		}

		const newWs = new WebSocket(websockerUrl);
		setWs(newWs);

		newWs.onopen = () => {
			setRetries(0);

			const connectMessage: ClientMessage = {
				action: "connect",
				playerId: gameStore.playerId,
				gameId: gameStore.gameId
			}
			newWs.send(JSON.stringify(connectMessage));
		};

		newWs.onmessage = (event) => {
			const data: ServerMessage = JSON.parse(event.data);
			console.log(data);

			switch (data.status) {
				case "welcome":
					setGameStore({ playerId: data.playerId });
					break;
				case "created":
					setGameStore({ gameId: data.gameId, gameStatus: data.gameStatus });
					break;
				case "joined":
					setGameStore({
						gameId: data.gameId,
						currentTurn: data.boardState.currentTurn,
						guesses: data.boardState.guesses,
						gameStatus: data.boardState.gameStatus,
						keyboardStatus: data.boardState.keyboardStatus,
						players: data.boardState.players,
						solution: data.solution,
					});
					break;
				case "newGame":
					setGameStore({
						currentTurn: data.boardState.currentTurn,
						guesses: data.boardState.guesses,
						gameStatus: data.boardState.gameStatus,
						keyboardStatus: data.boardState.keyboardStatus,
						players: data.boardState.players,
					});
					break;
				case "gameUpdate":
					setGameStore({
						currentTurn: data.boardState.currentTurn,
						solution: data.solution,
						guesses: data.boardState.guesses,
						gameStatus: data.boardState.gameStatus,
						keyboardStatus: data.boardState.keyboardStatus,
						players: data.boardState.players,
					});
					break;
				case "exited":
					setGameStore({
						currentTurn: data.boardState.currentTurn,
						guesses: data.boardState.guesses,
						gameStatus: data.boardState.gameStatus,
						keyboardStatus: data.boardState.keyboardStatus,
						players: data.boardState.players,
					});
					break;
				case "error":
					break;
				default:
					console.log("^^ invalid data type");
			}
		}

		newWs.onclose = () => {
			setWs(null);
			if (manualClose) return;

			const attempts = retries();

			if (attempts >= maxReconnectionAttempts) {
				// Update Message
				return;
			}

			setRetries(prev => prev + 1);

			if (retryTimeout != null) clearTimeout(retryTimeout);
			retryTimeout = setTimeout(() => connectWebsocket(), reconnectionInterval);
		}

		newWs.onerror = () => {
			// Update Message
		}
	}

	const sendMessage: SendMessage = (message: ClientMessage) => {
		const currentWs = ws();
		if (!currentWs || currentWs.readyState != WebSocket.OPEN) {
			return;
		}
		const messageJson = JSON.stringify(message);
		currentWs.send(messageJson);
	}

	onMount(() => connectWebsocket())

	onCleanup(() => {
		if (retryTimeout != null) {
			clearTimeout(retryTimeout);
		}
		manualClose = true;
		const currentWs = ws();
		if (currentWs && (currentWs.readyState == WebSocket.OPEN || currentWs.readyState == WebSocket.CONNECTING)) {
			currentWs.close();
			setWs(null);
		}
	})

	const readyMap: Record<number, Ready> = { 0: "CONNECTING", 1: "OPEN", 2: "CLOSING", 3: "CLOSED" };
	const readyState: ReadyState = createMemo(() => readyMap[ws()?.readyState ?? 3])

	return [readyState, sendMessage];

}

export default createWebsocket;
