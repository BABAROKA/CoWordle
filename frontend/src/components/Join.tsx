import React, { useState } from "react";
import useGame from "../store/useGame";

interface JoinProps {
	createGame: () => void,
	joinGame: (id: string) => void,
}

type DidCopy = "yes" | "no" | "waiting";

const Join: React.FC<JoinProps> = ({ createGame, joinGame }) => {
	const [inputId, setInputId] = useState("");
	const gameId = useGame(state => state.gameId);
	const gameStatus = useGame(state => state.gameStatus);
	const [copied, setCopied] = useState<DidCopy>("waiting")

	const handleCopy = async () => {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			try {
				const connectUrl = `${window.location.origin}?join=${gameId}`
				await navigator.clipboard.writeText(connectUrl);
				setCopied("yes");
			} catch (err) {
				console.log(err);
				setCopied("no");
			}
			return;
		}
		console.log("Unable to copy");
		setCopied("no");
	};

	return (
		<div className="w-full h-full flex justify-center items-start pt-80">
			<div className={`relative flex flex-col ${gameId && gameStatus == "waiting" ? "max-h-screen" : "max-h-34"} p-5 justify-start rounded-xl bg-background shadow-m overflow-hidden transition-all ease-in-out duration-1000`}>
				<div className="space-y-2">
					<button onClick={createGame} className="bg-background-light  hover:bg-green-800 shadow-s hover:shadow-m transition-all duration-200 w-full p-2 rounded-xl cursor-pointer">Create Game</button>
					<div className="space-x-2 flex">
						<input onChange={e => setInputId(e.target.value)} type="text" className="uppercase border-2 focus:outline-none shadow-s hover:shadow-m transition-all duration-200 font-bold text-center text-lg border-background-light bg-text text-background-dark p-2 rounded-xl grow" />
						<button onClick={() => joinGame(inputId)} className="bg-background-light  hover:bg-yellow-600 py-2 w-16 rounded-xl cursor-pointer shadow-s hover:shadow-m transition-all duration-200">Join</button>
					</div>
				</div>
				<div className="mt-16 text-center">
					<div className="relative group flex space-x-2 w-full">
						<div className="bg-background-light rounded-xl shadow-s p-2 grow">
							<p className="">ID: {gameId}</p>
							<p className="">{window.location.origin}?join={gameId}</p>
						</div>
						<button onClick={handleCopy} className="relative bg-background-light hover:bg-green-800 w-16 flex justify-center items-center h-16 aspect-square cursor-pointer shadow-s hover:shadow-m rounded-xl p-2 transition-all duration-200 overflow-hidden">
							{copied == "no" && <svg className="absolute size-10" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>}

							{copied == "waiting" && <svg className="absolute size-10" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /><path d="M16 4h2a2 2 0 0 1 2 2v4" /><path d="M21 14H11" /><path d="m15 10-4 4 4 4" /></svg>}

							{copied == "yes" && <svg className="absolute size-10" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Join;
