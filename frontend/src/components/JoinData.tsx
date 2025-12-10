import "../main.css";
import { gameStore } from "../store/gameStore";

const JoinData = () => {
	const clipboardCopy = `${window.location.origin}?join=${gameStore.gameId}`;

	return (
		<div class="w-full h-screen flex justify-center items-center bg-background-dark">
			<div class="bg-background shadow-s p-5 rounded-xl text-text space-y-2">
				<div class="space-x-2 flex items-center">
					<p>Game ID:</p>
					<p class="bg-background-light grow py-2 px-4 rounded-xl">{gameStore.gameId}</p>
				</div>
				<div class="flex gap-2">
					<p class="bg-background-light py-2 px-4 rounded-xl">{clipboardCopy}</p>
					<button onClick={() => navigator.clipboard.writeText(clipboardCopy)} class="bg-background-light py-2 px-4 rounded-xl hover:bg-green-800 cursor-pointer transition-colors duration-200">Copy</button>
				</div>
			</div>
		</div>
	)
}

export default JoinData;
