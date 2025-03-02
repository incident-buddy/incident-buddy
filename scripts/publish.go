package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/go-faker/faker/v4"
	"google.golang.org/protobuf/encoding/protojson"
	ev "incident-buddy/scripts/gen/proto/incidentbuddy/event"
	"log"
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

	switch *evType {
	case "incident":
		payload, err := protojson.Marshal(&ev.IncidentUpdated{
			IncidentId:   faker.UUIDDigit(),
			IncidentName: faker.Name(),
		})
		if err != nil {
			panic(err)
		}
		message := pubSubMessage{
			Message: message{
				Data: payload,
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
		log.Println(post.Status)
	}
}
