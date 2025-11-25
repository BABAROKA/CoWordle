import React, { useCallback, useEffect, useRef, useState } from "react";
import "../main.css";
import useGame from "../store/useGame";

const Game = ({ guessWord }: { guessWord: (word: string) => void }) => {
	const guesses = useGame((state) => state.guesses);
	const playerId = useGame((state) => state.playerId);
	const currentTurn = useGame((state) => state.currentTurn);

	const [currentGuess, setCurrentGuess] = useState("");
	const [shownGuesses, setShownGuesses] = useState(guesses);

	const shakeRef = useRef<HTMLDivElement | null>(null)

	const handleKey = useCallback(
		(e: KeyboardEvent) => {
			if (currentTurn !== playerId) return;

			const key = e.key.toUpperCase();

			if (key.match(/^[A-Z]$/) && currentGuess.length < 5) {
				setCurrentGuess((prev) => prev + key);
			}

			if (key === "ENTER" && currentGuess.length === 5) {
				guessWord(currentGuess);
			}

			if (key === "BACKSPACE" && currentGuess.length > 0) {
				setCurrentGuess((prev) => prev.slice(0, -1));
			}
		},
		[currentGuess, currentTurn, playerId, guessWord]
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
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [handleKey]);

	return (
		<div className="w-full flex justify-center">
			<div className="grid grid-rows-6 gap-2 mt-16">
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
					delay={`${i * 100}`}
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
	const guesses = useGame((state) => state.guesses);

	useEffect(() => {
		setStartAnimation(true);
	}, [guesses]);

	const tileState =
		status === "green"
			? "bg-green-700 border-green-700"
			: status === "yellow"
				? "bg-yellow-400 border-yellow-400"
				: status === "gray"
					? "bg-gray-800 border-gray-800"
					: "border-gray-400";

	return (
		<div className={currentRow && letter ? "animate-pop" : ""}>
			<div
				style={{ "--delay": `${delay}ms` } as React.CSSProperties}
				className={`
					${tileState}
					${startAnimation && flipRow ? "wordle-flip" : ""}
					transition-colors
					[transition-delay:var(--delay)]
					[animation-delay:var(--delay)]
					border aspect-square size-14
					grid place-items-center text-3xl font-bold leading-none
				`}
			>
				{letter ?? ""}
			</div>
		</div>
	);
};

export default Game;

