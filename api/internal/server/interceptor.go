package server

import (
	"context"
	"log"

	"connectrpc.com/connect"

	"github.com/incident-buddy/api/internal/pkg/authn"
)

// NewAuthnInterceptor creates a new authentication interceptor for gRPC requests.
// TODO: Implement actual authentication logic.
func NewAuthnInterceptor() connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			// token := req.Header().Get("Authorization")
			// if token == "" {
			// 	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("missing token"))
			// }
			// token = strings.TrimSpace(strings.TrimPrefix(token, "Bearer"))
			log.Printf("Request headers: %v", req.Header())
			c := context.WithValue(ctx, authn.TenantIdCtxKey, "0000000000000000TENANT_001")
			c = context.WithValue(c, authn.UserIdCtxKey, "01JSD7RASNS8CKEWS9QHBMKHYN")
			return next(c, req)
		}
	}
}
