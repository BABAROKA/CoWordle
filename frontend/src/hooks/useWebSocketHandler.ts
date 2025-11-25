import React, { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import useGame from "../store/useGame";

export type ClientMessage =
	| { action: "createGame", playerId: string }
	| { action: "joinGame", playerId: string, gameId: string }
	| { action: "guessWord", playerId: string, gameId: string, word: string }
	| { action: "newGame", gameId: string };

const WS_URL = 'ws://localhost:5905/ws';
const useWs = (useWebSocket as any).default as typeof useWebSocket

const useWebsocketHandler = () => {
	const { sendMessage, lastMessage, readyState } = useWs(WS_URL);

	const setGameId = useGame(state => state.setGameId);
	const setPlayerId = useGame(state => state.setPlayerId);
	const setGameStatus = useGame(state => state.setGameStatus)
	const setGameData = useGame(state => state.setGameData);
	const setSolution = useGame(state => state.setSolution);

	const handleMessage = (message: MessageEvent) => {
		if (!message) return;
		const data = JSON.parse(message.data);

		switch (data.action) {
			case "createdStatus":
				console.log(data);
				setGameId(data.gameId);
				setGameStatus(data.gameStatus);
				break;
			case "joinStatus":
				console.log(data);
				setGameData(data.boardState.currentTurn, data.boardState.guesses, data.boardState.gameStatus, data.boardState.keyboardStatus, data.boardState.players);
				break;
			case "welcome":
				console.log(data);
				setPlayerId(data.playerId);
				break;
			case "newGame":
				console.log(data);
				setGameData(data.boardState.currentTurn, data.boardState.guesses, data.boardState.gameStatus, data.boardState.keyboardStatus, data.boardState.players);
				break;
			case "gameUpdate":
				console.log(data);
				setGameData(data.boardState.currentTurn, data.boardState.guesses, data.boardState.gameStatus, data.boardState.keyboardStatus, data.boardState.players);
				setSolution(data.solution);
				break;
			case "error":
				console.log(data);
				break;
			default:
				console.log('Unknown message type:', data.type);
		}
	}

	useEffect(() => {
		if (!lastMessage) return;
		handleMessage(lastMessage);
	}, [lastMessage])

	return {
		sendMessage,
		readyState,
	}
}

export default useWebsocketHandler;
