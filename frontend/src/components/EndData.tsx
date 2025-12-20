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
		<div class="fixed bg-transparent w-[min(480px,80vw)] h-64 sm:bg-background sm:shadow-m flex justify-center items-center z-20 rounded-xl">
			<div class="fixed bg-background sm:bg-background-light shadow-s p-5 rounded-lg text-text space-y-2 w-[min(90vw,320px)]">
				<div class="space-x-2 flex items-center">
					<p class="text-nowrap">You {gameStore.gameStatus} to:</p>
					<p class="bg-background-light sm:bg-dark-gray grow py-2 px-4 rounded-md text-center">{gameStore.solution}</p>
				</div>
				<div class="flex gap-2">
					<button type="button" onClick={sendNewGame} class="w-full text-nowrap grow bg-background-light sm:bg-dark-gray py-2 px-4 rounded-md hover:bg-green-800 cursor-pointer transition-colors duration-200">New Game</button>
					<button type="button" onClick={disconnect} class="bg-background-light sm:bg-dark-gray py-2 px-4 rounded-md hover:bg-yellow-600 cursor-pointer transition-colors duration-200">Exit</button>
				</div>
			</div>
		</div>
	)
}

export default EndData;
