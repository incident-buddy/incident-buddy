package resources

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/gen/dbaccess"
)

type Registry interface {
	Resources() []Resource
}

type FormFieldConfig struct {
	Type        domain.FormFieldType
	ArrayType   domain.FormFieldArrayType
	Icon        domain.FromFieldIcon
	PlaceHolder string
}

type Resource interface {
	// Type - テナント内でリソースの型を一意に識別する文字列
	Type() string
	// FormFieldConfig - リソースをワークフロービルダーのUIでどのように表示および入力するか
	FormFieldConfig() FormFieldConfig
	// Build - IDなどの単一の文字列値から、このタイプのリソースをインスタンス化する方法
	Build(ctx context.Context, db *dbaccess.Queries, tenant *domain.Tenant, registry Registry, value *string) (Resource, error)
}

func Interpolate(message ResourceText) string {
	return "Interpolated message"
}
