import { createSignal, For, onMount, onCleanup } from "solid-js";
import "../main.css"

const shapes = [
	{ name: "blue.svg", x: "70px", y: "50px" },
	{ name: "green.svg", x: "200px", y: "350px" },
	{ name: "orange.svg", x: "800px", y: "520px" },
	{ name: "purple.svg", x: "1100px", y: "430px" },
	{ name: "pink.svg", x: "700px", y: "00px" },
	{ name: "slate.svg", x: "1200px", y: "80px" },
	{ name: "red.svg", x: "20px", y: "580px" },
]

const Background = () => {

	const [rotation, setRotation] = createSignal(0);
	onMount(() => {
		const increaseRotation = () => setRotation(r => r + (Math.random() * 0.2));
		window.addEventListener("mousemove", increaseRotation);
		onCleanup(() => window.removeEventListener("mousemove", increaseRotation));
	});

	return (
		<div class="fixed inset-0 overflow-hidden opacity-20 blur-xs pointer-events-none" draggable={false}>
			<For each={shapes}>
				{(shape, index) => (
					<img
						style={{ left: shape.x, top: shape.y, rotate: `${index() % 2 == 0 ? "-" : ""}${rotation()}deg` }}
						class="absolute size-50 select-none"
						src={`shapes/${shape.name}`}
					/>
				)}
			</For>
		</div>
	)
}

export default Background;
