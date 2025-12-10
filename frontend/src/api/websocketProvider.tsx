import type { JSXElement } from "solid-js";
import { WebsocketContext } from "../context/websocketContext.ts"
import createWebsocket from "./websocket.ts"
import type { WebsocketState } from "../types/websocketTypes.ts";

const WebsocketProvider = (props: {children: JSXElement}) => {
	const websocket: WebsocketState = createWebsocket();

	return (
		<WebsocketContext.Provider value={websocket}>
			{props.children}
		</WebsocketContext.Provider>
	)
}

export default WebsocketProvider;
