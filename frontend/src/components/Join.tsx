import React, { useState } from "react";
import useGame from "../store/useGame";

interface JoinProps {
	createGame: () => void,
	joinGame: (id: string) => void,
}

const Join: React.FC<JoinProps> = ({ createGame, joinGame }) => {
	const [inputId, setInputId] = useState("");
	const gameId = useGame(state => state.gameId);
	const gameStatus = useGame(state => state.gameStatus);

	return (
		<div className="w-full h-full flex justify-center items-start pt-80">
			<div className={`relative flex flex-col ${gameId && gameStatus == "waiting" ? "max-h-screen" : "max-h-34"} p-5 justify-start rounded-xl bg-background shadow-m overflow-hidden transition-all ease-in-out duration-1000`}>
				<div className="space-y-2">
					<button onClick={createGame} className="bg-background-light  hover:bg-green-800 shadow-s hover:shadow-m transition-all duration-200 w-full p-2 rounded-xl cursor-pointer">Create Game</button>
					<div className="space-x-2">
						<input onChange={e => setInputId(e.target.value)} type="text" className="uppercase border-2 focus:outline-none shadow-s hover:shadow-m transition-all duration-200 font-bold text-center text-lg border-background-light bg-text text-background-dark p-2 rounded-xl" />
						<button onClick={() => joinGame(inputId)} className="bg-background-light  hover:bg-yellow-600 p-2 rounded-xl cursor-pointer shadow-s hover:shadow-m transition-all duration-200">Join</button>
					</div>
				</div>
				<div className="mt-10 text-center">
					<button onClick={() => navigator.clipboard.writeText(`${window.location.origin}?join=${gameId}`)} className="relative group flex flex-col justify-center items-center bg-background-light hover:bg-green-800 cursor-pointer p-2 rounded-xl shadow-s transition-colors duration-200 w-full">
						<span className="absolute opacity-0 group-hover:opacity-100">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="36"
								height="36"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
								<path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
								<path d="M16 4h2a2 2 0 0 1 2 2v4" />
								<path d="M21 14H11" />
								<path d="m15 10-4 4 4 4" />
							</svg>
						</span>
						<p className="opacity-100 group-hover:opacity-0">ID: {gameId}</p>
						<p className="opacity-100 group-hover:opacity-0">{window.location.origin}?join={gameId}</p>
					</button>
				</div>
			</div>
		</div>
	)
}

export default Join;
