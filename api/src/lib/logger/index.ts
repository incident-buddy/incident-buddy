import pino from "pino";

const _logger = pino();

type LogAttr = { [key: string]: unknown };

export const log = {
  info: (msg: string, attr: LogAttr = {}) => _logger.info(attr, msg),
  warn: (msg: string, attr: LogAttr = {}) => _logger.warn(attr, msg),
  error: (msg: string, attr: LogAttr = {}) => _logger.error(attr, msg),
};
