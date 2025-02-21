package steps

import (
	"context"
	"fmt"
	"incident-buddy/core/domain"
	"incident-buddy/core/feature/engine/integrations/sms"
	"incident-buddy/core/feature/engine/resources"
	"incident-buddy/core/gen/dbaccess"
	"log/slog"
)

type StepPhoneSMS struct{}

func (s StepPhoneSMS) Name() string {
	return "phone.sms"
}

func (s StepPhoneSMS) Label() string {
	return "Send an SMS"
}

func (s StepPhoneSMS) Description() string {
	return "Send a templated message to a phone number"
}

func (s StepPhoneSMS) Params() []resources.Param {
	return []resources.Param{
		{
			Name:        "recipients",
			Label:       "Recipient(s)",
			Description: "Which phone number(s) to send the message to",
			Type:        resources.ParamTypeString,
			Array:       true,
		},
		{
			Name:        "message",
			Label:       "Message",
			Description: "What message to send. You can use placeholders like {{name}} to personalize the message. ",
			Type:        resources.ParamTypeText,
		},
	}
}

func (s StepPhoneSMS) Runner(ctx context.Context, queries *dbaccess.Queries, tenant *domain.Tenant) any {
	return func(recipients []resources.ResourceString, message resources.ResourceText) error {
		interpolatedMessage := resources.Interpolate(message)
		for _, recipient := range recipients {
			slog.Info(fmt.Sprintf("Sending SMS to %s", *recipient.Value()))
			err := sms.SendMessage(sms.Message{
				To:   *recipient.Value(),
				Body: interpolatedMessage,
			})
			if err != nil {
				return err
			}
		}
		return nil
	}
}
