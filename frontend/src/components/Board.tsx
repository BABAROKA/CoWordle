import "../main.css";
import { For, onCleanup, createSignal, createMemo, createEffect, type ParentComponent, onMount } from "solid-js";
import { gameStore } from "../store/gameStore";
import { useWebsocket } from "../context/websocketContext";
import type { ClientMessage, Guess, GameColor } from "../types";

const Board = () => {
	const [currentWord, setCurrentWord] = createSignal("");
	const [_, sendMessage] = useWebsocket();

	const emptyRows = Array.from({ length: 5 }, () => "");
	const indices = Array.from({ length: 5 });

	const guessRows = createMemo(() =>
		gameStore.guesses.map(guess => ({
			word: guess.word,
			status: guess.status ?? []
		} as Guess))
	);

	const dynamicRows = createMemo(() => {
		if (gameStore.guesses.length >= 6) {
			return [];
		}
		const currentRow = currentWord();
		const paddingRows = emptyRows.slice(0, 5 - gameStore.guesses.length);
		return [currentRow, ...paddingRows];
	})

	createEffect(() => {
		if (gameStore.guesses.length > 0) {
			setCurrentWord("");
		}
	})

	const sendGuess = () => {
		if (!gameStore.playerId || !gameStore.gameId) return;

		const guessMessage: ClientMessage = {
			action: "guessWord",
			playerId: gameStore.playerId,
			gameId: gameStore.gameId,
			word: currentWord(),
		}

		sendMessage(guessMessage);
	}

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.repeat) return;
		if (gameStore.currentTurn != gameStore.playerId) return;
		if (gameStore.players.length < 2) return;
		if (gameStore.gameStatus != "inProgress") return;

		let uppercaseKey = event.key.toUpperCase();

		if (uppercaseKey.match(/^[A-Z]$/) && currentWord().length < 5) {
			setCurrentWord(prev => prev + uppercaseKey);
		}
		if (uppercaseKey == "ENTER" && currentWord().length == 5) {
			sendGuess();
		}
		if (uppercaseKey == "BACKSPACE") {
			if (currentWord().length > 0) setCurrentWord(prev => prev.slice(0, -1));
		}
	}

	onMount(() => {
		window.addEventListener("keydown", handleKeyPress);
		onCleanup(() => {
			window.removeEventListener("keydown", handleKeyPress);
		})
	})

	return (
		<div class="grid grid-rows-6 gap-2 text-text">
			<For each={guessRows()}>
				{(guess, index) => {
					const shouldFlip = index() == gameStore.guesses.length - 1;
					return (
						<BoardRow flip={shouldFlip}>
							<For each={indices}>
								{(_, charIndex) =>
									<BoardTile
										letter={guess.word[charIndex()]}
										state={guess.status[charIndex()]}
										index={charIndex()}
										flip={shouldFlip}
									/>
								}
							</For>
						</BoardRow>
					)
				}}
			</For>
			<For each={dynamicRows()}>
				{(word) =>
					<BoardRow flip={false}>
						<For each={indices}>
							{(_, charIndex) =>
								<BoardTile
									letter={word[charIndex()]}
									state={"default"}
									index={charIndex()}
									flip={false}
								/>
							}
						</For>
					</BoardRow>}
			</For>
		</div>
	)
}

const BoardRow: ParentComponent<{ flip: boolean }> = (props) => {
	return (
		<div class="grid grid-cols-5 gap-2"
			classList={{
				"wordle-flip": props.flip,
			}}
		>
			{props.children}
		</div>
	)
}

const BoardTile = (props: { letter: string, state: GameColor | "default", index: number, flip: boolean }) => {

	const color: Record<GameColor | "default", { tailwind: string, value: string }> = {
		green: { tailwind: "bg-green-800 border-green-800", value: "#016630" },
		yellow: { tailwind: "bg-yellow-600 border-yellow-600", value: "#d08700" },
		gray: { tailwind: "bg-dark-gray border-dark-gray", value: "#484848" },
		default: { tailwind: "border-light-gray", value: "#9e9e9e" },
	};
	const data = color[props.state] ?? color.default;

	return (
		<div
			style={{ "--i": props.index, "--tileColor": data.value }}
		>
			<div
				class="size-16 border-2 flex justify-center items-center text-3xl font-bold rounded-md"
				classList={{
					"border-light-gray": props.flip,
					[data.tailwind]: !props.flip,
				}}
			>
				{props.letter}
			</div>
		</div>
	)
}

export default Board;
