FROM rust:latest as builder

WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
WORKDIR /app
COPY --from=builder /app/target/release/backend .
COPY .env .

USER nonroot:nonroot
EXPOSE 5905
CMD ["./backend"]
