import type { ClientMessage } from "./clientMessage";
import type { Accessor } from "solid-js";

export type Ready = "CONNECTING" | "RECONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export type ReadyState = Accessor<Ready>;
export type SendMessage = (message: ClientMessage) => void;

export interface WebsocketState {
	readyState: ReadyState,
	sendMessage: SendMessage
};
