import "../main.css";
import React from "react";
import useGame from "../store/useGame";


const Waiting = () => {
	const gameId = useGame(state => state.gameId);

	return (
		<div className="w-full h-full flex justify-center items-center">
			<div className="text-3xl py-8 px-14 bg-[#111] rounded-xl">ID: {gameId}</div>
		</div>
	)
}

export default Waiting;
