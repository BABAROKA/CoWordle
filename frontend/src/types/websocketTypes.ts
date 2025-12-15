import { type ClientMessage } from "./clientMessage";

export type Ready = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";

export type ReadyState = () => Ready;
export type SendMessage = (message: ClientMessage) => void;

export type WebsocketState = [ReadyState, SendMessage];
