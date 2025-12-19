import type { Accessor } from "solid-js";

interface GuessActions {
	addLetter: (key: string) => void;
	removeLetter: () => void;
	resetGuess: () => void;
	sendGuess: () => void;
}

export interface GuessState {
	currentGuess: Accessor<string>,
	actions: GuessActions
};
