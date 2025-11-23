import "../main.css";
import React, { useState } from "react";
import NavBar from "../components/NavBar";
import useWebsocketHandler, { type ClientMessage } from "../hooks/useWebSocketHandler";
import useGame from "../store/useGame";
import Join from "../components/Join";
import Game from "../components/Game";

const HomePage = () => {
	const { sendMessage } = useWebsocketHandler();
	const playerId = useGame(state => state.playerId);
	const gameId = useGame(state => state.gameId);
	const gameStatus = useGame(state => state.gameStatus);

	const createGame = () => {
		if (playerId != null) {
			const createMessage: ClientMessage = {action: "createGame", playerId}
			sendMessage(JSON.stringify(createMessage));
		}
	}

	const joinGame = (id: string) => {
		if (playerId != null && id.length == 5) {
			const joinMessage: ClientMessage = {action: "joinGame", playerId, gameId: id};
			sendMessage(JSON.stringify(joinMessage));
		}
	}

	const guessWord = (word: string) => {
		if (playerId == null || word.length != 5 || gameId == null) {
			return;
		}
		const guessMessage: ClientMessage = {action: "guessWord", playerId, gameId, word};
		sendMessage(JSON.stringify(guessMessage));
	}

	return (
		<main className="bg-black w-full h-screen text-white">
			<NavBar />
			{gameStatus ? 
				(<Game guessWord={guessWord} />):
				(<Join createGame={createGame} joinGame={joinGame}/>)
			}
		</main>
	)
}

export default HomePage;
