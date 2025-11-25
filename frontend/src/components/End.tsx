import "../main.css";
import React from "react";
import useGame from "../store/useGame";

const End = ({ newGame }: { newGame: () => void }) => {

	const status = useGame(state => state.gameStatus);
	const solution = useGame(state => state.solution);
	return (
		<div className="w-full h-full flex flex-col gap-10 justify-center items-center">
			<div className="text-6xl bg-[#111] rounded-xl py-6 px-10">Solution: {solution}</div>
			<div className="flex flex-col gap-3">
				<div className="text-3xl bg-[#111] rounded-xl py-6 px-10">You {status ?? ""} the Game</div>
				<button onClick={newGame} className="bg-green-700 hover:bg-green-900 rounded-sm py-2 cursor-pointer">New Game</button>
			</div>
		</div>
	)
}

export default End;
