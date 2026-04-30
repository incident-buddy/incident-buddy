export interface SlackClient {
  createChannel(input: CreateChannelInput): PromiseLike<CreateChannelOutput>;
  postMessage(input: PostMessageInput): PromiseLike<PostMessageOutput>;
  setTopic(input: SetTopicInput): PromiseLike<SetTopicOutput>;
  inviteMember(input: InviteMemberInput): PromiseLike<InviteMemberOutput>;
}

type CreateChannelInput = {};
type CreateChannelOutput = {
  channelId: string;
};

type PostMessageInput = {};
type PostMessageOutput = {};

type SetTopicInput = {};
type SetTopicOutput = {};

type InviteMemberInput = {};
type InviteMemberOutput = {};
