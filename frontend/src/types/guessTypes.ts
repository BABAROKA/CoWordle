import type { Accessor } from "solid-js";

type GuessActions = {
	addLetter: (key: string) => void;
	removeLetter: () => void;
	resetGuess: () => void;
	sendGuess: () => void;
}

export type GuessState = {currentGuess: Accessor<string>, actions: GuessActions};
