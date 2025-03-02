package resources

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/gen/dbaccess"
)

type ResourceText struct {
	value *string
}

func (r ResourceText) Type() string {
	return "Text"
}

func (r ResourceText) FormFieldConfig() FormFieldConfig {
	return FormFieldConfig{
		Type:        domain.FormFieldTextInput,
		ArrayType:   domain.FormFieldArrayTypeNone,
		Icon:        domain.FromFieldIconText,
		PlaceHolder: "text\nmore text",
	}
}

func (r ResourceText) BuildFromValue(ctx context.Context, db *dbaccess.Queries, tenant *domain.Tenant, registry Registry, value *string) (Resource, error) {
	r.value = value
	return r, nil
}
