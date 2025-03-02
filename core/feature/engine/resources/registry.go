package resources

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/gen/dbaccess"
)

type Registry interface {
	Resources() []Resource
	Build(context.Context, string, *dbaccess.Queries, *domain.Tenant, Registry, string) (Resource, error)
}
