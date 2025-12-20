import "../main.css";
import { gameStore } from "../store/gameStore";
import { createEffect, createSignal, Show } from "solid-js";
import JoinData from "../components/JoinData";
import Board from "../components/Board";
import Keyboard from "../components/Keyboard";
import { useNavigate } from "@solidjs/router";
import EndData from "../components/EndData";
import NavBar from "../components/NavBar";
import GuessProvider from "../providers/guessProvider";
import Toast from "../components/Toast";

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
		<main class="relative bg-background-dark h-dvh w-full text-center overflow-hidden">
			<Toast />
			<NavBar />
			<Show when={gameStore.gameStatus != "waiting" && gameStore.players.length == 2} fallback={
				<JoinData />

			}>
				<div class="bg-background-dark w-full h-screen flex flex-col justify-center items-center gap-6">
					<Show when={showEnd()}>
						<EndData />
					</Show>
					<GuessProvider>
						<Board />
						<Keyboard />
					</GuessProvider>
				</div>
			</Show>
		</main>
	)
}

export default Game;
