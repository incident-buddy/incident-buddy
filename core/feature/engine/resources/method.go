package resources

import "reflect"

type ParamType string

const (
	ParamTypeString ParamType = "String"
	ParamTypeText   ParamType = "Text"
	ParamTypeNumber ParamType = "Number"
)

type Param struct {
	Name        string
	Label       string
	Type        ParamType
	Description string
	Array       bool
}

// Method is a named function that can be applied on a resource.
type Method struct {
	// Name is a machine-readable name for the filter, e.g. OperationEqual
	Name string
	// Label is the human-readable name for the filter, e.g. "is equal to"
	Label string
	// Params is what we pass to the operation
	Params []Param
	// Pointer is the function that we call for this operation
	Pointer MethodPointer
}

type MethodPointer reflect.Value

func NewMethodPointer(r Resource, methodName string) MethodPointer {
	return MethodPointer(reflect.ValueOf(r).MethodByName(methodName))
}
