package query

import (
	"context"
	"incident-buddy/core/feature/incident/dataaccess/transform"
	"incident-buddy/core/gen/dbaccess"
	incidentv1 "incident-buddy/core/gen/proto/incidentbuddy/incident/v1"
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
) (incident []*incidentv1.IncidentOverview, err error) {
	incidents, err := q.DB.ListIncidents(ctx, tenantId.String())
	if err != nil {
		return nil, err
	}

	overviews := make([]*incidentv1.IncidentOverview, len(incidents))
	for i, inc := range incidents {
		overviews[i] = &incidentv1.IncidentOverview{
			Id:    inc.ID,
			Title: inc.Title,
			Status: &incidentv1.Status{
				Name:       inc.StatusName,
				Color:      inc.StatusColor,
				StatusType: transform.NewConnectStatusType(inc.StatusType),
			},
		}
	}
	return overviews, nil
}
