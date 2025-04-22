package wire

import (
	"connectrpc.com/connect"
	v1connect "github.com/incident-buddy/api/gen/pb/resourcemaster/v1/resourcemasterv1connect"
	"github.com/incident-buddy/api/gen/sqlc"
	"github.com/incident-buddy/api/internal/feature/resourcemaster"
	"github.com/incident-buddy/api/internal/pkg/clock"
	"github.com/incident-buddy/api/internal/pkg/handlers"
	"github.com/incident-buddy/api/internal/pkg/id"
	"net/http"
)

type Wirer struct {
	clock.Clock
	IdGenerator id.Generator
	DB          *dbaccess.Queries
}

func NewWirer(
	clock clock.Clock,
	idGen id.Generator,
	db *dbaccess.Queries,
) *Wirer {
	return &Wirer{clock, idGen, db}
}

func (w Wirer) ResourceMasterHandler(opt ...connect.HandlerOption) (string, http.Handler) {
	query := resourcemaster.NewQuery(w.DB)
	return v1connect.NewResourceMasterServiceHandler(handlers.NewResourceMasterService(query), opt...)
}
