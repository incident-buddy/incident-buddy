package incident

import (
	"incident-buddy/core/shared/clock"
	"incident-buddy/core/shared/id"
)

type CreateIncidentUsecase struct {
	Clock       clock.Clock
	IdGenerator id.IdGenerator
	Repo        IncidentRepository
}

func NewCreateIncidentUsecase(
	clock clock.Clock,
	idGen id.IdGenerator,
	repo IncidentRepository,
) CreateIncidentUsecase {
	return CreateIncidentUsecase{clock, idGen, repo}
}
