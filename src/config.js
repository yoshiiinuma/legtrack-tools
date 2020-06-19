
import fs from 'fs';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

export const filepath = (env) => {
   return './config/' + env + '.json';
};

export const exists = (env) => {
  const conf = filepath(env);
  return fs.existsSync(conf);
}

export const load = (env = '') => {
  env = (env) ? env : nodeEnv;
  const conf = filepath(env);
  if (!exists(env)) {
    throw new Error('Config File Not Exist: ' + conf);
  }
  return JSON.parse(fs.readFileSync(conf));
};

export default {
  load,
  exists,
  filepath
};
