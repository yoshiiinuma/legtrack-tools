
import SqliteClient from '../src/sqlite-client.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const SELECT_UPDATED_SP_MEASURES_SQL =
  `SELECT * FROM spMeasures
    WHERE year = ? AND spSessionId = ? AND lastUpdated >= ?`;

const SELECT_SP_MEASURES_BY_TYPE_SQL =
  `SELECT year, spSessionId, measureType, measureNumber,
          code, lastUpdated, reportTitle, measureTitle,
          measurePdfUrl, measureArchiveUrl, currentReferral
     FROM spMeasures
    WHERE year = ? AND spSessionId = ? and measureType = ?`;

const INSERT_SP_MEASURE_SQL =
  `INSERT INTO spMeasures
          (year, spSessionId, measureType, measureNumber,
           code, lastUpdated, reportTitle, measureTitle,
           measurePdfUrl, measureArchiveUrl, currentReferral)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_SP_MEASURE_IF_NOT_EXISTS_SQL =
  `INSERT OR IGNORE INTO spMeasures
          (year, spSessionId, measureType, measureNumber,
           code, lastUpdated, reportTitle, measureTitle,
           measurePdfUrl, measureArchiveUrl, currentReferral)
   SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (SELECT Changes() = 0)`;

const UPDATE_SP_MEASURE_SQL =
  `UPDATE OR IGNORE spMeasures
      SET code = ?, lastUpdated = ?, reportTitle = ?, measureTitle = ?,
          measurePdfUrl = ?, measureArchiveUrl = ?, currentReferral = ?
    WHERE year = ? AND spSessionId = ? AND measureType = ? AND measureNumber = ?`;

const create = (env) => {
  const client = SqliteClient.create(env);

  const formatForInsert = (r, timestamp = null) => {
    const ts = timestamp || now();
    return [r.year, r.spSessionId, r.measureType, r.measureNumber,
      r.code, ts, r.reportTitle, r.measureTitle,
      r.measurePdfUrl, r.measureArchiveUrl, r.currentReferral];
  };

  const formatForUpdate = (r, timestamp = null) => {
    const ts = timestamp || now();
    return [r.code, ts, r.reportTitle, r.measureTitle,
      r.measurePdfUrl, r.measureArchiveUrl, r.currentReferral,
      r.year, r.spSessionId, r.measureType, r.measureNumber];
  };

  const compare = (a, b) => {
    if (a.year != b.year) return false;
    if (a.spSessionId != b.spSessionId) return false;
    if (a.measureType != b.measureType) return false;
    if (a.measureNumber != b.measureNumber) return false;
    if (a.code != b.code) return false;
    if (a.measurePdfUrl != b.measurePdfUrl) return false;
    if (a.measureArchiveUrl != b.measureArchiveUrl) return false;
    if (a.measureTitle != b.measureTitle) return false;
    if (a.reportTitle != b.reportTitle) return false;
    if (a.currentReferral != b.currentReferral) return false;
    return true;
  }

  const sortout = (data) => {
    const needInsert = [];
    const needUpdate = [];
    const ignore = [];
    const measureNumbers = {};
    const map = {};
    let type;
    let cur;

    for (const e of data) {
      type = e.measureType;
      if (!map[type]) {
        map[type] = convertToMap(selectSpMeasuresByType(e.year, e.spSessionId, type))
      }
      cur = map[type][e.measureNumber];
      if (cur) {
        if (compare(cur, e)) {
          ignore.push(e);
        } else {
          needUpdate.push(e);
        }
      } else {
        needInsert.push(e);
      }
    } 
    return { needInsert, needUpdate, ignore };
  }

  const convertToMap = (data) => {
    const map = {}
    for (const e of data) {
      map[e.measureNumber] = e;
    };
    return map;
  }

  const deleteAll= () => {
    try {
      return client.run('DELETE FROM spMeasures');
    } catch (e) {
      Logger.error('LocalSpMeasure#DeleteAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectAll= () => {
    try {
      return client.all('SELECT * FROM spMeasures');
    } catch (e) {
      Logger.error('LocalSpMeasure#SelectAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const count = () => {
    try {
      return client.get('SELECT COUNT(*) FROM spMeasures');
    } catch (e) {
      Logger.error('LocalSpMeasure#Count Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectSpMeasuresByType = (year, spSessionId, measureType) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_SP_MEASURES_BY_TYPE_SQL);
      const r = stmt.all(year, spSessionId, measureType);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalSpMeasure#SelectSpMeasureByType Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectSpMeasuresUpdatedAfter = (year, spSessionId, timestamp) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_UPDATED_SP_MEASURES_SQL);
      const r = stmt.all(year, spSessionId, timestamp);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalSpMeasure#SelectSpMeasuresUpdatedAfter Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return [];
    }
  };

  const insert = (data, timestamp = null) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(INSERT_SP_MEASURE_SQL);
      let r;
      const transact = db.transaction((data) => {
        r = stmt.run(formatForInsert(data, timestamp));
      });
      transact(data);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalSpMeasure#Insert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const update = (data, timestamp = null) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(UPDATE_SP_MEASURE_SQL);
      let r;
      const transact = db.transaction((data) => {
        r = stmt.run(formatForUpdate(data, timestamp));
      });
      transact(data);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalSpMeasure#Update Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const bulkUpsert = (data, timestamp = null) => {
    try {
      let cntUpdated = 0;
      let cntInserted = 0;
      const recs = sortout(data);
      const db = client.connect();
      const insert = db.prepare(INSERT_SP_MEASURE_SQL);
      const update = db.prepare(UPDATE_SP_MEASURE_SQL);
      const transact = db.transaction((needInsert, needUpdate) => {
        for (const e of needInsert) {
          insert.run(formatForInsert(e, timestamp));
          cntInserted++;
        }
        for (const e of needUpdate) {
          update.run(formatForUpdate(e, timestamp));
          cntUpdated++;
        }
      });
      transact(recs.needInsert, recs.needUpdate);
      db.close();
      return {
        inserted: cntInserted,
        updated: cntUpdated,
        ignore: recs.ignore.length
      };
    } catch (e) {
      Logger.error('LocalSpMeasure#BulkUpsert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  /**
   * NOTE:
   *
   *   Not check if the given data are different from the existing ones
   *
   */
  const bulkUpsert2 = (data) => {
    let cnt = 0;
    const db = client.connect();
    const update = db.prepare(UPDATE_SP_MEASURE_SQL);
    const insert = db.prepare(INSERT_SP_MEASURE_IF_NOT_EXISTS_SQL);
    const transact = db.transaction((data) => {
      for (const e of data) {
        update.run(formatForUpdate(e));
        insert.run(formatForInsert(e));
        cnt++;
      }
    });
    transact(data);
    db.close();
    return cnt;
  };

  const bulkInsert = (data, timestamp = null) => {
    try {
      let cnt = 0;
      const db = client.connect();
      const stmt = db.prepare(INSERT_SP_MEASURE_SQL);
      const transact = db.transaction((data) => {
        for (const e of data) {
          stmt.run(formatForInsert(e, timestamp));
          cnt++;
        }
      });
      transact(data);
      db.close();
      return cnt;
    } catch (e) {
      Logger.error('LocalSpMeasure#BulkInsert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const bulkUpdate = (data, timestamp = null) => {
    try {
      let cnt = 0;
      const db = client.connect();
      const stmt = db.prepare(UPDATE_SP_MEASURE_SQL);
      const transact = db.transaction((data) => {
        for (const e of data) {
          stmt.run(formatForUpdate(e, timestamp));
          cnt++;
        }
      });
      transact(data);
      db.close();
      return cnt;
    } catch (e) {
      Logger.error('LocalSpMeasure#BulkUpdate Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  return {
    compare,
    sortout,
    convertToMap,
    selectSpMeasuresUpdatedAfter,
    selectSpMeasuresByType,
    selectAll,
    count,
    deleteAll,
    insert,
    update,
    bulkInsert,
    bulkUpdate,
    bulkUpsert
  };
};

export default {
  create
}; 
