package server

import (
	"context"
	"fmt"
	dbaccess "github.com/incident-buddy/api/gen/sqlc"
	"github.com/incident-buddy/api/internal/pkg/clock"
	"github.com/incident-buddy/api/internal/pkg/id"
	"github.com/incident-buddy/api/internal/wire"
	"github.com/jackc/pgx/v5/pgxpool"
	"log"
	"net/http"
	"os"
	"strings"

	"connectrpc.com/connect"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

// Server is Incident Buddy's API server.
type Server struct {
	port string
}

func NewServer(port int) *Server {
	return &Server{
		port: fmt.Sprintf("%d", port),
	}
}

func (s *Server) Start() {
	cp, err := pgxpool.New(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Unable to establish connection to database: %v", err)
	}
	defer cp.Close()
	db := dbaccess.New(cp)

	mux := http.NewServeMux()
	interceptor := connect.WithInterceptors(NewAuthnInterceptor())
	wirer := wire.NewWirer(clock.NewSystemClock(), id.NewULIDGenerator(), db)
	mux.Handle(wirer.ResourceMasterHandler(interceptor))

	addr := fmt.Sprintf(":%s", s.port)
	if err := http.ListenAndServe(addr, withCors(mux, s.port)); err != nil {
		log.Panicf("failed to start server: %v", err)
	}
}

func withCors(mux *http.ServeMux, port string) http.Handler {
	base := fmt.Sprintf("http://localhost:%s", port)
	origins := append(fromEnv(), base)
	c := cors.New(cors.Options{
		AllowedOrigins:   origins,
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:            true,
	})
	return c.Handler(h2c.NewHandler(mux, &http2.Server{}))
}

func fromEnv() []string {
	origins := make([]string, 0, 100)
	if raw := os.Getenv("CORS_ALLOWED_ORIGINS"); raw != "" {
		for _, o := range strings.Split(raw, ",") {
			origins = append(origins, strings.TrimSpace(o))
		}
	}
	return origins
}
