import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

import { db } from "./db.ts";

const middleware = fp(async (fastify: FastifyInstance, _options: unknown) => {
	fastify.addHook("onRequest", async (request) => {
		request.db = db;
	});
});

export { middleware };
