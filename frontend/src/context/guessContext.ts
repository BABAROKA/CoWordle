import { createContext, useContext } from "solid-js"
import type { GuessState} from "../types";

export const guessContext = createContext<GuessState | undefined>(undefined)

export const useGuess = (): GuessState => {
	const context = useContext(guessContext);
	if (context) return context;

	throw new Error("can't find GuessContext");
}
