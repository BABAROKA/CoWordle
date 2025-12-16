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
							"margin-bottom": `${(lastIndex() - index())}em`,
							"scale": `${100 - (lastIndex() - index()) * 10}%`
						}}
						class="toast-animation absolute bottom-5 right-5 min-w-60 w-auto px-5 h-14 text-nowrap text-text text-xl flex justify-center items-center bg-background shadow-m rounded-lg transition-all duration-300"
						onAnimationEnd={
							() => setGameStore("toasts", toasts => toasts.filter(t => t.id != toast.id))
						}
					>
						{toast.message}
					</div>
				)
			}}
		</For >
	)
}

export default Toast
