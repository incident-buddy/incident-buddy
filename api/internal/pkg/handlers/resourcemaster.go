package handlers

import (
	"connectrpc.com/connect"
	"context"

	v1 "github.com/incident-buddy/api/gen/pb/resourcemaster/v1"
	"github.com/incident-buddy/api/internal/feature/resourcemaster"
)

// NewResourceMasterService creates a new ResourceMasterService instance.
// This function is supposed to be called from the wirer.
func NewResourceMasterService(query *resourcemaster.Query) *ResourceMasterService {
	return &ResourceMasterService{query}
}

// ResourceMasterService is a gRPC service for managing resource masters.
type ResourceMasterService struct {
	query *resourcemaster.Query
}

func (s *ResourceMasterService) ListResourceMaster(
	ctx context.Context,
	_ *connect.Request[v1.ListResourceMasterRequest],
) (*connect.Response[v1.ListResourceMasterResponse], error) {
	authnCtx, err := ReadOrUnauthenticated(ctx)

	overview, err := s.query.ListResourceMasters(ctx, authnCtx.TenantId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}

	masters := make([]*v1.ResourceMaster, len(overview.ResourceMasters))
	for i, master := range overview.ResourceMasters {
		masters[i] = &v1.ResourceMaster{
			Id:          master.Id,
			Name:        master.Name,
			Description: master.Description,
			Icon: &v1.Icon{
				Type:  iconType(master.Icon.Type),
				Color: iconColor(master.Icon.Color),
			},
		}
	}

	res := connect.NewResponse(&v1.ListResourceMasterResponse{
		ResourceMasters: masters,
	})
	return res, nil
}

func iconType(iconType string) v1.IconType {
	switch iconType {
	case "fire":
		return v1.IconType_ICON_TYPE_FIRE
	case "team":
		return v1.IconType_ICON_TYPE_TEAM
	case "box":
		return v1.IconType_ICON_TYPE_BOX
	case "function":
		return v1.IconType_ICON_TYPE_FUNCTION
	default:
		return v1.IconType_ICON_TYPE_UNSPECIFIED
	}
}

func iconColor(iconColor string) v1.IconColor {
	switch iconColor {
	case "red":
		return v1.IconColor_ICON_COLOR_RED
	case "green":
		return v1.IconColor_ICON_COLOR_GREEN
	case "blue":
		return v1.IconColor_ICON_COLOR_BLUE
	case "yellow":
		return v1.IconColor_ICON_COLOR_YELLOW
	case "orange":
		return v1.IconColor_ICON_COLOR_ORANGE
	case "purple":
		return v1.IconColor_ICON_COLOR_PURPLE
	case "pink":
		return v1.IconColor_ICON_COLOR_PINK
	case "brown":
		return v1.IconColor_ICON_COLOR_BROWN
	case "gray":
		return v1.IconColor_ICON_COLOR_GRAY
	default:
		return v1.IconColor_ICON_COLOR_UNSPECIFIED
	}
}
