import { createSignal } from "solid-js";
import { setGameStore, gameStore } from "../store/gameStore";
import { onCleanup } from "solid-js";
import type { ClientMessage, ServerMessage, Ready} from "../types";

const websockerUrl = import.meta.env.VITE_WEBSOCKET_URL;

const createWebsocket = () => {
	const [readyState, setReadyState] = createSignal<Ready>("CONNECTING");

	const ws: WebSocket = new WebSocket(websockerUrl);

	const sendMessage = (message: ClientMessage) => {
		if (readyState() != "OPEN") {
			return;
		}
		const messageJson = JSON.stringify(message);
		ws.send(messageJson);
	}

	ws.onopen = () => {
		const connectMessage: ClientMessage = {
			action: "connect",
			playerId: gameStore.playerId,
			gameId: gameStore.gameId
		}
		ws.send(JSON.stringify(connectMessage));
		setReadyState("OPEN");
	};

	ws.onmessage = (event) => {
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

	ws.onclose = () => {
		setReadyState("CLOSED");
	}

	ws.onerror = () => {
		setReadyState("CLOSED");
	}

	onCleanup(() => {
		if (ws.readyState == ws.OPEN || ws.readyState == ws.CONNECTING) {
			ws.close();
		}
	})

	return [readyState, sendMessage];

}

export default createWebsocket;
