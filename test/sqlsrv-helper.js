
import SqlsrvClient from '../src/sql-server-client.js';
import config from '../src/config.js';

const conf = config.load('test');

const SQLSEL_MS =
  `SELECT year, measureType, measureNumber, reportTitle,
          measureTitle, currentReferral, bitAppropriation,
          description, status, introducer, companion
     FROM measures
    ORDER BY year, measureType, measureNumber`;
const SQLDEL_MS = 'DELETE FROM measures';
const SQLCNT_MS = 'SELECT COUNT(*) from measures';

const SQLSEL_SP =
  `SELECT year, spSessionId, measureType, measureNumber, reportTitle,
          measureTitle, currentReferral
     FROM spMeasures
    ORDER BY year, spSessionId, measureType, measureNumber`;
const SQLDEL_SP = 'DELETE FROM spMeasures';
const SQLCNT_SP = 'SELECT COUNT(*) from spMeasures';

const deleteAllBills = async () => {
  const client = SqlsrvClient.create(conf);
  return await client.query(SQLDEL_MS);
}

const selectBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query(SQLSEL_MS);
  if (!r || !r.recordset) return null;
  return r.recordset;
};

const countBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query(SQLCNT_MS);
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
  return await client.query(SQLDEL_SP);
}

const selectSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query(SQLSEL_SP);
  if (!r || !r.recordset) return null;
  return r.recordset;
};

const countSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query(SQLCNT_SP);
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
