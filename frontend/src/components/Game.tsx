import React, { useCallback, useEffect, useRef, useState } from "react";
import "../main.css";
import useGame from "../store/useGame";
import Keyboard from "./Keyboard";

const Game = ({ guessWord }: { guessWord: (word: string) => void }) => {
	const guesses = useGame(state => state.guesses);
	const playerId = useGame(state => state.playerId);
	const currentTurn = useGame(state => state.currentTurn);
	const gameStatus = useGame(state => state.gameStatus)

	const [currentGuess, setCurrentGuess] = useState("");
	const [shownGuesses, setShownGuesses] = useState(guesses);

	const shakeRef = useRef<HTMLDivElement | null>(null)

	const handleKey = useCallback((char: string) => {
		if (currentTurn !== playerId) return;
		if (gameStatus != "inProgress") return;

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
	}, [currentTurn, currentGuess, playerId, guessWord, gameStatus]);

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
							ref={i === shownGuesses?.length ? shakeRef : null}
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

const Row = React.forwardRef<HTMLDivElement, RowProps>((props, ref) => {
	const { word, colors, flipRow } = props;
	const wordArray = Array.from({ length: 5 }, (_, i) => word[i] || null);

	return (
		<div ref={ref} className="grid grid-cols-5 gap-2 transition-all">
			{wordArray.map((letter, i) => (
				<Tile
					key={i}
					letter={letter}
					status={colors ? colors[i] : null}
					delay={`${i * 200}`}
					flipRow={flipRow}
					currentRow={colors == null && word.length > 0}
				/>
			))}
		</div>
	);
});

const Tile = ({
	letter,
	status,
	delay,
	flipRow,
	currentRow,
}: {
	letter: string | null;
	status: string | null;
	delay: string;
	flipRow: boolean;
	currentRow: boolean;
}) => {
	const [startAnimation, setStartAnimation] = useState(false);

	useEffect(() => {
		if (flipRow) setStartAnimation(true);
	}, [flipRow]);

	const tileState =
		status === "green"
			? "bg-green-800 border-green-800"
			: status === "yellow"
				? "bg-yellow-600 border-yellow-600"
				: status === "gray"
					? "bg-dark-gray border-dark-gray"
					: "border-light-gray";

	return (
		<div className={currentRow && letter ? "animate-pop" : ""}>
			<div
				style={{"--delay": `${delay}ms`, animationDelay: `${delay}ms` } as React.CSSProperties}
				className={`
					shadow-s rounded-md border aspect-square size-14 grid place-items-center text-3xl font-bold leading-none transition-all
					${tileState}
					${startAnimation && flipRow ? "wordle-flip" : ""}
					[transition-delay:var(--delay)]
				`}
			>
				{letter ?? ""}
			</div>
		</div>
	);
};

export default Game;

