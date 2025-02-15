package usecase

import (
	"incident-buddy/core/feature/incident/dataaccess"
	"incident-buddy/core/shared/clock"
	"incident-buddy/core/shared/id"
)

type CreateIncidentUsecase struct {
	Clock       clock.Clock
	IdGenerator id.IdGenerator
	Repo        dataaccess.IncidentRepository
}

func NewCreateIncidentUsecase(
	clock clock.Clock,
	idGen id.IdGenerator,
	repo dataaccess.IncidentRepository,
) CreateIncidentUsecase {
	return CreateIncidentUsecase{clock, idGen, repo}
}
