import "../main.css";
import React from "react";
import useGame from "../store/useGame";

const NavBar = () => {
	const gameId = useGame(state => state.gameId);
	const gameStatus = useGame(state => state.gameStatus);
	const solution = useGame(state => state.solution);

	return (
		<nav className="absolute top-0 p-2 w-full h-12 flex justify-center items-center">
			<p className="mr-auto">ID: {gameStatus != null ? (gameId ?? ""): ""}</p>
			<div className="absolute">
				<p className="text-white font-wordle text-3xl tracking-wider">URTADLE</p>
			</div>
			<p>{`Solution: ${solution ?? "\u00A0\u00A0\u00A0\u00A0\u00A0"}`}</p>
		</nav>
	)
}

export default NavBar;
