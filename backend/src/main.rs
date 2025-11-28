mod dict;
mod game;
mod websocket;

use axum::{
    self, Router,
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
};
use game::GameCoordinator;
use tokio::{net::TcpListener, sync::mpsc};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{self, filter::EnvFilter, layer};
use websocket::handle_socket;
use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};

use crate::game::GameCommand;

#[tokio::main]
async fn main() {
    let subscriber = tracing_subscriber::FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .finish();

    tracing::subscriber::set_global_default(subscriber).expect("setting default subscriber failed");

    let config = GovernorConfigBuilder::default()
        .per_second(5)
        .burst_size(2)
        .finish()
        .unwrap();

    tracing::info!("Starting Game Server");
    let (tx, game_coordinator) = GameCoordinator::new();

    tokio::spawn(game_coordinator.run());

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(tx)
        .layer(TraceLayer::new_for_http())
        .layer(GovernorLayer::new(config));

    let listener = TcpListener::bind("0.0.0.0:5905").await.unwrap();
    tracing::info!("Listening to: {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
    tracing::info!("Game Server Shut Down");
}

async fn ws_handler(ws: WebSocketUpgrade, State(tx): State<mpsc::Sender<GameCommand>>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, tx))
}
