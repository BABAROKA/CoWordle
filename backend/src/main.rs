mod dict;
mod game;
mod websocket;

use crate::game::GameCommand;
use axum::{
    self, Router,
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
};
use game::GameCoordinator;
use tokio::{net::TcpListener, signal, sync::mpsc};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{self, filter::EnvFilter};
use websocket::handle_socket;

#[tokio::main]
async fn main() {
    let subscriber = tracing_subscriber::FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .finish();

    tracing::subscriber::set_global_default(subscriber).expect("setting default subscriber failed");

    tracing::info!("Starting Game Server");
    let (tx, game_coordinator) = GameCoordinator::new();

    tokio::spawn(game_coordinator.run());

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(tx)
        .layer(TraceLayer::new_for_http());

    let app = {
        #[cfg(not(debug_assertions))]
        {
            use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder};

            tracing::info!("Rate limiting enabled (RELEASE)");
            let config = GovernorConfigBuilder::default()
                .per_second(5)
                .burst_size(10)
                .finish()
                .unwrap();
            app.layer(GovernorLayer::new(config))
        }
        #[cfg(debug_assertions)]
        {
            tracing::info!("Rate limiting disabled (DEBUG)");
            app
        }
    };

    let listener = TcpListener::bind("0.0.0.0:5905").await.unwrap();
    tracing::info!("Listening to: {}/ws", listener.local_addr().unwrap());
    axum::serve(listener, app.into_make_service())
        .with_graceful_shutdown(shutdown())
        .await
        .unwrap();
    tracing::info!("Game Server Shut Down");
}

async fn shutdown() {
    signal::ctrl_c().await.expect("Didnt gracfully shut down");
    tracing::info!("Shutting down because of CTRL+C");
}

async fn ws_handler(ws: WebSocketUpgrade, State(tx): State<mpsc::Sender<GameCommand>>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, tx))
}
