package resources

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/gen/dbaccess"
)

var _ Resource = ResourceString{}

type ResourceString struct {
	value *string
}

func (r ResourceString) Type() string {
	return "String"
}

func (r ResourceString) Value() *string {
	return r.value
}

func (r ResourceString) FormFieldConfig() FormFieldConfig {
	return FormFieldConfig{
		Type:        domain.FormFieldStringInput,
		ArrayType:   domain.FormFieldArrayTypeNone,
		Icon:        domain.FromFieldIconString,
		PlaceHolder: "text",
	}
}

func (r ResourceString) BuildFromValue(ctx context.Context, db *dbaccess.Queries, tenant *domain.Tenant, registry Registry, value *string) (Resource, error) {
	r.value = value
	return r, nil
}

func (r ResourceString) Operations() []*Method {
	return []*Method{
		{
			Name:    "eq",
			Label:   "is equal to",
			Pointer: NewMethodPointer(r, "OperationEqual"),
			Params: []Param{
				{
					Name:  "this",
					Type:  "String",
					Label: "this",
				},
			},
		},
	}
}
