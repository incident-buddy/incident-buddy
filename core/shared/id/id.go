package id

import "github.com/oklog/ulid/v2"

type Id string

func (i Id) String() string {
	return string(i)
}

type IdGenerator interface {
	Generate() (Id, error)
}

type ULIDGenerator struct{}

func (u *ULIDGenerator) Generate() (Id, error) {
	return Id(ulid.Make().String()), nil
}

func NewULIDGenerator() *ULIDGenerator {
	return &ULIDGenerator{}
}

type MockIdGenerator struct {
	GeneratedId Id
}

func (m *MockIdGenerator) Generate() (Id, error) {
	return m.GeneratedId, nil
}

func NewMockIdGenerator(id Id) *MockIdGenerator {
	return &MockIdGenerator{id}
}
