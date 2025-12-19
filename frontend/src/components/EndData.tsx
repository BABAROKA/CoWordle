import { useNavigate } from "@solidjs/router";
import { useWebsocket } from "../context/websocketContext";
import "../main.css";
import { gameStore, resetGame } from "../store/gameStore";
import type { ClientMessage } from "../types";

const EndData = () => {
	const { sendMessage } = useWebsocket();
	const navigate = useNavigate();

	const sendNewGame = () => {
		if (!gameStore.gameId) return;
		const newGameMessage: ClientMessage = { action: "newGame" };
		sendMessage(newGameMessage);
	}

	const disconnect = () => {
		if (!gameStore.playerId || !gameStore.gameId) {
			return;
		}
		const disconnectMessage: ClientMessage = { action: "disconnectPlayer" };
		sendMessage(disconnectMessage);
		resetGame();
		navigate("/", { replace: true });
	}

	return (
		<div class="fixed w-120 h-64 bg-background shadow-m flex justify-center items-center z-20 rounded-lg">
			<div class="fixed bg-background-light shadow-s p-5 rounded-xl text-text space-y-2 w-80">
				<div class="space-x-2 flex items-center">
					<p>You {gameStore.gameStatus} to:</p>
					<p class="bg-dark-gray grow py-2 px-4 rounded-xl text-center">{gameStore.solution}</p>
				</div>
				<div class="flex gap-2">
					<button type="button" onClick={sendNewGame} class="w-full text-nowrap grow bg-dark-gray py-2 px-4 rounded-xl hover:bg-green-800 cursor-pointer transition-colors duration-200">New Game</button>
					<button type="button" onClick={disconnect} class="bg-dark-gray py-2 px-4 rounded-xl hover:bg-yellow-600 cursor-pointer transition-colors duration-200">Exit</button>
				</div>
			</div>
		</div>
	)
}

export default EndData;
