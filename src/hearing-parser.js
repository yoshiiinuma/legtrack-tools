
import $ from 'cheerio';

import ENUM from './enum.js';
import Logger from './logger.js';

const trim = (text) => {
  if (!text) return '';
  return text.replace(/\n/g, ' ').trim().replace(/ +/g, ' ');
};

const RGX_BILL_URL = /measure_indiv.aspx\?billtype=(\w+)&billnumber=(\d+)$/;
const MeasureType = ENUM.MeasureType;

/**
 * Expected URL Format
 *
 * https://www.capitol.hawaii.gov/measure_indiv.aspx?billtype=SB&amp;billnumber=2629
 *
 **/
const parseUrl = (url) => {
  if (!url) return {};
  const match = url.match(RGX_BILL_URL);
  if (!match) return {};

  const measureTypeOrig = match[1];
  //let measureType = MeasureType[measureTypeOrig.toLowerCase()];
  let measureType = measureTypeOrig.toLowerCase();
  if (!measureType || measureType.length > 4) {
    Logger.error('HearingParser#ParsUrl: Unknown Measure Type: ' + measureType)
    Logger.error(url);
    //measureType = MeasureType.unknown;
    measureType = 'None';
  }
  const measureNumber = parseInt(match[2]);
  return { measureTypeOrig, measureType, measureNumber };
};

/**
 * Format:
 *
 * <tr>
 *  <td>COMMITTEE</td>
 *  <td>
 *    <a href="link-to-measure">CODE</a>
 *    <span>DESCRIPTION</span>
 *  </td>
 *  <td><span>DATETIME</span></td>
 *  <td><span>ROOM</span></td>
 *  <td>
 *    <a href="link-to-notice">NOTICE</a>
 *    <a href="link-to-notice-pdf"/>
 *  </td>
 * </tr>
 *
 */
const parse = (elm) => {
  const tr = $(elm);
  const td1 = tr.find('td:nth-child(1)');
  if (trim(td1.text()) === 'No Hearings') return null;
  const sp1 = td1.find('font > span:nth-of-type(1)');
  const td2 = tr.find('td:nth-child(2)');
  const a1 = td2.find('font > a');
  const sp2 = td2.find('font > span:nth-of-type(1)');
  const td3 = tr.find('td:nth-child(3)');
  const sp3 = td3.find('font > span:nth-of-type(1)');
  const td4 = tr.find('td:nth-child(4)');
  const sp4 = td4.find('font > span:nth-of-type(1)');
  const td5 = tr.find('td:nth-child(5)');
  const a2 = td5.find('font > a:nth-of-type(1)');
  const a3 = td5.find('font > a:nth-of-type(2)');

  const committee = trim(sp1.text());
  const measureRelativeUrl = trim(a1.attr('href'));
  const code = trim(a1.text());
  const description = trim(sp2.text());
  const datetime = trim(sp3.text());
  const date = new Date(datetime);
  const timestamp = date.getTime();
  const year = date.getFullYear();
  const room = trim(sp4.text());
  const notice = trim(a2.text());
  const noticeUrl = trim(a2.attr('href'));
  const noticePdfUrl = trim(a3.attr('href'));

  const r = HearingParser.parseUrl(measureRelativeUrl);

  return  {
    ...r, year, committee, measureRelativeUrl, code, description,
    datetime, timestamp, room, notice, noticeUrl, noticePdfUrl,
  };
};

const parseAll = (html) => {
  const selector = 'table#ctl00_ContentPlaceHolderCol1_GridView1';
  const rows = $('tr', selector, html);

  return rows.map((i, elm) => {
    const tr = $(elm);
    if (tr.find('th').length > 0) return null;
    return HearingParser.parse(tr);
  }).get();
};

const HearingParser = {
  parseUrl,
  parse,
  parseAll,
};

export default HearingParser;

