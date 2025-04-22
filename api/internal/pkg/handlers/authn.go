package handlers

import (
	"context"

	"connectrpc.com/connect"

	"github.com/incident-buddy/api/internal/pkg/authn"
)

func ReadOrUnauthenticated(ctx context.Context) (authn.IdCtx, error) {
	authnCtx, err := authn.Read(ctx)
	if err != nil {
		return authnCtx, connect.NewError(connect.CodeUnauthenticated, err)
	}
	return authnCtx, nil
}
