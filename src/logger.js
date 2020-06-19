/**
 * Requirements:
 *
 *   Create a config file for the environment
 *   Define NODE_ENV
 *   Otherwise 'development' is the default environment
 *
 * Note:
 *
 *   When imported, this file returns the singleton Logger object.
 *   The logger is automatically configured with the configuration
 *   file specified by NODE_ENV.
 *
 * Usage:
 *
 *   import Logger from '../src/logger.js';
 *
 *   Logger.error('message');
 *   Logger.info('message');
 *   Logger.debug('message');
 *
 */

import SimpleNodeLogger from 'simple-node-logger';

import config from '../src/config.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;
const DEFAULT_LOGLEVEL = 'error';
const DEFAULT_OPTS = {
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
};
let logger;

const getOptions = (env = null) => {
  env = env || nodeEnv;
  const conf = config.load(nodeEnv);
  const level = conf.logLevel || DEFAULT_LOGLEVEL;
  const opts = { level, ...DEFAULT_OPTS };
  if (conf.logFile) {
    opts.logFilePath = conf.logFile;
  }
  return opts;
};

const initLogger = (opts = {}) => {
  if (opts.logFilePath) {
    return SimpleNodeLogger.createSimpleFileLogger(opts);
  }
  return SimpleNodeLogger.createSimpleLogger(opts);
};

const getLogger = (env = null) => {
  const opts = getOptions(env);

  if (!logger) {
    logger = initLogger(opts);
  }
  return logger;
};

export const LoggerHelper = {
  getOptions,
  initLogger,
  getLogger,
};

export default getLogger();

