package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/go-faker/faker/v4"
	"google.golang.org/protobuf/encoding/protojson"
	ev "incident-buddy/scripts/gen/proto/event"
	"log"
	"log/slog"
	"net/http"
	"strings"
)

type message struct {
	Data []byte `json:"data,omitempty"`
	ID   string `json:"id"`
}
type pubSubMessage struct {
	Message      message `json:"message"`
	Subscription string  `json:"subscription"`
}

func main() {

	var evType *string
	var workerPort *string
	evType = flag.String("evType", "", "which evType to publish")
	workerPort = flag.String("workerPort", "", "worker port")
	flag.Parse()
	if *evType == "" {
		flag.PrintDefaults()
		log.Panicf("evType is required")
	}
	if *workerPort == "" {
		flag.PrintDefaults()
		log.Panicf("workerPort is required")
	}

	var e ev.Event
	switch *evType {
	case "incident":
		e = ev.Event{
			EventCode: "INCIDENT_CREATED",
			TenantId:  "1",
			Payload: &ev.Event_IncidentUpdated{
				IncidentUpdated: &ev.IncidentUpdated{
					IncidentId:   faker.UUIDDigit(),
					IncidentName: faker.Word(),
				},
			},
		}
	case "role":
		e = ev.Event{
			EventCode: "ROLE_ASSIGNED",
			TenantId:  "1",
			Payload: &ev.Event_RoleAssigned{
				RoleAssigned: &ev.RoleAssigned{
					RoleId: faker.UUIDDigit(),
					UserId: faker.UUIDDigit(),
				},
			},
		}
	}
	data, err := protojson.Marshal(&e)
	if err != nil {
		panic(err)
	}
	fmt.Println(string(data))
	message := pubSubMessage{
		Message: message{
			Data: data,
			ID:   faker.UUIDDigit(),
		},
		Subscription: faker.UUIDDigit(),
	}
	c := http.DefaultClient
	js, _ := json.Marshal(message)

	post, err := c.Post(fmt.Sprintf("http://localhost:%s", *workerPort), "application/json", strings.NewReader(string(js)))
	if err != nil {
		panic(err)
	}
	buf := new(bytes.Buffer)
	_, _ = buf.ReadFrom(post.Body)
	body := buf.String()

	slog.Info("", "status", post.Status, "body", body)
}
