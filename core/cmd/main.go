package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"connectrpc.com/connect"
	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	incidentv1 "incident-buddy/internal/gen/incidentbuddy/incident/v1"
	"incident-buddy/internal/gen/incidentbuddy/incident/v1/incidentv1connect"
)

type Server struct{}

func (s *Server) ListIncidents(
	ctx context.Context,
	req *connect.Request[incidentv1.ListIncidentsRequest],
) (*connect.Response[incidentv1.ListIncidentsResponse], error) {
	log.Println("Request headers: ", req.Header())

	incidents := []*incidentv1.IncidentOverview{
		{
			Id:          "01HZYC2028WMB3NJ16WCV9Z9E0",
			Title:       "Incident 1",
			Description: "This is incident 1",
			Status: &incidentv1.Status{
				Id:         "01HZYC2028WMB3NJ16WCV9STAT",
				Name:       "Open",
				StatusType: incidentv1.StatusType_STATUS_TYPE_OPEN,
			},
		},
	}
	res := connect.NewResponse(&incidentv1.ListIncidentsResponse{Incidents: incidents})
	res.Header().Set("X-Custom-Header", "custom")
	return res, nil
}

func (s *Server) CreateIncident(
	ctx context.Context,
	req *connect.Request[incidentv1.CreateIncidentRequest],
) (*connect.Response[incidentv1.CreateIncidentResponse], error) {
	res := connect.NewResponse(&incidentv1.CreateIncidentResponse{Id: "01HZYC2028WMB3NJ16WCV9Z9E0"})
	return res, nil
}

func main() {
	fmt.Println("hello")
	server := &Server{}
	mux := http.NewServeMux()
	path, handler := incidentv1connect.NewIncidentServiceHandler(server)
	mux.Handle(path, handler)
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
		Debug:            true,
	})
	corsHandler := c.Handler(h2c.NewHandler(mux, &http2.Server{}))
	http.ListenAndServe(
		"localhost:8080",
		corsHandler,
	)
}
