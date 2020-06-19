
import fetch from 'node-fetch';
import fs from 'fs';
import { basename } from 'path';

import Logger from '../src/logger.js';

const handleError = (err, funcName = '') => {
  Logger.error(funcName + ': ' + err.toString());
  Logger.error(err.stack);
};

export const fetchSimple = (url) => {
  if (!url) {
    const msg = 'FetchSimple: No URL Provided';
    Logger.error(msg);
    return Promise.reject(new Error(msg));
  }
  return fetch(url)
    .catch(e => handleError(e, 'Fetcher#FetchSimple'));
}; 

export const fetchHtml = (url) => {
  return fetchSimple(url)
    .then(res => res.text())
}; 

export const fetchAndSave = (url, dst) => {
  const basedir = basename(dst);
  if (!fs.existsSync(basedir)) {
    
  }
  return new Promise((resolve, reject) => {
    fetchSimple(url).then((res) => {
      const fout = fs.createWriteStream(dst);

      fout.on('close', () => resolve(dst))
       .on('error', (e) => {
         Logger.error('Fetcher#FetchAndSave: Error On Close');
         Logger.error(e.toString());
         Logger.error(e.stack);
         reject(e)
       });

      res.body.pipe(fout)
       .on('error', (e) => {
         Logger.error('Fetcher#FetchAndSave: Error On Pipe');
         Logger.error(e.toString());
         Logger.error(e.stack);
         reject(e)
       });
    });
  })
};

export default {
  fetchSimple,
  fetchHtml,
  fetchAndSave
}

