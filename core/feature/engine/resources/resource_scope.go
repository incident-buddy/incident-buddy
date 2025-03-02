package resources

type Reference struct {
	// Name - リソースの名前
	Name string
	// Label - リソースのラベル
	Label string
	// Resource - リソースの種類
	Resource
}

// Scope - リソースのスコープ
type Scope struct {
	// References - スコープ内のリソース
	Reference
}
