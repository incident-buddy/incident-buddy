package incident

import (
	. "incident-buddy/core/gen/proto/incident"
)

func NewConnectStatusType(code string) StatusType {
	switch code {
	case "OPEN":
		return StatusType_STATUS_TYPE_OPEN
	case "IN_PROGRESS":
		return StatusType_STATUS_TYPE_IN_PROGRESS
	case "CLOSED":
		return StatusType_STATUS_TYPE_CLOSED
	case "RESOLVED":
		return StatusType_STATUS_TYPE_RESOLVED
	default:
		return StatusType_STATUS_TYPE_UNSPECIFIED
	}
}
