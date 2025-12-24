import "../main.css";
import { For, onCleanup, createMemo, createEffect, type ParentComponent, onMount } from "solid-js";
import { gameStore } from "../store/gameStore";
import type { Guess, KeyColor } from "../types";
import { useGuess } from "../context/guessContext";

const Board = () => {
	const { currentGuess, actions } = useGuess();

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
		const currentRow = currentGuess();
		const paddingRows = emptyRows.slice(0, 5 - gameStore.guesses.length);
		return [currentRow, ...paddingRows];
	})

	createEffect(() => {
		if (gameStore.guesses.length <= 6) {
			actions.resetGuess();
		}
	})

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.repeat) return;
		if (gameStore.players.length < 2) return;
		if (gameStore.gameStatus != "inProgress") return;

		let uppercaseKey = event.key.toUpperCase();

		if (uppercaseKey.match(/^[A-Z]$/)) {
			actions.addLetter(uppercaseKey);
		}
		if (uppercaseKey == "ENTER" && currentGuess().length == 5) {
			actions.sendGuess();
		}
		if (uppercaseKey == "BACKSPACE") {
			actions.removeLetter();
		}
	}

	onMount(() => {
		window.addEventListener("keydown", handleKeyPress);
		onCleanup(() => {
			window.removeEventListener("keydown", handleKeyPress);
		})
	})

	return (
		<div class="grid grid-rows-6 gap-1 sm:gap-2 text-text w-[min(350px,85vw)]">
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
										pop={false}
									/>
								}
							</For>
						</BoardRow>
					)
				}}
			</For>
			<For each={dynamicRows()}>
				{(word, index) =>
					<BoardRow flip={false}>
						<For each={indices}>
							{(_, charIndex) => {
								const currentLetter = currentGuess().length - 1 == charIndex();
								const currentRow = index() == Math.max(0, gameStore.guesses.length - 1);

								return (<BoardTile
									letter={word[charIndex()]}
									state={"default"}
									index={charIndex()}
									flip={false}
									pop={currentLetter && currentRow}
								/>)
							}}
						</For>
					</BoardRow>}
			</For>
		</div>
	)
}

const BoardRow: ParentComponent<{ flip: boolean }> = (props) => {
	return (
		<div class="grid grid-cols-5 gap-1 sm:gap-2 w-full"
			classList={{
				"wordle-flip": props.flip,
			}}
		>
			{props.children}
		</div>
	)
}

interface TileProps {
	letter: string,
	state: KeyColor | "default",
	index: number,
	flip: boolean,
	pop: boolean,
}

const BoardTile = (props: TileProps) => {

	const color: Record<KeyColor | "default", { tailwind: string, value: string }> = {
		green: { tailwind: "bg-green-800 border-green-800", value: "#016630" },
		yellow: { tailwind: "bg-yellow-600 border-yellow-600", value: "#d08700" },
		gray: { tailwind: "bg-dark-gray border-dark-gray", value: "#3a3a3a" },
		default: { tailwind: "border-light-gray", value: "#808080" },
	};
	const data = color[props.state] ?? color.default;

	return (
		<div
			classList={{
				"pop-animtion": props.pop,
			}}
			style={{ "--i": props.index, "--tileColor": data.value }}
		>
			<div
				class="aspect-square border-2 flex justify-center items-center text-3xl font-bold rounded-sm"
				classList={{
					"border-light-gray": props.flip,
					[data.tailwind]: !props.flip,
					"text-light-gray": (gameStore.currentTurn != gameStore.playerId && props.state == "default"),
				}}
			>
				{props.letter}
			</div>
		</div>
	)
}

export default Board;
