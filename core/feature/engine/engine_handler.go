package engine

import (
	"connectrpc.com/connect"
	"context"
	"fmt"
	"incident-buddy/core/auth"
	. "incident-buddy/core/feature/engine/resources"
	"incident-buddy/core/gen/proto/engine"
)

type ResourceHandler struct {
	ctxReader auth.AuthCtxReader
	registry  Registry
}

func NewResourceHandler(
	ctxReader auth.AuthCtxReader,
	registry Registry,
) *ResourceHandler {
	return &ResourceHandler{ctxReader, registry}
}

func (r ResourceHandler) ListResource(
	_ context.Context,
	_ *connect.Request[engine.ListResourceRequest],
) (*connect.Response[engine.ListResourceResponse], error) {
	resources := r.registry.Resources()
	overview := make([]*engine.ResourceOverview, 0, len(resources))
	fmt.Printf("resources: %v\n", resources)
	for _, resource := range resources {
		overview = append(overview, &engine.ResourceOverview{
			Type: resource,
		})
	}
	res := connect.NewResponse(&engine.ListResourceResponse{Resources: overview})
	return res, nil
}

func (r ResourceHandler) GetResource(
	ctx context.Context,
	c *connect.Request[engine.GetResourceRequest],
) (*connect.Response[engine.GetResourceResponse], error) {
	//TODO implement me
	panic("implement me")
}
