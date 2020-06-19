
import sqlite3 from 'better-sqlite3';

import SqliteClient from '../src/sqlite-client.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const SELECT_SCRAPE_JOB_UPDATED_AFTER_SQL =
  `SELECT id, startedAt
     FROM scrapeJobs
    WHERE status = 4
      AND dataType = ?
      AND id > ?
      AND updatedNumber > 0
    ORDER BY startedAt ASC
    LIMIT 1`;

const INSERT_SCRAPE_JOB_SQL =
  `INSERT INTO scrapeJobs (
      dataType, status, startedAt, totalNumber, updatedNumber, updateNeeded)
   VALUES (?, ?, ?, ?, ?, ?)`;

const UPDATE_SCRAPE_JOB_SQL =
  `UPDATE scrapeJobs
      SET status = ?,
          completedAt = ?,
          totalNumber = ?,
          updatedNumber = ?,
          updateNeeded = ?
    WHERE id = ?`;

const INSERT_SCRAPE_DETAILS_SQL =
  `INSERT INTO scrapeDetails (
     scrapeJobId, measureType, status, startedAt, completedAt, totalNumber, updatedNumber)
   VALUES (?, ?, ?, ?, ?, ?, ?)`;

const create = (env) => {
  const client = SqliteClient.create(env);

  const deleteAllJobs = () => {
    try {
      return client.run('DELETE FROM scrapeJobs');
    } catch (e) {
      Logger.error('LocalScrapeJob#DeleteAllJobs Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const deleteAllDetails = () => {
    try {
      return client.run('DELETE FROM scrapeDetails');
    } catch (e) {
      Logger.error('LocalScrapeJob#DeleteAllDetails Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const selectAllJobs = () => {
    try {
      return client.all('SELECT * FROM scrapeJobs');
    } catch (e) {
      Logger.error('LocalScrapeJob#SelectAllJobs Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const selectAllDetails = () => {
    try {
      return client.all('SELECT * FROM scrapeDetails');
    } catch (e) {
      Logger.error('LocalScrapeJob#SelectAllDetails Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const selectOneJob = () => {
    try {
      return client.get('SELECT * FROM scrapeJobs');
    } catch (e) {
      Logger.error('LocalScrapeJob#SelectOneJob Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const selectOneDetail = () => {
    try {
      return client.get('SELECT * FROM scrapeDetails');
    } catch (e) {
      Logger.error('LocalScrapeJob#SelectOneDetail Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const countJobs = () => {
      return client.get('SELECT COUNT(*) FROM scrapeJobs');
    try {
    } catch (e) {
      Logger.error('LocalScrapeJob#CountJobs Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const countDetails = () => {
      return client.get('SELECT COUNT(*) FROM scrapeDetails');
    try {
    } catch (e) {
      Logger.error('LocalScrapeJob#CoundDetails Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const selectJobUpdatedAfter = (dataType, id) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_SCRAPE_JOB_UPDATED_AFTER_SQL);
      let r;
      const transact = db.transaction((dataType, id) => {
        r = stmt.get(dataType, id);
      });
      transact(dataType, id);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalScrapeJob#SelectJobUpdatedAfter Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const insertJob = (dataType, status = 1, total = 0, updated = 0, updateNeeded = 0, timestamp = null) => {
      const ts = timestamp || now();
      const db = client.connect();
      const stmt = db.prepare(INSERT_SCRAPE_JOB_SQL);
      let r;
      const transact = db.transaction((dataType, status, total, updated, updateNeeded) => {
        r = stmt.run(dataType, status, ts, total, updated, updateNeeded);
      });
      transact(dataType, status, total, updated, updateNeeded);
      db.close();
      return { ...r, ...{ startedAt: ts } };
    try {
    } catch (e) {
      Logger.error('LocalScrapeJob#InsertJob Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const updateJob = (id, status, total, updated, timestamp = null) => {
      const ts = timestamp || now();
      const db = client.connect();
      const stmt = db.prepare(UPDATE_SCRAPE_JOB_SQL);
      let r;
      const transact = db.transaction((id, status, total, updated) => {
        const updateNeeded = updated > 0 ? 1 : 0;
        r = stmt.run(status, ts, total, updated, updateNeeded, id);
      });
      transact(id, status, total, updated);
      db.close();
      return r;
    try {
    } catch (e) {
      Logger.error('LocalScrapeJob#UpdateJob Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const insertDetail = (jobId, measureType, status, startedAt, total, updated) => {
      const db = client.connect();
      const stmt = db.prepare(INSERT_SCRAPE_DETAILS_SQL);
      let r;
      const transact = db.transaction((jobId, measureType, status, startedAt, total, updated) => {
        r = stmt.run(jobId, measureType, status, startedAt, now(), total, updated);
      });
      transact(jobId, measureType, status, startedAt, total, updated);
      db.close();
      return r;
    try {
    } catch (e) {
      Logger.error('LocalScrapeJob#InsertDetail Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  return {
    selectAllJobs,
    selectOneJob,
    selectAllDetails,
    selectOneDetail,
    selectJobUpdatedAfter,
    countJobs,
    countDetails,
    deleteAllJobs,
    deleteAllDetails,
    insertJob,
    updateJob,
    insertDetail,
  };
};

export default {
  create,
}; 

