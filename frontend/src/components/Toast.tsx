import { For } from "solid-js"
import { gameStore, setGameStore } from "../store/gameStore"

const Toast = () => {
	return (
		<For each={gameStore.toasts}>
			{(toast, index) => {
				const lastIndex = () => gameStore.toasts.length - 1;
				return (
					<div
						style={{
							"margin-top": `${(lastIndex() - index())}em`,
							"scale": `${100 - (lastIndex() - index()) * 10}%`,
							"right": "calc(50% - 120px)",
						}}
						class="toast-animation absolute top-12 right-3 w-60 p-4 h-14 text-text text-center font-extrabold text-md flex justify-center items-center bg-background rounded-lg transition-all duration-300 z-20 shadow-s"
						onAnimationEnd={
							() => setGameStore("toasts", toasts => toasts.filter(t => t.id != toast.id))
						}
					>
						{toast.error.message}
					</div>
				)
			}}
		</For >
	)
}

export default Toast
