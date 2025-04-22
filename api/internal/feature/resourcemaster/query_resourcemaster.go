package resourcemaster

import (
	"context"

	dbaccess "github.com/incident-buddy/api/gen/sqlc"
	"github.com/incident-buddy/api/internal/pkg/id"
)

type Query struct {
	DB dbaccess.Queries
}

func NewQuery(db *dbaccess.Queries) *Query {
	return &Query{DB: *db}
}

func (q *Query) ListResourceMasters(
	ctx context.Context,
	tenantId id.Id,
) (overview *Overview, err error) {
	rows, err := q.DB.ListResourceMaster(ctx, tenantId.String())
	if err != nil {
		return nil, err
	}

	masters := make([]*ResourceMaster, len(rows))
	for i, row := range rows {
		masters[i] = &ResourceMaster{
			Id:          row.ID,
			Name:        row.Name,
			Description: row.Description,
			Code:        row.Code,
			Icon: &Icon{
				Type:  row.IconType,
				Color: row.IconColor,
			},
		}
	}
	overview = &Overview{ResourceMasters: masters}
	return overview, nil
}

type Overview struct {
	ResourceMasters []*ResourceMaster
}
