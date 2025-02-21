package sms

import (
	"fmt"
	"log/slog"
)

type Message struct {
	To   string
	Body string
}

func SendMessage(m Message) error {
	slog.Info(fmt.Sprintf("Sending message to %s: %s", m.To, m.Body))

	return nil
}
