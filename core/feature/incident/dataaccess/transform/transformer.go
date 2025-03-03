package transform

import incidentv1 "incident-buddy/core/gen/proto/incident/v1"

func NewConnectStatusType(code string) incidentv1.StatusType {
	switch code {
	case "OPEN":
		return incidentv1.StatusType_STATUS_TYPE_OPEN
	case "IN_PROGRESS":
		return incidentv1.StatusType_STATUS_TYPE_IN_PROGRESS
	case "CLOSED":
		return incidentv1.StatusType_STATUS_TYPE_CLOSED
	case "RESOLVED":
		return incidentv1.StatusType_STATUS_TYPE_RESOLVED
	default:
		return incidentv1.StatusType_STATUS_TYPE_UNSPECIFIED
	}
}
