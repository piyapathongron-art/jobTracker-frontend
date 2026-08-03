/* eslint-disable @typescript-eslint/no-explicit-any -- stub LINE clients and hand-built
   webhook events; typing them fully would mean reconstructing the whole SDK surface for no gain. */
import assert from "node:assert/strict";
import { handleEventsBatch } from "../../lib/line/handlers.ts";

// Unlinked LINE users short-circuit to a single NOT_LINKED reply per *group*,
// so counting replies counts groups.
const replies: string[] = [];
const client: any = {
  replyMessage: async (r: any) => { replies.push(r.replyToken); },
  pushMessage: async () => {},
};
const blobClient: any = { getMessageContent: async () => { throw new Error("stub"); } };

const img = (id: string, user: string, token: string) => ({
  type: "message", replyToken: token, source: { type: "user", userId: user },
  message: { type: "image", id },
});

await handleEventsBatch([img("m1","U1","t1"), img("m2","U1","t2"), img("m3","U1","t3")] as any, client, blobClient);
console.log("3 images, same user -> replyTokens used:", replies);
assert.equal(replies.length, 1, "3 images from one user in one batch must form ONE group");
assert.equal(replies[0], "t1", "the group must reply with the FIRST event's replyToken");

replies.length = 0;
await handleEventsBatch([img("a1","U1","t1"), img("b1","U2","t2"), img("a2","U1","t3")] as any, client, blobClient);
console.log("U1,U2,U1 interleaved   -> replyTokens used:", replies);
assert.deepEqual(replies, ["t1","t2"], "U1's two images group; U2 stays a separate group");

console.log("\n✅ GROUPING OK");
