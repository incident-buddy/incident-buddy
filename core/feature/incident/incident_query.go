package incident

import (
	"context"
	"incident-buddy/core/gen/dbaccess"
	. "incident-buddy/core/gen/proto/incident"
	"incident-buddy/core/shared/id"
)

type IncidentQuery struct {
	DB dbaccess.Queries
}

func NewIncidentQuery(db *dbaccess.Queries) IncidentQuery {
	return IncidentQuery{DB: *db}
}

func (q IncidentQuery) ListIncidentOverviews(
	ctx context.Context,
	tenantId id.Id,
) (incident []*IncidentOverview, err error) {
	incidents, err := q.DB.ListIncidents(ctx, tenantId.String())
	if err != nil {
		return nil, err
	}

	overviews := make([]*IncidentOverview, len(incidents))
	for i, inc := range incidents {
		overviews[i] = &IncidentOverview{
			Id:    inc.ID,
			Title: inc.Title,
			Status: &Status{
				Name:       inc.StatusName,
				Color:      inc.StatusColor,
				StatusType: NewConnectStatusType(inc.StatusType),
			},
		}
	}
	return overviews, nil
}
