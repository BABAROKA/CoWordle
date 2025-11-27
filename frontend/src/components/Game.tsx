import React, { useCallback, useEffect, useState } from "react";
import "../main.css";
import useGame from "../store/useGame";
import Keyboard from "./Keyboard";

const Game = ({ guessWord }: { guessWord: (word: string) => void }) => {
	const guesses = useGame(state => state.guesses);
	const playerId = useGame(state => state.playerId);
	const currentTurn = useGame(state => state.currentTurn);
	const gameStatus = useGame(state => state.gameStatus)
	const players = useGame(state => state.players);

	const [currentGuess, setCurrentGuess] = useState("");
	const [shownGuesses, setShownGuesses] = useState(guesses);

	const handleKey = useCallback((char: string) => {
		if (currentTurn !== playerId) return;
		if (gameStatus != "inProgress") return;
		if (players.length != 2) return;

		const key = char.toUpperCase();

		if (key.match(/^[A-Z]$/) && currentGuess.length < 5) {
			setCurrentGuess((prev) => prev + key);
		}

		if (key === "ENTER" && currentGuess.length === 5) {
			guessWord(currentGuess);
		}

		if ((key === "BACKSPACE" || key == "⌫") && currentGuess.length > 0) {
			setCurrentGuess((prev) => prev.slice(0, -1));
		}
	}, [currentTurn, currentGuess, playerId, guessWord, gameStatus, players]);

	const onKeyPress = useCallback(
		(e: KeyboardEvent) => {
			handleKey(e.key);
		},
		[handleKey]
	);

	useEffect(() => {
		const prevLength = shownGuesses?.length || 0;
		const currentLength = guesses?.length || 0;

		if (currentLength > prevLength) {
			setCurrentGuess("");
			setShownGuesses(guesses);
		}
	}, [guesses, shownGuesses]);

	useEffect(() => {
		window.addEventListener("keydown", onKeyPress);
		return () => window.removeEventListener("keydown", onKeyPress);
	}, [onKeyPress]);

	return (
		<div className="w-full flex flex-col gap-10 items-center">
			<div className="grid grid-rows-6 gap-2 mt-20">
				{Array.from({ length: 6 }).map((_, i) => {
					let rowWord = "";
					let colors: string[] | null = null;

					if (shownGuesses) {
						if (i < shownGuesses.length) {
							rowWord = shownGuesses[i].word ?? "";
							colors = shownGuesses[i].status;
						} else if (i === shownGuesses.length) {
							rowWord = currentGuess;
						}
					}

					return (
						<Row
							key={i}
							word={rowWord}
							colors={colors}
							flipRow={shownGuesses ? i === shownGuesses.length - 1 : false}
						/>
					);
				})}
			</div>
			<Keyboard handleKey={handleKey} />
			{currentTurn == playerId ? <p>Your Turn</p> : <p>Oponents Turn</p>}
		</div>
	);
};

interface RowProps {
	word: string;
	colors: string[] | null;
	flipRow: boolean;
};

const Row = ({ word, colors, flipRow }: RowProps) => {
	const wordArray = Array.from({ length: 5 }, (_, i) => word[i] || null);

	return (
		<div className={`grid grid-cols-5 gap-2 transition-all ${flipRow ? "wordle-flip" : ""}`}>
			{wordArray.map((letter, i) => (
				<Tile
					key={i}
					letter={letter}
					status={colors ? colors[i] : null}
					i={i}
					currentRow={colors == null && word.length > 0}
					flipRow={flipRow}
				/>
			))}
		</div>
	);
};

interface GameTile {
	letter: string | null;
	status: string | null;
	i: number,
	currentRow: boolean;
	flipRow: boolean
}

const Tile = ({ letter, status, i, currentRow, flipRow }: GameTile) => {
	const players = useGame(state => state.players);

	let animationColor = "";
	let guessesColor = "";

	if (status == "green") {
		animationColor = "#016630";
		guessesColor = "bg-green-800 border-green-800";
	} else if (status == "yellow") {
		animationColor = "#d08700";
		guessesColor = "bg-yellow-600 border-yellow-600"
	} else if (status == "gray") {
		animationColor = "#484848";
		guessesColor = "bg-dark-gray border-dark-gray"
	}

	return (
		<div className={currentRow && letter ? "animate-pop" : ""} style={{ "--i": i } as React.CSSProperties}>
			<div
				style={{ "--tileColor": animationColor } as React.CSSProperties}
				className={`${!(flipRow && letter) ? guessesColor : "border-light-gray"} ${players.length == 2 ? "" : "bg-light-gray"} shadow-s rounded-md border aspect-square size-14 grid place-items-center text-3xl font-bold leading-none`}
			>
				{letter ?? ""}
			</div>
		</div>
	);
};

export default Game;

