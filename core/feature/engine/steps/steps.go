package steps

import (
	"context"
	"incident-buddy/core/domain"
	"incident-buddy/core/feature/engine/resources"
	"incident-buddy/core/gen/dbaccess"
)

// Step - ワークフローによって実行されるアクション
// パラメータは、スコープから取得された値によって決定される
type Step interface {
	// Name - machine-readable でユニークな名称。 e.g. slack.send_message
	Name() string
	// Label human-readable な名称 e.g. Slackメッセージを送信
	Label() string
	// Description - このステップが何をするかの説明
	Description() string
	// Params - このステップが必要とするパラメータ。Runner に渡される
	Params() []resources.Param
	// Runner - このステップを実行する関数を生成する。関数は、Paramsをパラメータとして受け取る
	Runner(context.Context, *dbaccess.Queries, *domain.Tenant) any
}
