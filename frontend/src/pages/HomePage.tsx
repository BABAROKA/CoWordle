import "../main.css";
import React, { useState } from "react";
import useWebsocketHandler, { type ClientMessage } from "../hooks/useWebSocketHandler";
import useGame from "../store/useGame";
import Join from "../components/Join";
import Game from "../components/Game";
import Waiting from "../components/Waiting";
import End from "../components/End";

const HomePage = () => {
	const { sendMessage } = useWebsocketHandler();
	const playerId = useGame(state => state.playerId);
	const gameId = useGame(state => state.gameId);
	const gameStatus = useGame(state => state.gameStatus);
	const setGameId = useGame(state => state.setGameId);

	const createGame = () => {
		if (playerId != null) {
			const createMessage: ClientMessage = { action: "createGame", playerId }
			sendMessage(JSON.stringify(createMessage));
		}
	}

	const joinGame = (id: string) => {
		if (playerId != null && id.length == 5) {
			const joinMessage: ClientMessage = { action: "joinGame", playerId, gameId: id };
			sendMessage(JSON.stringify(joinMessage));
			setGameId(id);
		}
	}

	const guessWord = (word: string) => {
		if (playerId == null || word.length != 5 || gameId == null) {
			return;
		}
		const guessMessage: ClientMessage = { action: "guessWord", playerId, gameId, word };
		sendMessage(JSON.stringify(guessMessage));
	}

	const newGame = () => {
		if (playerId == null || gameId == null) {
			return;
		}
		const newGameMessage: ClientMessage = {action: "newGame", gameId}
		sendMessage(JSON.stringify(newGameMessage));
	}

	return (
		<main className="bg-black w-full h-screen text-white">
			{gameStatus == null ?
				(<Join createGame={createGame} joinGame={joinGame} />) :
				gameStatus == "waiting" ?
					(<Waiting />) :
					gameStatus == "inProgress" ?
						(<Game guessWord={guessWord} />):
						(<End newGame={newGame}/>)
			}
		</main>
	)
}

export default HomePage;
