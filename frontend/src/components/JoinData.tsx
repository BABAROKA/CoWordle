import { useNavigate } from "@solidjs/router";
import "../main.css";
import { gameStore, resetGame } from "../store/gameStore";
import { useWebsocket } from "../context/websocketContext";
import type { ClientMessage } from "../types";

const JoinData = () => {
	const { sendMessage } = useWebsocket();
	const navigate = useNavigate();

	const clipboardCopy = `${window.location.origin}?join=${gameStore.gameId}`;

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
		<div class="w-full h-screen flex justify-center items-center bg-background-dark">
			<div class="bg-background shadow-s p-5 rounded-xl text-text space-y-2">
				<div class="space-x-2 flex items-center">
					<p>Game ID:</p>
					<p class="bg-background-light grow py-2 px-4 rounded-md">{gameStore.gameId}</p>
					<button type="button" onClick={disconnect} class="bg-background-light py-2 w-16 rounded-md hover:bg-yellow-600 cursor-pointer transition-colors duration-200">Exit</button>
				</div>
				<div class="flex gap-2">
					<p class="bg-background-light py-2 px-4 rounded-md">{clipboardCopy}</p>
					<button type="button" onClick={() => navigator.clipboard.writeText(clipboardCopy)} class="bg-background-light w-16 py-2 rounded-md hover:bg-green-800 cursor-pointer transition-colors duration-200">Copy</button>
				</div>
			</div>
		</div>
	)
}

export default JoinData;
