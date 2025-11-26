import "../main.css";
import React, { useEffect, useCallback } from "react";
import useWebsocketHandler, { type ClientMessage } from "../hooks/useWebSocketHandler";
import useGame from "../store/useGame";
import Join from "../components/Join";
import Game from "../components/Game";
import End from "../components/End";
import { useSearchParams } from "react-router-dom";

const HomePage = () => {
	const { sendMessage } = useWebsocketHandler();
	const playerId = useGame(state => state.playerId);
	const gameId = useGame(state => state.gameId);
	const gameStatus = useGame(state => state.gameStatus);
	const setGameId = useGame(state => state.setGameId);

	const [searchParams, setSearchParams] = useSearchParams();
	const joinCode = searchParams.get("join");

	const createGame = useCallback(() => {
		if (playerId != null) {
			const createMessage: ClientMessage = { action: "createGame", playerId }
			sendMessage(JSON.stringify(createMessage));
		}
	}, [playerId, sendMessage])

	const joinGame = useCallback((id: string) => {
		if (playerId != null && id.length == 5) {
			const joinMessage: ClientMessage = { action: "joinGame", playerId, gameId: id };
			sendMessage(JSON.stringify(joinMessage));
			setGameId(id);
			setSearchParams({});
		}
	}, [sendMessage, playerId, setGameId])

	const guessWord = useCallback((word: string) => {
		if (playerId == null || word.length != 5 || gameId == null) {
			return;
		}
		const guessMessage: ClientMessage = { action: "guessWord", playerId, gameId, word };
		sendMessage(JSON.stringify(guessMessage));
	}, [playerId, gameId, sendMessage])

	const newGame = useCallback(() => {
		if (playerId == null || gameId == null) {
			return;
		}
		const newGameMessage: ClientMessage = { action: "newGame", gameId }
		sendMessage(JSON.stringify(newGameMessage));
	}, [playerId, gameId, sendMessage])

	useEffect(() => {
		if (joinCode) {
			joinGame(joinCode);
		}
	}, [joinCode, searchParams, joinGame]);

	return (
		<main className="bg-background-dark w-full h-screen text-text">
			{gameStatus == null || gameStatus == "waiting" ?
				<Join createGame={createGame} joinGame={joinGame} /> :
				gameStatus != "inProgress" ?
					<>
						<End newGame={newGame} />
						<Game guessWord={guessWord} />

					</> :
					<Game guessWord={guessWord} />
			}
		</main>
	)
}

export default HomePage;
