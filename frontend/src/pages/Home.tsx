import "../main.css";
import { createSignal, createEffect } from "solid-js";
import { useWebsocket } from "../context/websocketContext";
import type { ClientMessage } from "../types";
import { gameStore } from "../store/gameStore";
import { useNavigate, useSearchParams } from "@solidjs/router";
import Toast from "../components/Toast";

const Home = () => {
	const [inputId, setInputId] = createSignal<string>("")
	const [_, sendMessage] = useWebsocket();

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	createEffect(() => {
		if (!searchParams.join) return;
		const id = [searchParams.join].flat().join(",");
		joinGame(id);
	});

	createEffect(() => {
		if (gameStore.gameStatus != "pending") {
			if (!document.startViewTransition) {
				navigate("/game", { replace: true });
				return;
			}
			document.startViewTransition(() => navigate("/game"));
		}
	});

	const createGame = () => {
		if (gameStore.playerId == null) {
			return;
		}

		const createMessage: ClientMessage = { action: "createGame", playerId: gameStore.playerId };
		sendMessage(createMessage);
	}

	const joinGame = (id: string | null) => {
		const trueId = id ?? inputId();
		if (gameStore.playerId == null || trueId.length != 5) {
			return;
		}

		const joinMessage: ClientMessage = { action: "joinGame", gameId: trueId, playerId: gameStore.playerId };
		sendMessage(joinMessage);
	}

	return (
		<main class="relative overflow-hidden bg-background-dark w-full h-screen flex flex-col gap-5 justify-center items-center">
			<Toast />
			<p class="text-4xl font-extrabold text-text" style={{ "view-transition-name": "title" }}>CoWordle</p>
			<div class="p-5 bg-background rounded-xl text-center shadow-s text-text font-bold space-y-2">
				<button type="button" onClick={createGame} class="bg-background-light hover:bg-green-800 w-full rounded-md cursor-pointer p-2 transition-colors duration-200">Create Game</button>
				<div class="w-full flex gap-2">
					<input class="bg-background-light rounded-md uppercase outline-none text-center" onInput={(event) => setInputId(event.target.value)} type="text" />
					<button class="bg-background-light hover:bg-yellow-600 cursor-pointer rounded-md p-2 transition-colors duration-200" onClick={() => joinGame(null)}>Join</button>
				</div>
			</div>
		</main>
	)
}

export default Home;
