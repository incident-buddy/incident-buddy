package auth

import (
	"context"
	"errors"
	"fmt"
	"incident-buddy/core/shared/id"
)

type AuthContext struct {
	TenantId id.Id
	UserId   id.Id
}

type AuthCtxKey string

const (
	TenantIdCtxKey AuthCtxKey = "tenantId"
	UserIdCtxKey   AuthCtxKey = "userId"
)

type AuthCtxReader struct{}

func NewAuthContextReader() AuthCtxReader {
	return AuthCtxReader{}
}
func (r *AuthCtxReader) ReadAuthCtx(ctx context.Context) (*AuthContext, error) {

	tenantId, err := getId(ctx, TenantIdCtxKey)
	if err != nil {
		return nil, err
	}
	userId, err := getId(ctx, UserIdCtxKey)
	if err != nil {
		return nil, err
	}
	return &AuthContext{id.Id(tenantId), id.Id(userId)}, nil
}

func getId(ctx context.Context, key AuthCtxKey) (string, error) {
	if v := ctx.Value(key); v != nil {
		if tenantId, ok := v.(string); ok {
			return tenantId, nil
		}
	}
	return "", errors.New(fmt.Sprintf("value for %v not found in context", key))
}
