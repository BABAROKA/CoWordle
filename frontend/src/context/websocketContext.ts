import { createContext, useContext } from "solid-js";
import type { WebsocketState } from "../types";

export const WebsocketContext = createContext<WebsocketState | undefined>(undefined);

export const useWebsocket = (): WebsocketState => {
	const context = useContext(WebsocketContext);
	if (context) return context;

	throw new Error("can't find WebsocketContext");
}
