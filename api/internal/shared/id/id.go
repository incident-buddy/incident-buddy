package id

import "github.com/oklog/ulid/v2"

type Id string

func (i Id) String() string {
	return string(i)
}

// Generator is an interface for generating unique IDs.
type Generator interface {
	Generate() (Id, error)
}

// ULIDGenerator generates ULIDs.
type ULIDGenerator struct{}

func (u *ULIDGenerator) Generate() (Id, error) {
	return Id(ulid.Make().String()), nil
}

func NewULIDGenerator() *ULIDGenerator {
	return &ULIDGenerator{}
}

// MockIdGenerator is a mock implementation of the IdGenerator interface
// that allows you to set a specific ID for testing purposes.
type MockIdGenerator struct {
	GeneratedId Id
}

func (m *MockIdGenerator) Generate() (Id, error) {
	return m.GeneratedId, nil
}

func NewMockIdGenerator(id Id) *MockIdGenerator {
	return &MockIdGenerator{id}
}
