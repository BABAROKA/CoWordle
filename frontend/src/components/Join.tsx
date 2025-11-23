import React, {useState} from "react";
import useGame from "../store/useGame";

interface JoinProps {
	createGame: () => void,
	joinGame: (id: string) => void,
}

const Join: React.FC<JoinProps> = ({createGame, joinGame}) => {
	const [inputId, setInputId] = useState("");

	return (
		<div className="w-full h-full flex justify-center items-center">
			<div className="flex flex-col gap-2">
				<button onClick={createGame} className="bg-green-600 w-full p-2 rounded-xl cursor-pointer">Create Game</button>
				<div className="space-x-2">
					<input onChange={e => setInputId(e.target.value)} type="text" className="border-2 border-green-600 bg-white text-black p-2 rounded-xl" />
					<button onClick={() => joinGame(inputId)} className="bg-green-600 p-2 rounded-xl cursor-pointer">Join</button>
				</div>
			</div>
		</div>
	)
}

export default Join;
