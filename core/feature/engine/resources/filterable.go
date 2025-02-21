package resources

// ResourceFilterable - 実装したリソースは、条件のパラメータとして利用可能になる
// フォームを構築する際に利用されることを想定している
type ResourceFilterable interface {
	Resource
	// Operations - このリソースに対して呼び出すことができる操作
	Operations() []*Method
}
