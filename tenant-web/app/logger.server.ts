import pino from "pino";

const _logger = pino({ level: "trace" });

type Kind = "app" | "db";

export function createLogger(loggerName: string, type: Kind = "app") {
	const loggerInstance = _logger.child({ loggerName, type });
	return {
		audit: (msg: string, event: string, params: Record<string, unknown> = {}) =>
			loggerInstance.child({ ...params, type: "audit", event }).info(msg),
		debug: (msg: string, params: Record<string, unknown> = {}) =>
			loggerInstance.child(params).debug(msg),
		info: (msg: string, params: Record<string, unknown> = {}) =>
			loggerInstance.child(params).info(msg),
		warn: (msg: string, params: Record<string, unknown> = {}) =>
			loggerInstance.child(params).warn(msg),
		error: (msg: string, params: Record<string, unknown> = {}) =>
			loggerInstance.child(params).error(msg),
	};
}
