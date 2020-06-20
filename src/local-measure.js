
import SqliteClient from '../src/sqlite-client.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const SELECT_UPDATED_MEASURES_SQL =
  `SELECT * FROM measures
    WHERE lastUpdated >= ?`;

const SELECT_MEASURES_BY_TYPE_SQL =
  `SELECT year, measureType, measureNumber,
          code, lastUpdated, reportTitle, measureTitle,
          measurePdfUrl, measureArchiveUrl, currentReferral,
          bitAppropriation, description, status, introducer,
          companion
     FROM measures
    WHERE year = ? AND measureType = ?`;

const INSERT_MEASURE_SQL =
  `INSERT INTO measures
          (year, measureType, measureNumber,
           code, lastUpdated, reportTitle, measureTitle,
           measurePdfUrl, measureArchiveUrl, currentReferral,
           bitAppropriation, description, status, introducer,
           companion)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_MEASURE_IF_NOT_EXISTS_SQL =
  `INSERT OR IGNORE INTO measures
          (year, measureType, measureNumber,
           code, lastUpdated, reportTitle, measureTitle,
           measurePdfUrl, measureArchiveUrl, currentReferral,
           bitAppropriation, description, status, introducer,
           companion)
   SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (SELECT Changes() = 0)`;

const UPDATE_MEASURE_SQL =
  `UPDATE OR IGNORE measures
      SET code = ?, lastUpdated = ?, reportTitle = ?, measureTitle = ?,
          measurePdfUrl = ?, measureArchiveUrl = ?, currentReferral = ?,
          bitAppropriation = ?, description = ?, status = ?, introducer = ?,
          companion = ?
    WHERE year = ? AND measureType = ? AND measureNumber = ?`;

const create = (env) => {
  const client = SqliteClient.create(env);

  const formatForInsert = (r, timestamp = null) => {
    const ts = timestamp || now();
    return [r.year, r.measureType, r.measureNumber,
      r.code, ts, r.reportTitle, r.measureTitle,
      r.measurePdfUrl, r.measureArchiveUrl, r.currentReferral,
      r.bitAppropriation, r.description, r.status, r.introducer,
      r.companion ];
  };

  const formatForUpdate = (r, timestamp = null) => {
    const ts = timestamp || now();
    return [r.code, ts, r.reportTitle, r.measureTitle,
      r.measurePdfUrl, r.measureArchiveUrl, r.currentReferral,
      r.bitAppropriation, r.description, r.status, r.introducer,
      r.companion,
      r.year, r.measureType, r.measureNumber];
  };

  const compare = (a, b) => {
    if (a.year != b.year) return false;
    if (a.measureType != b.measureType) return false;
    if (a.measureNumber != b.measureNumber) return false;
    if (a.code != b.code) return false;
    if (a.measurePdfUrl != b.measurePdfUrl) return false;
    if (a.measureArchiveUrl != b.measureArchiveUrl) return false;
    if (a.measureTitle != b.measureTitle) return false;
    if (a.reportTitle != b.reportTitle) return false;
    if (a.bitAppropriation != b.bitAppropriation) return false;
    if (a.description != b.description) return false;
    if (a.status != b.status) return false;
    if (a.introducer != b.introducer) return false;
    if (a.companion != b.companion) return false;
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
        map[type] = convertToMap(selectMeasuresByType(e.year, type))
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
      return client.run('DELETE FROM measures');
    } catch (e) {
      Logger.error('LocalMeasure#DeleteAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectAll= () => {
    try {
      return client.all('SELECT * FROM measures');
    } catch (e) {
      Logger.error('LocalMeasure#SelectAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const count = () => {
    try {
      return client.get('SELECT COUNT(*) FROM measures');
    } catch (e) {
      Logger.error('LocalMeasure#Count Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectMeasuresByType = (year, measureType) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_MEASURES_BY_TYPE_SQL);
      const r = stmt.all(year, measureType);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalMeasure#SelectMeasureByType Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectMeasuresUpdatedAfter = (year, timestamp) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_UPDATED_MEASURES_SQL);
      const r = stmt.all(year, timestamp);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalMeasure#SelectMeasuresUpdatedAfter Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return [];
    }
  };

  const insert = (data, timestamp = null) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(INSERT_MEASURE_SQL);
      let r;
      const transact = db.transaction((data) => {
        r = stmt.run(formatForInsert(data, timestamp));
      });
      transact(data);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalMeasure#Insert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const update = (data, timestamp = null) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(UPDATE_MEASURE_SQL);
      let r;
      const transact = db.transaction((data) => {
        r = stmt.run(formatForUpdate(data, timestamp));
      });
      transact(data);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalMeasure#Update Error');
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
      const insert = db.prepare(INSERT_MEASURE_SQL);
      const update = db.prepare(UPDATE_MEASURE_SQL);
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
      Logger.error('LocalMeasure#BulkUpsert Error');
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
    const update = db.prepare(UPDATE_MEASURE_SQL);
    const insert = db.prepare(INSERT_MEASURE_IF_NOT_EXISTS_SQL);
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
      const stmt = db.prepare(INSERT_MEASURE_SQL);
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
      Logger.error('LocalMeasure#BulkInsert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const bulkUpdate = (data, timestamp = null) => {
    try {
      let cnt = 0;
      const db = client.connect();
      const stmt = db.prepare(UPDATE_MEASURE_SQL);
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
      Logger.error('LocalMeasure#BulkUpdate Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  return {
    compare,
    sortout,
    convertToMap,
    selectMeasuresUpdatedAfter,
    selectMeasuresByType,
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
