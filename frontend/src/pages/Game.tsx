import "../main.css";
import { gameStore } from "../store/gameStore";
import { createEffect, Match, Switch } from "solid-js";
import JoinData from "../components/JoinData";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import { useNavigate } from "@solidjs/router";
import EndData from "../components/EndData";
import NavBar from "../components/NavBar";

const Game = () => {

	const navigate = useNavigate();

	createEffect(() => {
		if (gameStore.gameId == null) {
			navigate("/", { replace: true });
		}
	})

	return (
		<main class="bg-background-dark h-screen w-full text-center">
			<NavBar />
			<Switch fallback={<JoinData />}>
				<Match when={gameStore.gameStatus == "inProgress"}>
					<div class="bg-background-dark w-full h-screen flex flex-col justify-center items-center gap-6">
						<Board />
						<Keyboard />
					</div>
				</Match>
				<Match when={gameStore.gameStatus == "lost" || gameStore.gameStatus == "won"}>
					<EndData />
				</Match>
			</Switch>
		</main>
	)
}

export default Game;
