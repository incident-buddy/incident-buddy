package authn

import (
	"context"
	"errors"
	"github.com/incident-buddy/api/internal/shared/id"
)

// AuthenticationContext holds the authentication information for a login user.
type AuthenticationContext struct {
	TenantId id.Id
	UserId   id.Id
}

type AuthenticationContextKey string

const (
	TenantIdCtxKey AuthenticationContextKey = "tenantId"
	UserIdCtxKey   AuthenticationContextKey = "userId"
)

func Read(ctx context.Context) (*AuthenticationContext, error) {
	tenantId, ok := ctx.Value(TenantIdCtxKey).(string)
	if !ok {
		return nil, errors.New("tenant ID not found in context")
	}

	userId, ok := ctx.Value(UserIdCtxKey).(string)
	if !ok {
		return nil, errors.New("user ID not found in context")
	}

	return &AuthenticationContext{
		TenantId: id.Id(tenantId),
		UserId:   id.Id(userId),
	}, nil
}
