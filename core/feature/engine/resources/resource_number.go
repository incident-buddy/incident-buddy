package resources

import (
	"context"
	"fmt"
	"incident-buddy/core/domain"
	"incident-buddy/core/gen/dbaccess"
	"strconv"
)

var _ Resource = ResourceNumber{}

type ResourceNumber struct {
	value *float64
}

func (r ResourceNumber) Type() ResourceType {
	return "Number"
}

func (r ResourceNumber) FormFieldConfig() FormFieldConfig {
	return FormFieldConfig{
		Type:        domain.FormFieldNumberInput,
		ArrayType:   domain.FormFieldArrayTypeNone,
		Icon:        domain.FromFieldIconNumber,
		PlaceHolder: "123",
	}
}

func (r ResourceNumber) BuildFromValue(ctx context.Context, db *dbaccess.Queries, tenant *domain.Tenant, registry Registry, value *string) (Resource, error) {
	if value != nil {
		valueNumber, err := strconv.ParseFloat(*value, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid number value: %w", err)
		}

		r.value = &valueNumber
	}
	return r, nil
}

func (r ResourceNumber) Operations() []*Method {
	return []*Method{
		{
			Name:    "eq",
			Label:   "is equal to",
			Pointer: NewMethodPointer(r, "OperationEqual"),
			Params: []Param{
				{
					Name:  "this",
					Type:  ParamTypeNumber,
					Label: "this",
				},
			},
		},
		{
			Name:    "gte",
			Label:   "is greater or equal to",
			Pointer: NewMethodPointer(r, "OperationGreaterThanOrEqual"),
			Params: []Param{
				{
					Name:  "this",
					Type:  ParamTypeNumber,
					Label: "this",
				},
			},
		},
	}
}

func (r ResourceNumber) OperationEqual(this ResourceNumber) bool {
	return r.value != nil && this.value != nil && *r.value == *this.value
}

func (r ResourceNumber) OperationGreaterThanOrEqual(this ResourceNumber) bool {
	return r.value != nil && this.value != nil && *r.value >= *this.value
}
