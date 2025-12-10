import "../main.css";
import { For, type ParentComponent } from "solid-js";
import { gameStore } from "../store/gameStore";


const qwertyKeyboard = [
	["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
	["A", "S", "D", "F", "G", "H", "J", "K", "L"],
	["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
]

const Keyboard = () => {
	return (
		<div class="place-items-center space-y-1.5 text-text">
			<For each={qwertyKeyboard}>
				{(row) =>
					<KeyboardRow>
						<For each={row}>
							{(key) => <KeyboardTile key={key} />}
						</For>
					</KeyboardRow>
				}
			</For>
		</div>
	)
}

const KeyboardRow: ParentComponent = (props) => {
	return (
		<div class="flex space-x-1.5">
			{props.children}
		</div>
	)
}

const KeyboardTile = (props: { key: string }) => {
	const bigKey = props.key.length > 1 || props.key == "⌫";
	const state = () => gameStore.keyboardStatus[props.key];

	const animationColor = () => {
		const colors: {[key: string]: string} = {
			"green": "bg-green-800",
			"yellow": "bg-yellow-600",
			"gray": "bg-dark-gray",
		}
		return colors[state()] ?? "bg-light-gray";
	};

	return (
		<button
			classList={{
				"w-16": bigKey,
				"w-10": !bigKey,
				[animationColor()]: true
			}}
			class="cursor-pointer h-13 flex justify-center items-center text-xl rounded-md transition-colors delay-[1.7s]"
		>
			{props.key}
		</button>
	)
}

export default Keyboard;
