
import $ from 'cheerio';

import ENUM from './enum.js';
import Logger from './logger.js';

export const trim = (text) => {
  if (!text) return '';
  return text.replace(/\n/g, ' ').trim().replace(/ +/g, ' ');
};

const RGX_BILL_URL = /\.aspx\?billtype=(\w+)&billnumber=(\d+)&year=(\d+)$/;
const MeasureType = ENUM.MeasureType;

/**
 * Expected URL Format
 *
 * https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=HB&billnumber=35&year=2020
 * https://www.capitol.hawaii.gov/Archives/measure_indiv_Archives.aspx?billtype=HB&billnumber=35&year=2020
 *
 **/
export const parseUrl = (url) => {
  if (!url) { 
    Logger.error('MeasureParser#ParseUrl: No URL given');
    return {};
  }
  const match = url.match(RGX_BILL_URL);
  if (!match) {
    Logger.error('MeasureParser#ParseUrl: Parse Error: ' + url);
    return {};
  }
 
  const measureTypeOrig = match[1];
  let measureType = match[1].toLowerCase();
  if (!measureType || measureType.length > 3) {
    Logger.error('MeasureParser#ParseUrl: Unknown Measure Type: ' + measureType)
    Logger.error(url);
    measureType = 'NON';
  }
  const measureNumber = parseInt(match[2]);
  const year = parseInt(match[3]);
  return { year, measureTypeOrig, measureType, measureNumber };
};

/**
 * Format:
 *
 * <tr>
 *  <td><a href="link-to-pdf"></td>
 *  <td><a href="link-to-archive">CODE</a></td>
 *  <td>
 *    <span>Report Title</span>
 *    <span>Bit Appropriation</span>
 *    <span>Measure Title</span>
 *    <span>Description</span>
 *  </td>
 *  <td>Status</td>
 *  <td>Introducer</td>
 *  <td>CurrentReferral</td>
 *  <td><a>Companion</a></td>
 * </tr>
 *
 */
export const parse = (elm) => {
  const tr = $(elm);
  const a1 = tr.find('td:nth-child(1) a');
  const td2 = tr.find('td:nth-child(2)');
  const a2 =  td2.find('a');
  const sp1 = td2.find('font > span:nth-of-type(1)');
  const sp2 = td2.find('font > span:nth-of-type(2)');
  const sp3 = td2.find('font > span:nth-of-type(3)');
  const sp4 = td2.find('font > span:nth-of-type(3)');
  const td3 = tr.find('td:nth-child(3)');
  const td4 = tr.find('td:nth-child(4)');
  const td5 = tr.find('td:nth-child(5)');
  const td6 = tr.find('td:nth-child(6)');
  const a3 = td6.find('a');

  const code = trim(a2.text());
  const measurePdfUrl = a1.attr('href');
  const measureArchiveUrl = a2.attr('href');
  const reportTitle = trim(sp1.text());
  const bitAppropriation = (sp2.text().includes('$')) ? 1 : 0;
  const measureTitle = trim(sp3.text());
  const description = trim(sp3.text());
  const status = trim(td3.text());
  const introducer = trim(td4.text());
  const currentReferral = trim(td5.text());
  const companion = trim(td6.text());
  const companionUrl = (a3 && a3.attr('href')) ? a3.attr('href') : '';

  const r = MeasureParser.parseUrl(measureArchiveUrl);

  return  {
    ...r,
    code, measurePdfUrl, measureArchiveUrl, reportTitle,
    measureTitle, description, bitAppropriation, status, introducer,
    currentReferral, companion, companionUrl, currentReferral
  };
};

export const parseAll = (html) => {
  const selector = 'table#GridViewReports';
  const rows = $('tr', selector, html);

  return rows.map((i, elm) => {
    const tr = $(elm);
    if (tr.find('th').length > 0) return null;
    return MeasureParser.parse(tr);
  }).get();
}; 

const MeasureParser = {
  parseUrl,
  parse,
  parseAll,
};

export default MeasureParser;

