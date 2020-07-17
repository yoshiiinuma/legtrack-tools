
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import config from './config.js';
import Logger from './logger.js';

const nodeEnv = process.env.NODE_ENV || 'development';

const md5 = (str) => {
  return crypto.createHash('md5').update(str).digest('hex');
};

const filePath = (year, type, dir = '') => {
  const conf = config.load(nodeEnv);
  dir = dir || conf.resultDir || './results';
  const filename = `${year}-${type}.html`;
  return path.join(dir, filename);
};

const load = (year, type, dir = '') => {
  const fpath = filePath(year, type, dir);
  if (!fs.existsSync(fpath)) {
    Logger.debug('LocalFile#load: File Not Exists ' + fpath);
    return null;
  }
  return fs.readFileSync(fpath, 'utf8');
};

const save = (content, year, type, dir = '') => {
  fs.writeFileSync(filePath(year, type, dir), content);
};

const isChanged = (content, year, type, dir = '') => {
  const saved = load(year, type, dir);
  if (!saved) {
    return true;
  }
  return md5(content) !== md5(saved); 
};

export default {
  md5,
  filePath,
  load,
  save,
  isChanged
};
