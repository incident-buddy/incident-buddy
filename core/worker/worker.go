package worker

import (
	"encoding/json"
	"fmt"
	"google.golang.org/protobuf/encoding/protojson"
	"incident-buddy/core/gen/proto/event"

	"io"
	"log/slog"
	"net/http"
)

type PubSubMessage struct {
	Message struct {
		Data []byte `json:"data,omitempty"`
		ID   string `json:"id"`
	} `json:"message"`
	Subscription string `json:"subscription"`
}

func HandleMessage(w http.ResponseWriter, r *http.Request) {
	slog.Info(fmt.Sprintf("start processing message"))
	var m PubSubMessage
	body, err := io.ReadAll(io.LimitReader(r.Body, 4*1024*1024))
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	if err := json.Unmarshal(body, &m); err != nil {
		http.Error(w, "Failed to parse request body", http.StatusBadRequest)
		return
	}

	var ev event.IncidentUpdated
	if err := protojson.Unmarshal(m.Message.Data, &ev); err != nil {
		http.Error(w, "Failed to parse incident", http.StatusBadRequest)
		return
	}

	fmt.Printf("Incident name: %s\n", ev.IncidentName)
	fmt.Printf("Incident ID: %s\n", ev.IncidentId)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}
