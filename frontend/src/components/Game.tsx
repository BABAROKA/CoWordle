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
			console.log("lol");
			guessWord(currentGuess);
			setCurrentGuess("");
		}
		if (key == "BACKSPACE" && currentGuess.length > 0) {
			setCurrentGuess(prev => prev.slice(0, -1));
		}
	}, [currentGuess, currentTurn, playerId, guessWord])

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
					let colors: string[] | null = null;

					if (guesses != null) {
						if (i < guesses.length) {
							rowWord = guesses[i].word ?? "";
							colors = guesses[i].status;
						} else if (i == guesses.length) {
							rowWord = currentGuess;
						}
					}
					return (
						<Row key={i} word={rowWord} colors={colors}/>
					)
				})}
			</div>
		</div>
	)
}

const Row = ({ word, colors }: { word: string, colors: string[] | null }) => {
	const wordArray = Array.from({ length: 5 }, (_, i) => word[i] || null);
	const isCurrentRow = colors == null && word.length > 0;
	return (
		<div className="grid grid-cols-5 gap-2">
			{wordArray.map((letter, i) => (
				<div key={i} className={`${colors != null 
					? colors[i] == "green" 
						? "bg-green-700" 
						: colors[i] == "yellow" 
							? "bg-yellow-400" 
							: "bg-gray-800"
					: ""} border border-white aspect-square size-12 rounded-md grid place-items-center text-3xl font-bold leading-none
					${isCurrentRow && letter? "animate-pop": ""}`}>{letter ?? ""}</div>
			))}
		</div>
	)
}

export default Game;
