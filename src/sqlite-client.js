
import path from 'path';
import sqlite3 from 'better-sqlite3';

import config from '../src/config.js';
import Logger from '../src/logger.js';

const create = (env) => {
  const conf = config.load(env);
  const resultDir = conf.resultDir || '';
  const dbFileName = conf.localDB || ':memory:';

  const connect = () => {
    let dbPath;
    if (dbFileName === ':memory:') {
      dbPath = dbFileName;
    } else {
      dbPath = path.join(resultDir, dbFileName);
    }

    //return new sqlite3(dbFileName, { verbose: console.log });
    return new sqlite3(dbPath);
  };

  const run = (sql) => {
    try {
      const db = connect();
      const stmt = db.prepare(sql);
      let r;
      const transact = db.transaction(() => {
        r = stmt.run();
      });
      transact();
      db.close();
      return r;
    } catch (e) {
      Logger.error('SqliteClient#Run Exception');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const get = (sql) => {
    try {
      const db = connect();
      const stmt = db.prepare(sql);
      const r = stmt.get();
      db.close();
      return r;
    } catch (e) {
      Logger.error('SqliteClient#Get Exception');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const all = (sql) => {
    try {
      const db = connect();
      const stmt = db.prepare(sql);
      const r = stmt.all();
      db.close();
      return r;
    } catch (e) {
      Logger.error('SqliteClient#All Exception');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  return {
    connect,
    run,
    get,
    all
  };
};

export default { create }; 
