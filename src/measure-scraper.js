

import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import { parseBills } from '../src/parse-measures.js';
import Measure from '../src/local-measure.js';
import ScrapeJob from '../src/local-scrape-job.js';
import ENUM from '../src/enum.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

/**
 *
 * Scrape and Store measures from:
 *
 *   Capitol Deadline Tracking Page < Reports and Lists Page
 *
 *   e.g.
 *     http://capitol.hawaii.gov/advreports/advreport.aspx?year=2017&report=deadline&active=true&rpt_type=&measuretype=hb
 *
 *   URL:
 *
 *     http://capitol.hawaii.gov/advreports/advreport.aspx
 *
 *   mandatory parameters:
 *
 *      year:        2017
 *      report:      deadline
 *      active:      true (necessary only if measuretype is hb or sb)
 *      rpt_type:
 *      measuretype: [hb|sb|hr|sr|hcr|scr|gm]
 *
 *   Measure Type:
 *      hb:  House Bills
 *      sb:  Senate Bills
 *      hr:  House Resos
 *      sr:  Senate Resos
 *      hcr: House Concurrent Resos
 *      scr: Senate Concurrent Resos
 *      gm:  Governer's Messages
 *
 *
 **/

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const getUrl = (year, type) => {
  let url = 'http://capitol.hawaii.gov/advreports/advreport.aspx?year=' + year + '&report=deadline';
  if (type == 'hb' || type == 'sb') url += '&active=true';
  url += '&rpt_type=&measuretype=' + type;
  return url;
};

const JOBSTATUS = ENUM.JobStatus;
const DATATYPE = ENUM.DataType;

export const scrapeByType = async (year, type, dir = '') => {
  const typeUpcase = type.toUpperCase();
  let total = 0;
  let updated = 0;
  let msg = '';

  try {
    const html = await Fetcher.fetchHtml(MeasureScraper.getUrl(year, type));
    if (LocalFile.isChanged(html, year, type, dir)) {
      LocalFile.save(html, year, type, dir);
      const data = parseBills(html);
      const localDb = Measure.create(nodeEnv);
      const r = localDb.bulkUpsert(data);
      updated = r.inserted + r.updated;
      total = r.ignore + updated; 
      msg = 'completed';
      Logger.info(`MeasureScraper#scrapeByType: ${typeUpcase} COMPLETED Total ${total}, Updated ${updated}`);
    } else {
      msg = 'skipped';
      Logger.info(`MeasureScraper#scrapeByType: ${typeUpcase} SKIPPED`);
    }
  } catch (e) {
      msg = 'failed';
      Logger.error(`MeasureScraper#scrapeByType: ${typeUpcase} FAILED`);
      Logger.error(e.toString());
      Logger.error(e.stack);
  }
  return { msg, total, updated };
}

export const scrape = async (year, dir = '') => {
  const scrapeJob = ScrapeJob.create(nodeEnv);
  let r = scrapeJob.insertJob(DATATYPE.MEASURE);
  const jobId = r.lastInsertRowid;
  const startedAt = r.startedAt;
  const updatedTypes = [];
  const skippedTypes = [];
  const errorTypes = [];
  const msgs = [];
  let total = 0;
  let updated = 0;
  let jobStatus = JOBSTATUS.completed;

  const TYPES = ['hb', 'sb', 'hr', 'sr', 'hcr', 'scr', 'gm'];

  for (const type of TYPES) {
    const typeId = ENUM.MeasureType[type];
    r = await MeasureScraper.scrapeByType(year, type, dir);
    if (r.msg === 'completed') {
      updatedTypes.push(type.toUpperCase());
      total += r.total;
      updated += r.updated;
      scrapeJob.insertDetail(jobId, typeId, JOBSTATUS.completed, now(), r.total, r.updated);
    } else if (r.msg === 'skipped') {
      skippedTypes.push(type.toUpperCase());
      scrapeJob.insertDetail(jobId, typeId, JOBSTATUS.skipped, now(), 0, 0);
    } else {
      errorTypes.push(type.toUpperCase());
      scrapeJob.insertDetail(jobId, typeId, JOBSTATUS.failed, now(), 0, 0);
    } 
  }

  if (skippedTypes.length === TYPES.length) {
    jobStatus = JOBSTATUS.skipped;
    msgs.push('No Measure Updated');
  } else {
    if (updatedTypes.length > 0) {
      msgs.push('UPDATED [' + updatedTypes.join() + ']');
    }
    if (errorTypes.length > 0) {
      jobStatus = JOBSTATUS.failed;
      msgs.push('ERROR [' + errorTypes.join() + ']');
    }
  }

  scrapeJob.updateJob(jobId, jobStatus, total, updated);
  const msg = msgs.join('; ');
  Logger.info('MeasureScraper#scrape: ' + msg);
  return { msg, total, updated };
}

const MeasureScraper = {
  scrape,
  scrapeByType,
  getUrl
};

export default MeasureScraper;
