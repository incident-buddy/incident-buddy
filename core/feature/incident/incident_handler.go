package incident

import (
	"connectrpc.com/connect"
	"context"
	"incident-buddy/core/auth"
	. "incident-buddy/core/gen/proto/incident"
	"log"
)

type IncidentHandler struct {
	CtxReader     auth.AuthCtxReader
	CreateUsecase CreateIncidentUsecase
	Query         IncidentQuery
}

func NewIncidentHandler(
	ctxReader auth.AuthCtxReader,
	createUsecase CreateIncidentUsecase,
	query IncidentQuery,
) *IncidentHandler {
	return &IncidentHandler{ctxReader, createUsecase, query}
}

func (h *IncidentHandler) CreateIncident(
	ctx context.Context,
	req *connect.Request[CreateIncidentRequest],
) (*connect.Response[CreateIncidentResponse], error) {
	log.Println("Request headers: ", req.Header())
	res := connect.NewResponse(&CreateIncidentResponse{Id: "01HZYC2028WMB3NJ16WCV9Z9E0"})
	return res, nil
}

func (h *IncidentHandler) ListIncidents(
	ctx context.Context,
	_ *connect.Request[ListIncidentsRequest],
) (*connect.Response[ListIncidentsResponse], error) {
	authCtx, err := h.CtxReader.ReadAuthCtx(ctx)
	if err != nil {
		return nil, err
	}
	overviews, err := h.Query.ListIncidentOverviews(ctx, authCtx.TenantId)
	if err != nil {
		return nil, err
	}

	res := connect.NewResponse(&ListIncidentsResponse{Incidents: overviews})
	res.Header().Set("X-Custom-Header", "custom")
	return res, nil
}
