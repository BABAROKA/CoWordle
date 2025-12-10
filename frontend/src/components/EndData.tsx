import { useWebsocket } from "../context/websocketContext";
import "../main.css";
import { gameStore, setGameStore } from "../store/gameStore";
import type { ClientMessage } from "../types";

const EndData = () => {
	const [_, sendMessage] = useWebsocket();

	const sendNewGame = () => {
		if (!gameStore.gameId) return;
		const newGameMessage: ClientMessage = {action: "newGame", gameId: gameStore.gameId}
		sendMessage(newGameMessage);
	}

	return (
		<div class="w-full h-screen flex justify-center items-center bg-background-dark">
			<div class="bg-background shadow-s p-5 rounded-xl text-text space-y-2 w-80">
				<div class="space-x-2 flex items-center">
					<p>You {gameStore.gameStatus} to:</p>
					<p class="bg-background-light grow py-2 px-4 rounded-xl text-center">{gameStore.solution}</p>
				</div>
				<div class="flex gap-2">
					<button onClick={sendNewGame} class="w-full text-nowrap grow bg-background-light py-2 px-4 rounded-xl hover:bg-green-800 cursor-pointer transition-colors duration-200">New Game</button>
					<button onClick={() => setGameStore({gameId: null})} class="bg-background-light py-2 px-4 rounded-xl hover:bg-yellow-600 cursor-pointer transition-colors duration-200">Exit</button>
				</div>
			</div>
		</div>
	)
}

export default EndData;
