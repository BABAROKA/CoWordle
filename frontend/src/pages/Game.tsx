import "../main.css";
import { gameStore } from "../store/gameStore";
import { createEffect, createSignal, Match, Switch } from "solid-js";
import JoinData from "../components/JoinData";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import { useNavigate } from "@solidjs/router";
import EndData from "../components/EndData";
import NavBar from "../components/NavBar";

const Game = () => {

	const navigate = useNavigate();
	const [showEnd, setShowEnd] = createSignal(false);

	createEffect(() => {
		if (gameStore.gameId == null) {
			navigate("/", { replace: true });
		}
	})

	createEffect(() => {
		if (gameStore.gameStatus == "lost" || gameStore.gameStatus == "won") {
			setTimeout(() => {
				setShowEnd(true);
			}, 2200)
			return;
		}
		setShowEnd(false);
	});

	return (
		<main class="bg-background-dark h-screen w-full text-center">
			<NavBar />
			<Switch fallback={
				<div class="bg-background-dark w-full h-screen flex flex-col justify-center items-center gap-6">
					<Board />
					<Keyboard />
				</div>
			}>
				<Match when={gameStore.gameStatus == "waiting" && gameStore.players.length < 2}>
					<JoinData />
				</Match>
				<Match when={showEnd()}>
					<EndData />
				</Match>
			</Switch>
		</main>
	)
}

export default Game;
