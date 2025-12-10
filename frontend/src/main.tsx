import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";
import { lazy } from 'solid-js';
import WebsocketProvider from './api/websocketProvider.tsx';

const wrapper = document.getElementById('root');
if (!wrapper) {
	throw new Error("Wrapper div is not found");
}

const Home = lazy(() => import("./pages/Home.tsx"));
const Game = lazy(() => import("./pages/Game.tsx"));

const App = () => (
	<WebsocketProvider>
		<Router>
			<Route path="/" component={Home} />
			<Route path="/game" component={Game} />
		</Router>
	</WebsocketProvider>
);

render(App, wrapper)
