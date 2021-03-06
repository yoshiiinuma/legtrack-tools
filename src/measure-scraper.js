
import Fetcher from './fetcher.js';
import LocalFile from './local-file.js';
import MeasureParser from './measure-parser.js';
import Measure from './local-measure.js';
import ScrapeJob from './local-scrape-job.js';
import ENUM from './enum.js';
import now from './now.js';
import Logger from './logger.js';

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
const TYPES = ENUM.RegularMeasureTypes;

export const scrape = async (year, type, dir = '') => {
  const typeUpcase = type.toUpperCase();

  try {
    const html = await Fetcher.fetchHtml(MeasureScraper.getUrl(year, type));
    if (!LocalFile.isChanged(html, year, type, dir)) {
      Logger.info(`MeasureScraper#scrape: ${typeUpcase} SKIPPED`);
      return { msg: 'skipped', total: 0, updated: 0 };
    }

    LocalFile.save(html, year, type, dir);
    const data = MeasureParser.parseAll(html);
    const localDb = Measure.create(nodeEnv);
    const r = localDb.bulkUpsert(data);
    const updated = r.inserted + r.updated;
    const total = r.ignore + updated;
    Logger.info(`MeasureScraper#scrape: ${typeUpcase} COMPLETED Total ${total}, Updated ${updated}`);
    return { msg: 'completed', total, updated };
  } catch (e) {
    Logger.error(`MeasureScraper#scrape: ${typeUpcase} FAILED`);
    Logger.error(e.toString());
    Logger.error(e.stack);
    return { msg: 'failed', total: 0, updated: 0 };
  }
}

export const run = async (year, dir = '') => {
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

  for (const type of TYPES) {
    const typeId = ENUM.MeasureType[type];
    r = await MeasureScraper.scrape(year, type, dir);
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
  Logger.info('MeasureScraper#run: ' + msg);
  return { msg, total, updated };
}

const MeasureScraper = {
  run,
  scrape,
  getUrl
};

export default MeasureScraper;
