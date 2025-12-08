import "../main.css";
import { gameStore } from "../store/gameStore";
import { Show } from "solid-js";
import JoinData from "../components/JoinData";

const Game = () => {
	return (
		<main class="bg-background-dark h-screen w-full">
			<Show when={gameStore.gameStatus == "inProgress"} fallback={<JoinData />}>
				<div class="bg-background-dark">Hello</div>
			</Show>
		</main>
	)
}

export default Game;
