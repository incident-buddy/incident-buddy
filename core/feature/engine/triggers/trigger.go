package triggers

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/feature/engine/resources"
	"incident-buddy/core/gen/dbaccess"
)

type Trigger interface {
	Name() string
	Label() string
	BuildScope(context.Context, *dbaccess.Queries, *domain.Tenant) (resources.Scope, error)
}
