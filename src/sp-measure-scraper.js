
import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import { parseSpBills } from '../src/parse-sp-measures.js';
import SpMeasure from '../src/local-sp-measure.js';
import ScrapeJob from '../src/local-scrape-job.js';
import ENUM from '../src/enum.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const getUrl = (year, session) => {
  const prefix = "https://www.capitol.hawaii.gov/splsession.aspx?year=";
  return prefix + year + session;
};

const TYPE = 'sp';

const JobStatus = ENUM.JobStatus;
const DataType = ENUM.DataType;

const scrapeOld = (year, session, dir = '') => {
  const scrapeJob = ScrapeJob.create(nodeEnv);
  const type = TYPE + session.toLowerCase();
  let r = scrapeJob.insertJob(DataType.SPECIAL_SESSION);
  const jobId = r.lastInsertRowid;
  const typeId = ENUM.MeasureType[type];
  const startedAt = r.startedAt;
  let total = 0;
  let updated = 0;
  let msg = '';

  try {
    const html = Fetcher.fetchHtml(SpMeasureScraper.getUrl(year, session));
    if (LocalFile.isChanged(html, year, type, dir)) {
      LocalFile.save(html, year, type, dir);
      const data = parseSpBills(html);
      const localDB = SpMeasure.create(nodeEnv);
      r = localDB.bulkUpsert(data);
      updated = r.inserted + r.updated;
      total = r.ignore + updated; 
      scrapeJob.updateJob(jobId, JobStatus.completed, total, updated);
      scrapeJob.insertDetail(jobId, typeId, JobStatus.completed, startedAt, total, updated);
      msg = 'completed';
      Logger.info(`SpMeasureScraper: COMPLETED Total ${total}, Updated ${updated}`);
    } else {
      scrapeJob.updateJob(jobId, JobStatus.skipped, 0, 0);
      msg = 'skipped';
      Logger.info('SpMeasureScraper: SKIPPED');
    }
  } catch (e) {
      scrapeJob.updateJob(jobId, JobStatus.failed, 0, 0);
      msg = 'failed';
      Logger.error('SpMeasureScraper: FAILED');
      Logger.error(e.toString());
      Logger.error(e.stack);
  }
  return { msg, total, updated };
}

const scrape = (year, session, dir = '') => {
  const type = TYPE + session.toLowerCase();
  const html = Fetcher.fetchHtml(SpMeasureScraper.getUrl(year, session));

  if (!LocalFile.isChanged(html, year, type, dir)) {
    Logger.info('SpMeasureScraper#scrape: SKIPPED');
    return { msg: 'skipped', total: 0, updated: 0 };
  }

  LocalFile.save(html, year, type, dir);
  const data = parseSpBills(html);
  const localDB = SpMeasure.create(nodeEnv);
  const r = localDB.bulkUpsert(data);
  const updated = r.inserted + r.updated;
  const total = r.ignore + updated; 
  Logger.info(`SpMeasureScraper#scrape: COMPLETED Total ${total}, Updated ${updated}`);
  return { msg: 'completed', total, updated };
}

const run = (year, session, dir = '') => {
  const scrapeJob = ScrapeJob.create(nodeEnv);
  const type = TYPE + session.toLowerCase();
  const typeId = ENUM.MeasureType[type];
  const job = scrapeJob.insertJob(DataType.SPECIAL_SESSION);
  const jobId = job.lastInsertRowid;
  const startedAt = job.startedAt;

  try {
    const r = SpMeasureScraper.scrape(year, session, dir);

    if (r.msg === 'completed') {
      scrapeJob.updateJob(jobId, JobStatus.completed, r.total, r.updated);
    } else {
      scrapeJob.updateJob(jobId, JobStatus.skipped, 0, 0);
    } 
    return r;
  } catch (e) {
    scrapeJob.updateJob(jobId, JobStatus.failed, 0, 0);
    return { msg: 'failed', total: 0, updated: 0 };
  }
}

const SpMeasureScraper = {
  getUrl,
  scrape,
  scrapeOld,
  run
};

export default SpMeasureScraper;

