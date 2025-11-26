import "../main.css";
import React, { useEffect, useState } from "react";
import useGame from "../store/useGame";

const End = ({ newGame }: { newGame: () => void }) => {
	const [showEnd, setShowEnd] = useState(false);
	useEffect(() => {
		let delayTimeout = setTimeout(() => {
			setShowEnd(true);
		}, 1800);
		return () => clearTimeout(delayTimeout);
	}, [])

	const status = useGame(state => state.gameStatus);
	const solution = useGame(state => state.solution);
	return showEnd && (
		<div className="fixed w-full h-screen z-50 flex justify-center items-center">
			<div className="relative w-auto bg-background shadow-m py-10 px-10 gap-7 flex flex-col justify-center items-center rounded-xl">
				<p className="text-3xl text-nowrap">You {status?.toUpperCase()} to the word "{solution}"</p>
				<button onClick={newGame} className="bg-background-light shadow-s hover:shadow-m rounded-xl px-4 py-2 hover:bg-green-800 cursor-pointer transition-colors duration-200">New Game</button>
			</div>
		</div>
	)
}

export default End;
