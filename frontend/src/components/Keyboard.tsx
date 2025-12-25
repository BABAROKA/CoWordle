import "../main.css";
import { For, type ParentComponent } from "solid-js";
import { gameStore } from "../store/gameStore";
import { useGuess } from "../context/guessContext";

const qwertyKeyboard = [
	["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
	["A", "S", "D", "F", "G", "H", "J", "K", "L"],
	["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
]

const Keyboard = () => {
	return (
		<div class="place-items-center space-y-1.5 text-text transform scale-[min(1,95vw/460px)] relative">
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
		<div class="flex space-x-1.5 w-full justify-center">
			{props.children}
		</div>
	)
}

const KeyboardTile = (props: { key: string }) => {

	const { actions } = useGuess();

	const bigKey = props.key == "Enter" || props.key == "⌫";

	const state = () => gameStore.keyboardStatus[props.key];
	const keyFunction = !bigKey ?
		() => actions.addLetter(props.key) :
		props.key == "⌫" ?
			actions.removeLetter :
			actions.sendGuess;

	const animationColor = () => {
		const colors: { [key: string]: string } = {
			"green": "bg-green-800",
			"yellow": "bg-yellow-600",
			"gray": "bg-dark-gray",
		}
		return colors[state()] ?? "bg-light-gray";
	};

	return (
		<button
			type="button"
			onClick={keyFunction}
			classList={{
				"w-16": bigKey,
				"w-10": !bigKey,
				"bg-dark-gray": props.key == "Enter" && gameStore.currentTurn != gameStore.playerId,
				[animationColor()]: props.key != "Enter" || gameStore.currentTurn == gameStore.playerId,
			}}
			class="cursor-pointer h-14 flex justify-center items-center text-xl font-extrabold rounded-sm transition-colors delay-[1.4s]"
			disabled={gameStore.gameStatus != "inProgress"}
		>
			{props.key}
		</button>
	)
}

export default Keyboard;
