package wire

import (
	"incident-buddy/core/auth"
	. "incident-buddy/core/feature/engine"
	"incident-buddy/core/feature/engine/resources"
	. "incident-buddy/core/feature/incident"
	"incident-buddy/core/gen/dbaccess"
	"incident-buddy/core/shared/clock"
	"incident-buddy/core/shared/id"
	"incident-buddy/core/worker"
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

func (w *Wirer) WireIncidentHandler() *IncidentHandler {
	repo := NewIncidentRepository(w.DB)
	query := NewIncidentQuery(w.DB)
	uc := NewCreateIncidentUsecase(w.Clock, w.IdGenerator, repo)
	return NewIncidentHandler(w.AuthCtxReader, uc, query)
}

func (w *Wirer) WireResourceHandler() *ResourceHandler {
	registry := resources.RegistryInstance()
	return NewResourceHandler(w.AuthCtxReader, registry)
}

func (w *Wirer) WireWorker() *worker.Worker {
	return worker.NewWorker(w.DB)
}
