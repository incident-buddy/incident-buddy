package triggers

type TriggerIncidentUpdated struct {
	IncidentId string
}

func (t TriggerIncidentUpdated) Name() string {
	return "incident.updated"
}
