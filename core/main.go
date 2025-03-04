package main

import (
	"connectrpc.com/connect"
	"context"
	"flag"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"incident-buddy/core/auth"
	"incident-buddy/core/gen/dbaccess"
	"incident-buddy/core/gen/proto/engine/engineconnect"

	// "incident-buddy/core/gen/proto/engine/engineconnect"
	"incident-buddy/core/gen/proto/incident/incidentconnect"
	"incident-buddy/core/shared/clock"
	"incident-buddy/core/shared/id"
	"incident-buddy/core/wire"
	"incident-buddy/core/worker"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"
)

const (
	webOrigin = "http://localhost:5173"
)

func main() {
	// parse cli option
	var mode = flag.String("mode", "", "api | worker")
	var rawPort = flag.String("port", "", "port to listen on")
	flag.Parse()
	if !(*mode == "api" || *mode == "worker") {
		flag.PrintDefaults()
		log.Panicf("Invalid mode: %s", *mode)
	}
	if *rawPort == "" {
		flag.PrintDefaults()
		log.Panicf("Port is required")
	}
	port, err := strconv.ParseInt(*rawPort, 10, 32)
	if err != nil {
		flag.PrintDefaults()
		log.Panicf("Invalid port: %s", *rawPort)
	}

	if err := godotenv.Load(); err != nil {
		log.Panicf("Error loading .env file")
	}

	// data access
	cp, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Unable to establish connection to database: %v", err)
	}
	defer cp.Close()
	db := dbaccess.New(cp)

	// object wiring
	wirer := wire.NewWirer(
		clock.NewSystemClock(),
		id.NewULIDGenerator(),
		auth.NewAuthContextReader(),
		db,
	)

	switch *mode {
	case "api":
		startApiServer(wirer, port)
	case "worker":
		startWorker(wirer, port)
	}
}

func startApiServer(wirer *wire.Wirer, port int64) {
	// server
	mux := http.NewServeMux()

	interceptor := connect.WithInterceptors(auth.NewAuthInterceptor())
	mux.Handle(incidentconnect.NewIncidentServiceHandler(wirer.WireIncidentHandler(), interceptor))
	mux.Handle(engineconnect.NewResourceServiceHandler(wirer.WireResourceHandler(), interceptor))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{webOrigin},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:            true,
	})
	corsHandler := c.Handler(h2c.NewHandler(mux, &http2.Server{}))
	slog.Info(fmt.Sprintf("Starting API server at %d\n", port))
	if err := http.ListenAndServe(
		fmt.Sprintf(":%d", port),
		corsHandler,
	); err != nil {
		log.Fatalf("Error starting API server: %v", err)
	}
}

func startWorker(wirer *wire.Wirer, port int64) {
	slog.Info(fmt.Sprintf("Starting worker at %d\n", port))
	http.HandleFunc("/", worker.HandleMessage)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatalf("Error starting worker: %v", err)
	}
}
