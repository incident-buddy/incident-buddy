package server

// Server is Incident Buddy's API server.
type Server struct {
	port int
}

func NewServer(port int) *Server {
	return &Server{
		port: port,
	}
}

func (s *Server) Start() {

}
