import { For } from "solid-js"
import { gameStore, setGameStore } from "../store/gameStore"

const Toast = () => {
	return (
		<For each={gameStore.toasts}>
			{(toast, index) => (
				<div
					style={{"margin-bottom": `${2 - index() * 30}px`}}
					class="toast-animation w-60 h-14 text-nowrap text-text text-xl flex justify-center items-center bg-background shadow-m rounded-lg absolute bottom-5 right-5 transition-all duration-500"
					onAnimationEnd={
						() => setGameStore("toasts", toasts => toasts.filter(t => t.id != toast.id))
					}
				>
					{toast.message}
				</div>
			)
			}
		</For >
	)
}

export default Toast
