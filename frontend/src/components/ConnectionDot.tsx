import { createEffect } from "solid-js";
import { useWebsocket } from "../context/websocketContext";

const Dot = () => {
	const { readyState } = useWebsocket();
	createEffect(() => {
		console.log(readyState());
	})
	return (
		<span class="absolute flex size-3 top-5 right-5 z-30">
			<span
				classList={{
					"bg-green-700 animate-ping [animation-iteration-count:1]": readyState() == "OPEN",
					"bg-yellow-500 animate-ping": readyState() == "RECONNECTING" || readyState() == "CONNECTING",
				}}
				class="absolute rounded-full size-full opacity-75 transition-all duration-200"
			></span>

			<span
				classList={{
					"bg-red-800": readyState() == "CLOSED",
					"bg-green-800": readyState() == "OPEN",
					"bg-yellow-600": readyState() == "RECONNECTING" || readyState() == "CONNECTING",
				}}
				class="relative size-3 rounded-full transition-all duration-200"
			></span>
		</span>
	)
}

export default Dot;
