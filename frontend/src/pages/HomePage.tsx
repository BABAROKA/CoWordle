import "../main.css";
import React from "react";
import NavBar from "../components/NavBar";

const HomePage = () => {
	return (
		<main className="bg-black w-full min-h-screen text-white">
			<NavBar />
			<div className="w-full h-full">
				<button className="bg-green-600">Create Game</button>
				<button>Join</button>
			</div>
		</main>
	)
}

export default HomePage;
