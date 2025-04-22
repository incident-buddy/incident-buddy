package authn

import (
	"context"
	"errors"

	"github.com/incident-buddy/api/internal/pkg/id"
)

// IdCtx holds the authentication information for a login user.
type IdCtx struct {
	TenantId id.Id
	UserId   id.Id
}

type IdContextKey string

const (
	TenantIdCtxKey IdContextKey = "tenantId"
	UserIdCtxKey   IdContextKey = "userId"
)

// Read from the context and returns an IdCtx.
func Read(ctx context.Context) (IdCtx, error) {
	tenantId, ok := ctx.Value(TenantIdCtxKey).(string)
	if !ok {
		return IdCtx{}, errors.New("tenant ID not found in context")
	}

	userId, ok := ctx.Value(UserIdCtxKey).(string)
	if !ok {
		return IdCtx{}, errors.New("user ID not found in context")
	}

	return IdCtx{
		TenantId: id.Id(tenantId),
		UserId:   id.Id(userId),
	}, nil
}
