
import sqlite3 from 'better-sqlite3';

import SqliteClient from '../src/sqlite-client.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const SELECT_LATEST_PUSH_SQL =
  `SELECT *
     FROM pushJobs
    WHERE status = 4
      AND dataType = ?
      AND updatedNumber > 0
    ORDER BY startedAt DESC
    LIMIT 1`;

const INSERT_PUSH_JOB_SQL =
  `INSERT INTO pushJobs (
      dataType, scrapeJobId, status, startedAt, totalNumber, updatedNumber)
   VALUES (?, ?, ?, ?, ?, ?)`;

const UPDATE_PUSH_JOB_SQL =
  `UPDATE pushJobs
      SET status = ?,
          completedAt = ?,
          totalNumber = ?,
          updatedNumber = ?
    WHERE id = ?`;

const create = (env) => {
  const client = SqliteClient.create(env);

  const deleteAll = () => {
    try {
      return client.run('DELETE FROM pushJobs');
    } catch (e) {
      Logger.error('LocalPushJob#DeleteAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectAll = () => {
    try {
      return client.all('SELECT * FROM pushJobs');
    } catch (e) {
      Logger.error('LocalPushJob#SelectAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return [];
    }
  };

  const selectOne = () => {
    try {
      return client.get('SELECT * FROM pushJobs');
    } catch (e) {
      Logger.error('LocalPushJob#SelectOne Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const count = () => {
    try {
      const r = client.get('SELECT COUNT(*) FROM pushJobs');
      return r['COUNT(*)'];
    } catch (e) {
      Logger.error('LocalPushJob#Count Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectLatestPush = (dataType) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_LATEST_PUSH_SQL);
      let r;
      const transact = db.transaction((dataType) => {
        r = stmt.get(dataType);
      });
      transact(dataType);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalPushJob#SelectLatestPush Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectLastProcessedScrapeJobId = (dataType) => {
    const r = selectLatestPush(dataType);
    return (r && r.scrapeJobId)? r.scrapeJobId : 0;
  };

  const insert = (dataType, jobId, status = 1, total = 0, updated = 0, timestamp = null) => {
    try {
      const ts = timestamp || now();
      const db = client.connect();
      const stmt = db.prepare(INSERT_PUSH_JOB_SQL);
      let r;
      const transact = db.transaction((dataType, jobId, status, total, updated) => {
        r = stmt.run(dataType, jobId, status, ts, total, updated);
      });
      transact(dataType, jobId, status, total, updated);
      db.close();
      return { ...r, ...{ startedAt: ts } };
    } catch (e) {
      Logger.error('LocalPushJob#Insert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return { error: e.toString(), startedAt: ts };
    }
  };

  const insertError = (dataType, jobId = 0) => {
    return insert(dataType, jobId, 3);
  };

  const update = (id, status, total, updated, timestamp = null) => {
    const ts = timestamp || now();

    try {
      const db = client.connect();
      const stmt = db.prepare(UPDATE_PUSH_JOB_SQL);
      let r;
      const transact = db.transaction((id, status, total, updated) => {
        r = stmt.run(status, ts, total, updated, id);
      });
      transact(id, status, total, updated);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalPushJob#Update Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return { error: e.toString(), startedAt: ts };
    }
  };

  return {
    selectAll,
    selectOne,
    selectLatestPush,
    selectLastProcessedScrapeJobId,
    count,
    deleteAll,
    insert,
    insertError,
    update,
  };
};

export default {
  create,
}; 

