import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import "dotenv/config";
import { init, setupDBContext } from "./db/setup.ts";
import routes from "./router.ts";
import { createLogger } from "./logger.ts";

async function main() {
	const logger = createLogger(import.meta.filename);
	const env = process.env.ENVIRONMENT;
	if (!env) {
		logger.error("ENVIRONMENT is not set");
		process.exit(1);
	}
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		logger.error("DATABASE_URL is not set");
		process.exit(1);
	}
	const db = await init({ dbUrl });

	const server = fastify({
		logger: { level: env === "production" ? "info" : "debug" },
	});

	server.get("/healthz", (_, reply) => {
		reply.type("text/plain");
		reply.send("OK");
	});
	server.register(fastifyConnectPlugin, {
		routes,
		contextValues: () => setupDBContext(db),
	});

	await server.listen({ host: "localhost", port: 8080 });
	console.log("server is listening at", server.addresses());
}

void main();
