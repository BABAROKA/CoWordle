import { type Accessor } from "solid-js";
import { type ClientMessage } from "./clinetMessage";

export type Ready = "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED";
export type WebsocketState = [Accessor<Ready>, (message: ClientMessage) => void]
