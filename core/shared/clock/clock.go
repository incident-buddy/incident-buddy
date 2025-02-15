package clock

import (
	"time"
)

var _ Clock = NewSystemClock()

type Clock interface {
	Now() time.Time
}

type SystemClock struct{}

func (s *SystemClock) Now() time.Time {
	return time.Now().UTC()
}

func NewSystemClock() *SystemClock {
	return &SystemClock{}
}

type MockClock struct {
	NowTime time.Time
}

func (m *MockClock) Now() time.Time {
	return m.NowTime
}

func NewMockClock(now time.Time) *MockClock {
	return &MockClock{now}
}
