import { For, onCleanup, createSignal, createMemo, createEffect } from "solid-js";
import { gameStore } from "../store/gameStore";
import { useWebsocket } from "../context/websocketContext";
import type { ClientMessage } from "../types";

const Board = () => {
	const [currentWord, setCurrentWord] = createSignal("");
	const [_, sendMessage] = useWebsocket();
	const rowWord = createMemo(() => {
		const guessList = gameStore.guesses.map(g => g.word);
		const contentList = [...guessList, currentWord()];
		const listPadding = Array.from({ length: Math.max(0, 6 - contentList.length) }, () => "");

		return [...contentList, ...listPadding].slice(0, 6);
	})

	createEffect(() => {
		if (gameStore.guesses) {
			setCurrentWord("");
		}
	})

	const sendGuess = () => {
		if (gameStore.playerId == null || gameStore.gameId == null) return;

		const guessMessage: ClientMessage = {
			action: "guessWord",
			playerId: gameStore.playerId,
			gameId: gameStore.gameId,
			word: currentWord(),
		}

		sendMessage(guessMessage);
	}

	addEventListener("keydown", (event) => handleKeyPress(event));
	onCleanup(() => {
		removeEventListener("keydown", (event) => handleKeyPress(event));
	})

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

	return (
		<div class="grid grid-rows-6 gap-2 text-text">
			<For each={rowWord()}>
				{(word, index) => <BoardRow word={word} flip={index() == gameStore.guesses.length - 1} />}
			</For>
		</div>
	)
}

const BoardRow = (props: { word: string, flip: boolean }) => {
	const letters = Array.from({ length: 5 }, (_, i) => props.word[i] || "");
	return (
		<div class={`grid grid-cols-5 gap-2 ${props.flip? "wordle-flip": ""}`}>
			<For each={letters}>
				{(letter, index) => <BoardTile letter={letter} index={index()} />}
			</For>
		</div>
	)
}

const BoardTile = (props: { letter: string, index: number }) => {
	return (
		<div style={{"--tileColor": "#016630", "--i": props.index}} class="size-16 border-2 border-dark-gray rounded-md flex justify-center items-center text-3xl font-bold">
			{props.letter}
		</div>
	)
}

export default Board;
