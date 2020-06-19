
import $ from 'cheerio';

import ENUM from '../src/enum.js';
import Logger from '../src/logger.js';

export const trim = (text) => {
  return text.replace(/\n/g, ' ').trim().replace(/ +/g, ' ');
};

const RGX_SPBILL_URL = /aspx\?billtype=(\w+)&billnumber=(\d+)&year=(\d+)(\w)$/;
const MeasureType = ENUM.MeasureType;

/**
 * Expected Format
 *
 * http://www.capitol.hawaii.gov/bbbb.aspx?billtype=SR&billnumber=3&year=2017a
 */
export const parseSpBillUrl = (url) => {
  if (!url) return {};
  const match = url.match(RGX_SPBILL_URL);
  if (!match) return {};
 
  const measureTypeOrig = match[1].toLowerCase();
  let measureType = MeasureType[measureTypeOrig];
  if (!measureType) {
    Logger.error('ParseSpMeasures#ParseSpBillUrl: Unknown Measure Type: ' + measureType)
    Logger.error(url);
    measureType = MeasureType.unknown;
  }
  const measureNumber = parseInt(match[2]);
  const year = parseInt(match[3]);
  const spSessionId = match[4];
  return { year, spSessionId, measureTypeOrig, measureType, measureNumber };
};

/**
 * Format:
 *
 * <tr>
 *  <td><a href="link-to-pdf"></td>
 *  <td><a href="link-to-archive">CODE</a></td>
 *  <td>
 *    <span>Report Title</span>
 *    <span>Measure Title</span>
 *  </td>
 *  <td>CurrentReferral</td>
 * </tr>
 *
 * Measure Table Columns:
 *
 *  year
 *  spSessionId
 *  measureType
 *  measureNumber
 *  lastUpdated
 *  code
 *  measurePdfUrl
 *  measureArchiveUrl
 *  measureTitle
 *  reportTitle
 *  bitAppropriation
 *  description
 *  status
 *  introducer
 *  currentReferral
 *  companion
 */
export const parseSpBill = (elm) => {
  const tr = $(elm);
  const a1 = tr.find('td:nth-child(1) a');
  const a2 = tr.find('td:nth-child(2) a');
  const sp1 = tr.find('td:nth-child(3) span:nth-of-type(1)');
  const sp2 = tr.find('td:nth-child(3) span:nth-of-type(2)');
  const sp3 = tr.find('td:nth-child(4) span');
  const billUrl = a2.attr('href');
  return  {
    ...parseSpBillUrl(billUrl),
    code: trim(a2.text()),
    measurePdfUrl: a1.attr('href'),
    measureArchiveUrl: 'http://www.capitol.hawaii.gov' + billUrl,
    reportTitle: trim(sp1.text()),
    measureTitle: trim(sp2.text()),
    currentReferral: trim(sp3.text())
  };
};

export const parseSpBills = (html) => {
  const selector = 'table#ctl00_ContentPlaceHolderCol1_GridViewReports';
  const rows = $('tr', selector, html);

  return rows.map((i, elm) => {
    const tr = $(elm);
    if (tr.find('th').length > 0) return null;
    return parseSpBill(tr);
  }).get();
}; 

