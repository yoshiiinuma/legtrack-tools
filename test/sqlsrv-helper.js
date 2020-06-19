
import SqlsrvClient from '../src/sql-server-client.js';
import config from '../src/config.js';

const conf = config.load('test');

const SQLSEL =
  `SELECT year, spSessionId, measureType, measureNumber, reportTitle,
          measureTitle, currentReferral
     FROM spMeasures
    ORDER BY year, spSessionId, measureType, measureNumber`;
const SQLDEL = 'DELETE FROM spMeasures';
const SQLCNT = 'SELECT COUNT(*) from spMeasures';

const deleteAllSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  return await client.query(SQLDEL);
}

const selectSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query(SQLSEL);
  if (!r || !r.recordset) return null;
  return r.recordset;
};

const countSpBills = async () => {
  const client = SqlsrvClient.create(conf);
  const r = await client.query(SQLCNT);
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
  deleteAllSpBills,
  selectSpBills,
  countSpBills,
  generateSpBill,
  generateSpBills,
  modifySpBills,
};
