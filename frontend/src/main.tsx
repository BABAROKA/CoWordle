import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";
import { lazy } from 'solid-js';
import WebsocketProvider from './providers/websocketProvider.tsx';
import Dot from './components/ConnectionDot.tsx';

const wrapper = document.getElementById('root');
if (!wrapper) {
	throw new Error("Wrapper div is not found");
}

const Home = lazy(() => import("./pages/Home.tsx"));
const Game = lazy(() => import("./pages/Game.tsx"));

const App = () => (
	<WebsocketProvider>
		<Dot />
		<Router>
			<Route path="/" component={Home} />
			<Route path="/game" component={Game} />
		</Router>
	</WebsocketProvider>
);

render(App, wrapper)
