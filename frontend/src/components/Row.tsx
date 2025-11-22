import "../main.css";
import React from "react";

const Row = () => {
	return (
		<main>
			{Array.from({length: 5}).map((_, i) => (
				(<div className="border border-black"></div>)
			))}
		</main>
	)
}

export default Row;
