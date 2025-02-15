package main

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"incident-buddy/core/auth"
	"incident-buddy/core/gen/dbaccess"
	incidentv1 "incident-buddy/core/gen/proto/incidentbuddy/incident/v1/incidentv1connect"
	"incident-buddy/core/shared/clock"
	"incident-buddy/core/shared/id"
	"incident-buddy/core/wire"
	"log"
	"net/http"
	"os"
)

const (
	webOrigin  = "http://localhost:5173"
	serverPort = "8080"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
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

	// server
	mux := http.NewServeMux()

	interceptor := connect.WithInterceptors(auth.NewAuthInterceptor())
	mux.Handle(incidentv1.NewIncidentServiceHandler(wirer.WireIncidentHandler(), interceptor))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{webOrigin},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:            true,
	})
	corsHandler := c.Handler(h2c.NewHandler(mux, &http2.Server{}))
	fmt.Printf("Starting server at %s\n", serverPort)
	_ = http.ListenAndServe(
		fmt.Sprintf(":%s", serverPort),
		corsHandler,
	)
}
