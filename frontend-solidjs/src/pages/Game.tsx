import "../main.css";
import { gameStore } from "../store/gameStore";
import { Show } from "solid-js";
import JoinData from "../components/JoinData";
import Board from "../components/Board";

const Game = () => {
	return (
		<main class="bg-background-dark h-screen w-full">
			<Show when={gameStore.gameStatus == "inProgress"} fallback={<JoinData />}>
				<div class="bg-background-dark w-full h-screen flex justify-center items-center">
					<Board />
				</div>
			</Show>
		</main>
	)
}

export default Game;
