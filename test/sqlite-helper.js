
/**
 * id: used for measurenumber
 */
export const generateBill = (id, year = 2020, measureType = 'hb') => {
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
    currentReferral: `REF${id}`
  };
};

/**
 * ids: array of intergers (e.g. [1, 2, 5])
 */
export const generateBills = (ids, year = 2020, measureType = 'hb') => {
  return ids.map((i) => generateBill(i, year, measureType));
};

/**
 * replaces reporttitle and measuretitle of records specfied by ids with newval
 */
export const modifyBills = (data, ids, newval) => {
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

/**
 * id: used for measurenumber
 */
export const generateSpBill = (id, year = 2020, spSessionId = 'a', measureType = 'hb') => {
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
export const generateSpBills = (ids, year = 2020, spSessionId = 'a', measureType = 'hb') => {
  return ids.map((i) => generateSpBill(i, year, spSessionId, measureType));
};

/**
 * replaces reporttitle and measuretitle of records specfied by ids with newval
 */
export const modifySpBills = (data, ids, newval) => {
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
  generateBill,
  generateBills,
  modifyBills,
  generateSpBill,
  generateSpBills,
  modifySpBills,
};
