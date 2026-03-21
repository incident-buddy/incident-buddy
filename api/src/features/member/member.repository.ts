import { membersCol } from "../../db/firestore.js";

export const memberRepository = {
  async upsert(slackUserId: string, displayName: string): Promise<void> {
    await membersCol.doc(slackUserId).set(
      {
        slackUserId,
        displayName,
        avatarUrl: "",
        teamIds: [],
      },
      { merge: true },
    );
  },
};
