package main

import (
	"cloud.google.com/go/pubsub"
	"context"
	"errors"
	"fmt"
	"google.golang.org/api/iterator"
	"os"
)

func main() {
	// get project ID from Env var
	projectID := os.Getenv("GCLOUD_PROJECT_ID")
	topicID := os.Getenv("GCLOUD_PUBSUB_TOPIC")
	if topicID == "" {
		panic(errors.New("GCLOUD_PUBSUB_TOPIC must be set"))
	}
	subID := os.Getenv("GCLOUD_PUBSUB_SUBSCRIPTION")
	if subID == "" {
		panic(errors.New("GCLOUD_PUBSUB_SUBSCRIPTION must be set"))
	}

	fmt.Printf("Topic ID: %s\n", topicID)
	fmt.Printf("Subscription ID: %s\n", subID)

	ctx := context.Background()
	client, err := pubsub.NewClient(ctx, projectID)
	if err != nil {
		panic(err)
	}
	defer client.Close()

	var topicFound bool
	topics := client.Topics(ctx)
	for {
		topic, err := topics.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			panic(err)
		}
		if topic.ID() == topicID {
			topicFound = true
			break
		}
	}
	if topicFound {
		fmt.Printf("Init topic skipped. Topic %s already exists.\n", topicID)
	} else {
		topic, err := client.CreateTopic(ctx, topicID)
		if err != nil {
			panic(err)
		}
		fmt.Printf("Created topic: %s\n", topic)
	}

	var subFound bool
	subs := client.Subscriptions(ctx)
	for {
		sub, err := subs.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			panic(err)
		}
		if sub.ID() == subID {
			subFound = true
			break
		}
	}
	if subFound {
		fmt.Printf("Init subscription skipped. Subscription %s already exists.\n", subID)
	} else {
		_, err := client.CreateSubscription(ctx, subID, pubsub.SubscriptionConfig{
			Topic: client.Topic(topicID),
		})
		if err != nil {
			panic(err)
		}
		fmt.Printf("Created subscription: %s\n", subID)
	}
}
