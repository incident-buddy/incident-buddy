package resourcemaster

type ResourceMaster struct {
	Id          string
	Name        string
	Description string
	Code        string
	Icon        *Icon
}

type Icon struct {
	Type  string
	Color string
}
