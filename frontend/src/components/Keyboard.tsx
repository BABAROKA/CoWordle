import React from "react";
import "../main.css";
import useGame from "../store/useGame";

const qwertyKeyboard = [
	["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
	["A", "S", "D", "F", "G", "H", "J", "K", "L"],
	["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
]

interface KeyboardProp {
	handleKey: (key: string) => void;
}

const Keyboard = ({ handleKey }: KeyboardProp) => {
	return (
		<div className="flex flex-col items-center space-y-1.5">
			{qwertyKeyboard.map((row, i) => (
				<KeyboardRow key={i} row={row} handleKey={handleKey} />
			))}
		</div>
	)
}

const KeyboardRow = ({ row, handleKey }: { row: string[] } & KeyboardProp) => {
	const keyboarStatus = useGame(state => state.keyboardStatus);
	return (
		<div className="space-x-1.5">
			{row.map((letter, i) => {
				const status = keyboarStatus[letter];
				return (
					<KeyboardTile key={i} letter={letter} letterStatus={status} handleKey={handleKey} />
				)
			})}
		</div>
	)
}

const KeyboardTile = ({ letter, letterStatus, handleKey }: { letter: string, letterStatus: string } & KeyboardProp) => {
	const width = letter == "Enter" || letter == "⌫" ? "w-16" : "w-10";

	const animationColor = {
		"green": "#016630",
		"yellow": "#d08700",
		"gray": "#484848",
	}[letterStatus];

	return (
		<button
			style={{ "--keyColor": animationColor } as React.CSSProperties}
			onClick={() => handleKey(letter)}
			className={`shadow-s cursor-pointer h-14 ${width} ${animationColor == undefined ? "": "key-color"} bg-light-gray rounded-sm text-xl`}>
			{letter}
		</button>
	)
}

export default Keyboard;
