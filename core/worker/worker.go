package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"google.golang.org/protobuf/encoding/protojson"
	"incident-buddy/core/gen/dbaccess"
	"incident-buddy/core/gen/proto/engine"
	"incident-buddy/core/gen/proto/event"
	"log"

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

type Worker struct {
	db *dbaccess.Queries
}

func NewWorker(db *dbaccess.Queries) *Worker {
	return &Worker{db}
}

func (w *Worker) HandleMessage(writer http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	slog.Info(fmt.Sprintf("start processing message"))
	var m PubSubMessage
	body, err := io.ReadAll(io.LimitReader(r.Body, 4*1024*1024))
	if err != nil {
		http.Error(writer, "Failed to read request body", http.StatusBadRequest)
		return
	}

	if err := json.Unmarshal(body, &m); err != nil {
		http.Error(writer, "Failed to parse request body", http.StatusBadRequest)
		return
	}

	var ev event.Event
	if err := protojson.Unmarshal(m.Message.Data, &ev); err != nil {
		http.Error(writer, "Failed to parse incident", http.StatusBadRequest)
		return
	}

	workflow, err := w.db.FindTriggeringWorkflow(ctx, dbaccess.FindTriggeringWorkflowParams{
		TenantID: ev.TenantId,
		Trigger:  ev.EventCode,
	})
	if err != nil {
		http.Error(writer, "Failed to find workflow", http.StatusBadRequest)
		return
	}
	for _, w := range workflow {
		var ss engine.Steps
		log.Println(string(w.Steps))
		if err := protojson.Unmarshal(w.Steps, &ss); err != nil {
			http.Error(writer, "Failed to parse workflow steps", http.StatusBadRequest)
			return
		}
		slog.Info("workflow:", "name", w.Name, "trigger", w.Trigger)
		for _, s := range ss.Steps {
			slog.Info("step:", "name", s.Code, "params", fmt.Sprintf("%+v", s))
		}
	}

	writer.WriteHeader(http.StatusOK)
	_, _ = writer.Write([]byte(fmt.Sprintf("Message processed: %s", m.Message.ID)))
}
