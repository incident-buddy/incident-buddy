package auth

import (
	"connectrpc.com/connect"
	"context"
	"log"
)

func NewAuthInterceptor() connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			// token := req.Header().Get("Authorization")
			// if token == "" {
			// 	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("missing token"))
			// }
			// token = strings.TrimSpace(strings.TrimPrefix(token, "Bearer"))
			log.Printf("Request headers: %v", req.Header())
			c := context.WithValue(ctx, TenantIdCtxKey, "1")
			c = context.WithValue(c, UserIdCtxKey, "101")
			return next(c, req)
		}
	}
}
