import React, { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import useGame from "../store/useGame";

export type ClientMessage =
	| { action: "createGame", playerId: string }
	| { action: "joinGame", playerId: string, gameId: string }
	| { action: "guessWord", playerId: string, gameId: string, word: string }
	| { action: "newGame", gameId: string }
	| {action: "connect", gameId: string | null, playerId: string | null};

const WS_URL = 'ws://localhost:5905/ws';
const useWs = (useWebSocket as any).default as typeof useWebSocket

const useWebsocketHandler = () => {
	const setGameId = useGame(state => state.setGameId);
	const setPlayerId = useGame(state => state.setPlayerId);
	const setGameStatus = useGame(state => state.setGameStatus)
	const setGameData = useGame(state => state.setGameData);
	const setSolution = useGame(state => state.setSolution);
	const setReadyState = useGame(state => state.setReadyState);
	const gameId = useGame(state => state.gameId);
	const playerId = useGame(state => state.playerId);

	const { sendMessage, lastMessage, readyState } = useWs(WS_URL, {
		reconnectAttempts: 2,
		reconnectInterval: 2000,
		onOpen: () => {
			const connectMessage: ClientMessage = {action: "connect", gameId, playerId};
			sendMessage(JSON.stringify(connectMessage));
		},
	});

	const handleMessage = (message: MessageEvent) => {
		if (!message) return;
		const data = JSON.parse(message.data);

		switch (data.status) {
			case "created":
				console.log(data);
				setGameId(data.gameId);
				setGameStatus(data.gameStatus);
				break;
			case "joined":
				console.log(data);
				setGameData(data.boardState.currentTurn, data.boardState.guesses, data.boardState.gameStatus, data.boardState.keyboardStatus, data.boardState.players);
				setGameId(data.gameId);
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
				console.log('Unknown message type:', data);
		}
	}

	useEffect(() => {
		if (!lastMessage) return;
		handleMessage(lastMessage);
	}, [lastMessage])

	useEffect(() => {
		setReadyState(readyState);
	}, [readyState])

	return {
		sendMessage,
	}
}

export default useWebsocketHandler;
