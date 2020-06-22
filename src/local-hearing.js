
import SqliteClient from '../src/sqlite-client.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const SELECT_UPDATED_HEARINGS_SQL =
  `SELECT * FROM hearings
    WHERE lastUpdated >= ?`;

const SELECT_HEARINGS_BY_YEAR_SQL =
  `SELECT year, measureType, measureNumber, measureRelativeUrl,
          code, committee, lastUpdated, timestamp, datetime,
          description, room, notice, noticeUrl, noticePdfUrl
     FROM hearings
    WHERE year = ?`;

const SELECT_HEARINGS_BY_TYPE_SQL =
  `SELECT year, measureType, measureNumber, measureRelativeUrl,
          code, committee, lastUpdated, timestamp, datetime,
          description, room, notice, noticeUrl, noticePdfUrl
     FROM hearings
    WHERE year = ? AND measureType = ?`;

const INSERT_HEARING_SQL =
  `INSERT INTO hearings
          (year, measureType, measureNumber, measureRelativeUrl,
           code, committee, lastUpdated, timestamp, datetime,
           description, room, notice, noticeUrl, noticePdfUrl)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_HEARING_IF_NOT_UPDATED_SQL =
  `INSERT OR IGNORE INTO hearings
          (year, measureType, measureNumber, measureRelativeUrl,
           code, committee, lastUpdated, timestamp, datetime,
           description, room, notice, noticeUrl, noticePdfUrl)
   SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (SELECT Changes() = 0)`;

const UPDATE_HEARING_SQL =
  `UPDATE OR IGNORE hearings
      SET measureRelativeUrl = ?, code = ?, committee = ?,
          lastUpdated = ?, timestamp = ?, datetime = ?,
          description = ?, room = ?, noticeUrl = ?, noticePdfUrl = ?
    WHERE year = ? AND measureType = ? AND measureNumber = ? AND notice = ?`;

const create = (env) => {
  const client = SqliteClient.create(env);

  const formatForInsert = (r, timestamp = null) => {
    const ts = timestamp || now();
    return [r.year, r.measureType, r.measureNumber, r.measureRelativeUrl,
      r.code, r.committee, ts, r.timestamp, r.datetime,
      r.description, r.room, r.notice, r.noticeUrl, r.noticePdfUrl];
  };

  const formatForUpdate = (r, timestamp = null) => {
    const ts = timestamp || now();
    return [r.measureRelativeUrl, r.code, r.committee,
      ts, r.timestamp, r.datetime,
      r.description, r.room, r.noticeUrl, r.noticePdfUrl,
      r.year, r.measureType, r.measureNumber, r.notice];
  };

  const compare = (a, b) => {
    if (a.year != b.year) return false;
    if (a.measureType != b.measureType) return false;
    if (a.measureNumber != b.measureNumber) return false;
    if (a.measureRelativeUrl != b.measureRelativeUrl) return false;
    if (a.code != b.code) return false;
    if (a.committee != b.committee) return false;
    if (a.datetime != b.datetime) return false;
    if (a.description != b.description) return false;
    if (a.room != b.room) return false;
    if (a.notice != b.notice) return false;
    if (a.noticeUrl != b.noticeUrl) return false;
    if (a.noticePdfUrl != b.noticePdfUrl) return false;
    return true;
  }

  const sortout = (year, data) => {
    const needInsert = [];
    const needUpdate = [];
    const ignore = [];
    const measureNumbers = {};
    const map = convertToMap(selectAllByYear(year));
    let type;
    let num;
    let notice;
    let cur;

    for (const e of data) {
      type = e.measureType;
      num = e.measureNumber;
      notice = e.notice;
      cur = (map[type] && map[type][num] && map[type][num][notice]) ? map[type][num][notice] : null;
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
      if (!map[e.measureType]) map[e.measureType] = {};
      if (!map[e.measureType][e.measureNumber]) map[e.measureType][e.measureNumber] = {};
      map[e.measureType][e.measureNumber][e.notice] = e;
    };
    return map;
  }

  const convertToMapOld = (data) => {
    const map = {}
    for (const e of data) {
      map[e.measureNumber] = e;
    };
    return map;
  }

  const deleteAll= () => {
    try {
      return client.run('DELETE FROM hearings');
    } catch (e) {
      Logger.error('LocalHearing#DeleteAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectAll= () => {
    try {
      return client.all('SELECT * FROM hearings');
    } catch (e) {
      Logger.error('LocalHearing#SelectAll Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const count = () => {
    try {
      return client.get('SELECT COUNT(*) FROM hearings');
    } catch (e) {
      Logger.error('LocalHearing#Count Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectAllByYear = (year) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_HEARINGS_BY_YEAR_SQL);
      const r = stmt.all(year);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalHearing#SelectHearingByYear Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const selectAllByType = (year, measureType) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_HEARINGS_BY_TYPE_SQL);
      const r = stmt.all(year, measureType);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalHearing#SelectHearingByType Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  //const selectUpdatedAfter = (year, timestamp) => {
  const selectUpdatedAfter = (timestamp) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(SELECT_UPDATED_HEARINGS_SQL);
      //const r = stmt.all(year, timestamp);
      const r = stmt.all(timestamp);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalHearing#SelectHearingsUpdatedAfter Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return [];
    }
  };

  const insert = (data, timestamp = null) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(INSERT_HEARING_SQL);
      let r;
      const transact = db.transaction((data) => {
        r = stmt.run(formatForInsert(data, timestamp));
      });
      transact(data);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalHearing#Insert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const update = (data, timestamp = null) => {
    try {
      const db = client.connect();
      const stmt = db.prepare(UPDATE_HEARING_SQL);
      let r;
      const transact = db.transaction((data) => {
        r = stmt.run(formatForUpdate(data, timestamp));
      });
      transact(data);
      db.close();
      return r;
    } catch (e) {
      Logger.error('LocalHearing#Update Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const bulkUpsert = (data, year, timestamp = null) => {
    try {
      let cntUpdated = 0;
      let cntInserted = 0;
      const records = sortout(year, data);
      const db = client.connect();
      const insert = db.prepare(INSERT_HEARING_SQL);
      const update = db.prepare(UPDATE_HEARING_SQL);
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
      transact(records.needInsert, records.needUpdate);
      db.close();
      return {
        inserted: cntInserted,
        updated: cntUpdated,
        ignore: records.ignore.length
      };
    } catch (e) {
      Logger.error('LocalHearing#BulkUpsert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  /**
   * NOTE:
   *
   *   Not check if the given data are different from the existing ones
   *   Try to update first, then insert if update failed
   *
   */
  const bulkUpsert2 = (data) => {
    let cnt = 0;
    const db = client.connect();
    const update = db.prepare(UPDATE_HEARING_SQL);
    const insert = db.prepare(INSERT_HEARING_IF_NOT_UPDATED_SQL);
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
      const stmt = db.prepare(INSERT_HEARING_SQL);
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
      Logger.error('LocalHearing#BulkInsert Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  const bulkUpdate = (data, timestamp = null) => {
    try {
      let cnt = 0;
      const db = client.connect();
      const stmt = db.prepare(UPDATE_HEARING_SQL);
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
      Logger.error('LocalHearing#BulkUpdate Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  return {
    compare,
    sortout,
    convertToMap,
    selectUpdatedAfter,
    selectAllByYear,
    selectAllByType,
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
