package wire

import (
	"github.com/incident-buddy/api/internal/shared/clock"
	"github.com/incident-buddy/api/internal/shared/id"
)

type Wirer struct {
	Clock         clock.Clock
	IdGenerator   id.Generator
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
