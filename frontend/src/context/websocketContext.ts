import { createContext, useContext } from "solid-js";
import type { WebsocketState } from "../types";

export const WebsocketContext = createContext<WebsocketState | undefined>(undefined);

export const useWebsocket = () => {
	const context = useContext(WebsocketContext);
	if (!context) {
		throw new Error("can't find WebsocketContext");
	}
	return context;
}
