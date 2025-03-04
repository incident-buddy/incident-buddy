package resources

import "log/slog"

// Registry - リソースの登録と取得
type Registry interface {
	Resources() []ResourceType
}

type registry struct {
	resources []ResourceType
}

func (r *registry) Resources() []ResourceType {
	return r.resources
}
func (r *registry) register(resource Resource) {
	r.resources = append(r.resources, resource.Type())
}

var registryInstance = &registry{
	resources: make([]ResourceType, 0, 256),
}

func RegistryInstance() Registry {
	return registryInstance
}

func RegisterResource(resource Resource) {
	registryInstance.register(resource)
	slog.Info("Registered resource: " + resource.Type())
}
