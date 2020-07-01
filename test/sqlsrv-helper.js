
import SqlsrvClient from '../src/sql-server-client.js';
import config from '../src/config.js';

const conf = config.load('test');

const deleteAllHearings = async () => {
  const client = SqlsrvClient.create(conf);
  return await client.query('DELETE FROM hearings');
}

const selectHearings = async () => {
  const sql =
    `SELECT year, measureType, measureNumber, notice, measureRelativeUrl,
            code, committee, lastUpdated, timestamp, datetime, description,
            room, noticeUrl, noticePdfUrl
       FROM hearings
      ORDER BY year, measureType, measureNumber`;
  const client = SqlsrvClient.create(conf);
  const r = await client.query(sql);
  if (!r || !r.recordset) return null;
  return r.recordset;
};

const countHearings = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query('SELECT COUNT(*) from hearings');
  if (!r || !r.recordset) return null;
  return r.recordset.pop()[''];
};

/**
 * id: used for measurenumber
 */
export const generateHearing = (id, year = 2020, measureType = 'hb') => {
  const measureNumber = id;
  const mType = measureType.toUpperCase();
  const code = `${mType}${id}`;
  const d = new Date(year, 0, 1 + id, 9);
  const sdate = d.toISOString().slice(0, 10);
  const datetime = `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} 9:00 AM`;
  const timestamp = Math.floor(d.getTime() / 1000);

  return {
    year, measureType, measureNumber, code, datetime, timestamp,
    measureRelativeUrl: `https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=${mType}&billnumber=${id}`,
    noticeUrl: `https://www.capitol.hawaii.gov/session${year}/hearingnotices/HEARING_${sdate}_.HTM`,
    noticePdfUrl: `https://www.capitol.hawaii.gov/session${year}/hearingnotices/HEARING_${sdate}_.pdf`,
    notice: `NOTICE${id}`,
    description: `DESC${id}`,
    committee: `COMM${id}`,
    room: `ROOM${id}`,
  };
};

/**
 * ids: array of intergers (e.g. [1, 2, 5])
 */
export const generateHearings = (ids, year = 2020, measureType = 'hb') => {
  return ids.map((i) => generateHearing(i, year, measureType));
};

/**
 * replaces reporttitle and measuretitle of records specfied by ids with newval
 */
const modifyHearings = (data, ids, newval) => {
  return data.map((r) => {
    if (ids.includes(r.measureNumber)) {
      const val = `${newval}${r.measureNumber}`
      const description = val;
      const committee = val;
      return { ...r, ...{ description, committee } };
    } else {
      return r
    }
  });
};

const deleteAllBills = async () => {
  const client = SqlsrvClient.create(conf);
  return await client.query('DELETE FROM measures');
}

const selectBills = async () => {
  const sql =
    `SELECT year, measureType, measureNumber, reportTitle,
            measureTitle, currentReferral, bitAppropriation,
            description, status, introducer, companion
       FROM measures
      ORDER BY year, measureType, measureNumber`;
  const client = SqlsrvClient.create(conf);
  const r = await client.query(sql);
  if (!r || !r.recordset) return null;
  return r.recordset;
};

const countBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query('SELECT COUNT(*) from measures');
  if (!r || !r.recordset) return null;
  return r.recordset.pop()[''];
};

/**
 * id: used for measurenumber
 */
const generateBill = (id, year = 2020, measureType = 'hb') => {
  const measureNumber = id;
  const mType = measureType.toUpperCase();
  const code = `${mType}${id}`;
  return {
    year, measureType, measureNumber, code,
    measurePdfUrl: `https://www.capitol.hawaii.gov/session${year}/bills/${code}.pdf`,
    measureArchiveUrl: 'https://www.capitol.hawaii.gov/measure_indiv.aspx?' +
      `billtype=${mType}&billnumber=${id}&year=${year}`,
    reportTitle: `REPORT${id}`,
    measureTitle: `MEASURE${id}`,
    currentReferral: `REF${id}`,
    bitAppropriation: 0,
    description: `DESC${id}`,
    status: `STAT${id}`,
    introducer: `INTR${id}`,
    companion: `COMP${id}`
  };
};

/**
 * ids: array of intergers (e.g. [1, 2, 5])
 */
const generateBills = (ids, year = 2020, measureType = 'hb') => {
  return ids.map((i) => generateSpBill(i, year, measureType));
};

/**
 * replaces reporttitle and measuretitle of records specfied by ids with newval
 */
const modifyBills = (data, ids, newval) => {
  return data.map((r) => {
    if (ids.includes(r.measureNumber)) {
      const val = `${newval}${r.measureNumber}`
      const reportTitle = val;
      const measureTitle = val;
      return { ...r, ...{ reportTitle, measureTitle } };
    } else {
      return r
    }
  });
};

const deleteAllSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  return await client.query('DELETE FROM spMeasures');
}

const selectSpBills = async () => {
  const sql =
    `SELECT year, spSessionId, measureType, measureNumber, reportTitle,
            measureTitle, currentReferral
       FROM spMeasures
      ORDER BY year, spSessionId, measureType, measureNumber`;
  const client = SqlsrvClient.create(conf);
  const r = await client.query(sql);
  if (!r || !r.recordset) return null;
  return r.recordset;
};

const countSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query('SELECT COUNT(*) from spMeasures');
  if (!r || !r.recordset) return null;
  return r.recordset.pop()[''];
};

/**
 * id: used for measurenumber
 */
const generateSpBill = (id, year = 2020, spSessionId = 'a', measureType = 'hb') => {
  const measureNumber = id;
  const mType = measureType.toUpperCase();
  const code = `${mType}${id}`;
  return {
    year, spSessionId, measureType, measureNumber, code,
    measurePdfUrl: `http://www.capitol.hawaii.gov/splsession${year}${spSessionId}/${code}.pdf`,
    measureArchiveUrl: 'http://www.capitol.hawaii.gov/measure_indivss.aspx?' +
      `billtype=${mType}&billnumber=${measureNumber}&year=${year}${spSessionId}`,
    reportTitle: `REPORT${id}`,
    measureTitle: `MEASURE${id}`,
    currentReferral: `REF${id}`
  };
};

/**
 * ids: array of intergers (e.g. [1, 2, 5])
 */
const generateSpBills = (ids, year = 2020, spSessionId = 'a', measureType = 'hb') => {
  return ids.map((i) => generateSpBill(i, year, spSessionId, measureType));
};

/**
 * replaces reporttitle and measuretitle of records specfied by ids with newval
 */
const modifySpBills = (data, ids, newval) => {
  return data.map((r) => {
    if (ids.includes(r.measureNumber)) {
      const val = `${newval}${r.measureNumber}`
      const reportTitle = val;
      const measureTitle = val;
      return { ...r, ...{ reportTitle, measureTitle } };
    } else {
      return r
    }
  });
};

export default {
  deleteAllHearings,
  selectHearings,
  countHearings,
  generateHearing,
  generateHearings,
  modifyHearings,
  deleteAllBills,
  selectBills,
  countBills,
  generateBill,
  generateBills,
  modifyBills,
  deleteAllSpBills,
  selectSpBills,
  countSpBills,
  generateSpBill,
  generateSpBills,
  modifySpBills,
};
