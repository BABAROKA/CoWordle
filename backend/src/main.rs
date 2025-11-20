mod websocket;
mod game;
mod dict;

use axum::{
    self, Router,
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
};
use tokio::{net::TcpListener, sync::mpsc};
use websocket::handle_socket;
use game::GameCoordinator;

use crate::game::GameCommand;

#[tokio::main]
async fn main() {
    let (tx, game_coordinator) = GameCoordinator::new();

    tokio::spawn(game_coordinator.run());

    let app = Router::new().route("/ws", get(ws_handler)).with_state(tx);

    let listener = TcpListener::bind("0.0.0.0:5905").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(tx): State<mpsc::Sender<GameCommand>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, tx))
}
