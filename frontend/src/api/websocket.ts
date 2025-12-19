import { createSignal, onMount } from "solid-js";
import { setGameStore, gameStore } from "../store/gameStore";
import { onCleanup } from "solid-js";
import type { ClientMessage, ServerMessage, Ready, SendMessage, WebsocketState, Error } from "../types";

const WEBSOCKET_URL: string = import.meta.env.VITE_WEBSOCKET_URL;
const MAX_ATTEMPTS: number = import.meta.env.VITE_MAX_RECONNECT_ATTEMPTS;
const RETRY_INTERVAL: number = import.meta.env.VITE_RETRY_INTERVAL_MILISECONDS;

const createWebsocket = (): WebsocketState => {
	const [ws, setWs] = createSignal<WebSocket | null>(null);
	const [retries, setRetries] = createSignal(0);
	const [readyState, setReadyState] = createSignal<Ready>("CONNECTING");

	let retryTimeout: number | null = null;
	let manualClose = false;
	const readyMap: Record<number, Ready> = { 0: "CONNECTING", 1: "OPEN", 2: "CLOSING", 3: "CLOSED" };

	const addToast = (error: Error) => {
		const id = Date.now();
		setGameStore("toasts", toasts => [...toasts, { id, error }].slice(-3));
	}

	const connectWebsocket = () => {
		manualClose = false;
		const currentWs = ws();
		if (currentWs && (currentWs.readyState == WebSocket.OPEN || currentWs.readyState == WebSocket.CONNECTING)) {
			return;
		}

		const newWs = new WebSocket(WEBSOCKET_URL);
		setWs(newWs);

		newWs.onopen = () => {
			setRetries(0);
			setReadyState(readyMap[ws()?.readyState ?? 3]);

			const connectMessage: ClientMessage = {
				action: "connect",
				gameId: gameStore.gameId
			}
			sendMessage(connectMessage);
		};

		newWs.onmessage = (event) => {
			let data: ServerMessage;
			try {
				data = JSON.parse(event.data);
			} catch (e) {
				console.log(e);
				return;
			}
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
				case "error":
					addToast(data.error);
					break;
				case "newGame":
				case "exited":
					setGameStore({
						currentTurn: data.boardState.currentTurn,
						guesses: data.boardState.guesses,
						gameStatus: data.boardState.gameStatus,
						keyboardStatus: data.boardState.keyboardStatus,
						players: data.boardState.players,
					});
					break;
				default:
					console.log("^^ invalid data type");
			}
		}

		newWs.onclose = () => {
			setWs(null);
			if (manualClose) return;
			const attempts = retries();
			if (attempts >= MAX_ATTEMPTS) {
				setReadyState(readyMap[ws()?.readyState ?? 3]);
				const err = { type: "joinError", message: "Unable to connect to server" } as Error
				addToast(err);
				return;
			}
			setReadyState("RECONNECTING");
			setRetries(prev => prev + 1);

			if (retryTimeout != null) clearTimeout(retryTimeout);
			retryTimeout = setTimeout(connectWebsocket, RETRY_INTERVAL);
		}
	}

	const sendMessage: SendMessage = (message: ClientMessage) => {
		const currentWs = ws();
		if (!currentWs || currentWs.readyState != WebSocket.OPEN) {
			const err = { type: "joinError", message: "Not connected to server" } as Error
			addToast(err);
			return;
		}
		try {
			const messageJson = JSON.stringify(message);
			currentWs.send(messageJson);
		} catch (e) {
			console.log(e);
		}
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


	return { readyState, sendMessage };

}

export default createWebsocket;
