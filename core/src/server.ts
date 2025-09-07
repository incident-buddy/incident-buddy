import { fastify } from "fastify";
import { fastifyConnectPlugin } from "@connectrpc/connect-fastify";
import "dotenv/config";
import { init, setupDBContext } from "./db/setup.ts";
import routes from "./router.ts";

async function main() {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		throw new Error("DATABASE_URL is not set");
	}
	const db = await init({ dbUrl });

	const server = fastify();

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
