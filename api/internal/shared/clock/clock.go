package clock

import (
	"time"
)

var _ Clock = NewSystemClock()

// Clock is an interface that provides the current time.
type Clock interface {
	Now() time.Time
}

// SystemClock is a concrete implementation of
// the Clock interface that uses the system clock to get the current time.
type SystemClock struct{}

func (s *SystemClock) Now() time.Time {
	return time.Now()
}

func NewSystemClock() *SystemClock {
	return &SystemClock{}
}

// MockClock is a mock implementation of the Clock interface
// that allows you to set a specific time for testing purposes.
type MockClock struct {
	NowTime time.Time
}

func (m *MockClock) Now() time.Time {
	return m.NowTime
}

func NewMockClock(now time.Time) *MockClock {
	return &MockClock{now}
}
