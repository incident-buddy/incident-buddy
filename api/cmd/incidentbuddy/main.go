package main

import (
	"github.com/incident-buddy/api/internal/server"
	"log"
	"log/slog"
	"os"
	"strconv"
)

func main() {
	port := 8080
	if raw := os.Getenv("PORT"); raw != "" {
		p, err := strconv.Atoi(raw)
		if err != nil {
			log.Panicf("invalid PORT: %v", err)
		}
		port = p
	}

	slog.Info("Starting server", "port", port)
	s := server.NewServer(port)
	s.Start()
}
