package incident

import "incident-buddy/core/gen/dbaccess"

func NewIncidentRepository(
	db *dbaccess.Queries,
) IncidentRepository {
	return IncidentRepository{db}
}

type IncidentRepository struct {
	DB *dbaccess.Queries
}
