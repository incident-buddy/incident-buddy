package handler

import (
	"connectrpc.com/connect"
	"context"
	"incident-buddy/core/auth"
	"incident-buddy/core/feature/incident/dataaccess/query"
	"incident-buddy/core/feature/incident/usecase"
	"incident-buddy/core/gen/proto/incidentbuddy/incident/v1"
	"log"
)

type IncidentHandler struct {
	CtxReader     auth.AuthCtxReader
	CreateUsecase usecase.CreateIncidentUsecase
	Query         query.IncidentQuery
}

func NewIncidentHandler(
	ctxReader auth.AuthCtxReader,
	createUsecase usecase.CreateIncidentUsecase,
	query query.IncidentQuery,
) *IncidentHandler {
	return &IncidentHandler{ctxReader, createUsecase, query}
}

func (h *IncidentHandler) CreateIncident(
	ctx context.Context,
	req *connect.Request[incidentv1.CreateIncidentRequest],
) (*connect.Response[incidentv1.CreateIncidentResponse], error) {
	log.Println("Request headers: ", req.Header())
	res := connect.NewResponse(&incidentv1.CreateIncidentResponse{Id: "01HZYC2028WMB3NJ16WCV9Z9E0"})
	return res, nil
}

func (h *IncidentHandler) ListIncidents(
	ctx context.Context,
	_ *connect.Request[incidentv1.ListIncidentsRequest],
) (*connect.Response[incidentv1.ListIncidentsResponse], error) {
	authCtx, err := h.CtxReader.ReadAuthCtx(ctx)
	if err != nil {
		return nil, err
	}
	overviews, err := h.Query.ListIncidentOverviews(ctx, authCtx.TenantId)
	if err != nil {
		return nil, err
	}

	res := connect.NewResponse(&incidentv1.ListIncidentsResponse{Incidents: overviews})
	res.Header().Set("X-Custom-Header", "custom")
	return res, nil
}
