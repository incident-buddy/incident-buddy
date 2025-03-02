package resources

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/gen/dbaccess"
)

type FormFieldConfig struct {
	Type        domain.FormFieldType
	ArrayType   domain.FormFieldArrayType
	Icon        domain.FromFieldIcon
	PlaceHolder string
}

type ResourceType = string

type Resource interface {
	// Type - テナント内でリソースの型を一意に識別する文字列
	Type() ResourceType
	// FormFieldConfig - リソースをワークフロービルダーのUIでどのように表示および入力するか
	FormFieldConfig() FormFieldConfig
	// BuildFromValue - DBに保存されたIDなどの単一の文字列値から、このタイプのリソースをインスタンス化する方法
	BuildFromValue(ctx context.Context, db *dbaccess.Queries, tenant *domain.Tenant, registry Registry, value *string) (Resource, error)
}

func Interpolate(message ResourceText) string {
	return "Interpolated message"
}
