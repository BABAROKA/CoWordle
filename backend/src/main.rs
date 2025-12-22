mod dict;
mod game;
mod websocket;

use axum::{
    self, Router,
    extract::{FromRequestParts, State, WebSocketUpgrade},
    http::{StatusCode, header::ORIGIN, request::Parts},
    response::IntoResponse,
    routing::get,
};
use game::CommandSender;
use game::GameCoordinator;
use std::env;
use tokio::{net::TcpListener, signal};
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{self, filter::EnvFilter};
use websocket::handle_socket;

#[derive(Clone, Debug)]
struct AppState {
    tx: CommandSender,
    allowed_origins: Vec<String>,
}

struct InvalidOrigin;

impl IntoResponse for InvalidOrigin {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::FORBIDDEN, "Forbidden: Invalid Origin").into_response()
    }
}

struct ValidOrigin;

impl FromRequestParts<AppState> for ValidOrigin {
    type Rejection = InvalidOrigin;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        if let Some(origin_header) = parts.headers.get(ORIGIN) {
            if let Ok(origin) = origin_header.to_str() {
                if state.allowed_origins.contains(&origin.to_string()) {
                    return Ok(ValidOrigin);
                }
            }
        }
        Err(InvalidOrigin)
    }
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().expect("Unable to load .env file");

    let subscriber = tracing_subscriber::FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env().add_directive(tracing::Level::INFO.into()))
        .finish();

    tracing::subscriber::set_global_default(subscriber).expect("Setting default subscriber failed");

    let server_port = env::var("SERVER_PORT").expect("Server port is not set");
    let origins = match env::var("ALLOWED_ORIGINS") {
        Ok(s) => s,
        Err(_) => {
            info!("ALLOWED_ORIGINS not set, using empty list");
            return;
        }
    };

    let allowed_origins: Vec<String> = origins
        .split(",")
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();

    let (tx, game_coordinator) = GameCoordinator::new();

    let state = AppState { tx, allowed_origins };

    tracing::info!("Starting Game Server");
    tokio::spawn(game_coordinator.run());

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(state)
        .layer(TraceLayer::new_for_http());

    let app = {
        #[cfg(not(debug_assertions))]
        {
            use tower_governor::{GovernorLayer, governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor};

            tracing::info!("Rate limiting enabled (RELEASE)");
            let config = GovernorConfigBuilder::default()
                .per_second(5)
                .burst_size(10)
                .key_extractor(SmartIpKeyExtractor)
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

    let path = format!("0.0.0.0:{}", server_port);
    let listener = TcpListener::bind(path).await.unwrap();
    tracing::info!("Listening to: {}", listener.local_addr().unwrap());
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

async fn ws_handler(
    ws: WebSocketUpgrade,
    _validated_origin: ValidOrigin,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state.tx))
}
