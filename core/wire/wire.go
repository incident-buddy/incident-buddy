package wire

import (
	"incident-buddy/core/auth"
	"incident-buddy/core/feature/incident/dataaccess"
	query2 "incident-buddy/core/feature/incident/dataaccess/query"
	"incident-buddy/core/feature/incident/handler"
	"incident-buddy/core/feature/incident/usecase"
	"incident-buddy/core/gen/dbaccess"
	"incident-buddy/core/shared/clock"
	"incident-buddy/core/shared/id"
)

type Wirer struct {
	Clock         clock.Clock
	IdGenerator   id.IdGenerator
	AuthCtxReader auth.AuthCtxReader
	DB            *dbaccess.Queries
}

func NewWirer(
	clock clock.Clock,
	idGen id.IdGenerator,
	ctxReader auth.AuthCtxReader,
	db *dbaccess.Queries,
) *Wirer {
	return &Wirer{clock, idGen, ctxReader, db}
}

func (w *Wirer) WireIncidentHandler() *handler.IncidentHandler {
	repo := dataaccess.NewIncidentRepository(w.DB)
	query := query2.NewIncidentQuery(w.DB)
	uc := usecase.NewCreateIncidentUsecase(w.Clock, w.IdGenerator, repo)
	return handler.NewIncidentHandler(w.AuthCtxReader, uc, query)
}
