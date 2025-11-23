import React, { useCallback, useEffect, useState } from "react";
import "../main.css";
import useGame from "../store/useGame";

const Game = ({ guessWord }: { guessWord: (word: string) => void }) => {

	const [currentGuess, setCurrentGuess] = useState("");
	const guesses = useGame(state => state.guesses);
	const playerId = useGame(state => state.playerId);
	const currentTurn = useGame(state => state.currentTurn);

	const handleKey = useCallback((e: KeyboardEvent) => {
		if (currentTurn != playerId) {
			return;
		}
		const key = e.key.toUpperCase();
		if (key.match(/^[a-zA-Z]$/) && currentGuess.length < 5) {
			setCurrentGuess(prev => prev + key);
		}
		if (key == "ENTER" && currentGuess.length == 5) {
			guessWord(currentGuess);
			setCurrentGuess("");
		}
		if (key == "BACKSPACE" && currentGuess.length > 0) {
			setCurrentGuess(prev => prev.slice(0, -1));
		}
	}, [currentGuess, currentTurn])

	useEffect(() => {
		window.addEventListener('keydown', handleKey);
		return () => {
			window.removeEventListener("keydown", handleKey);
		}
	}, [handleKey])

	return (
		<div className="w-full flex justify-center">
			<div className="grid grid-rows-6 gap-2 mt-30">
				{Array.from({ length: 6 }).map((_, i) => {
					let rowWord = "";
					if (guesses != null) {

						if (i < guesses.length) {
							rowWord = guesses[i].word ?? "";
						} else if (i == guesses.length) {
							rowWord = currentGuess;
						}
					}
					return (
						<Row key={i} word={rowWord} />
					)
				})}
			</div>
		</div>
	)
}

const Row = ({ word }: { word: string }) => {
	const wordArray = Array.from({ length: 5 }, (_, i) => word[i] || null);
	return (
		<div className="grid grid-cols-5 gap-2">
			{wordArray.map((letter, i) => (
				<div key={i} className="border border-white aspect-square size-12 rounded-md grid place-items-center text-3xl font-bold leading-none">{letter ?? ""}</div>
			))}
		</div>
	)
}

export default Game;
