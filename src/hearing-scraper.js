
import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import { parseHearings } from '../src/parse-hearings.js';
import Hearing from '../src/local-hearing.js';
import ScrapeJob from '../src/local-scrape-job.js';
import ENUM from '../src/enum.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const URL = 'https://www.capitol.hawaii.gov/upcominghearings.aspx';

const JobStatus = ENUM.JobStatus;
const DataType = ENUM.DataType;
const type = 'hearings';

export const scrapeOld = (year, dir = '') => {
  const scrapeJob = ScrapeJob.create(nodeEnv);
  let r = scrapeJob.insertJob(DataType.HEARING);
  const jobId = r.lastInsertRowid;
  const startedAt = r.startedAt;
  let total = 0;
  let updated = 0;
  let msg = '';

  try {
    const html = Fetcher.fetchHtml(URL);
    if (LocalFile.isChanged(html, year, type, dir)) {
      LocalFile.save(html, year, type, dir);
      const data = parseHearings(html);
      const localDB = Hearing.create(nodeEnv);
      r = localDB.bulkUpsert(data);
      updated = r.inserted + r.updated;
      total = r.ignore + updated;
      scrapeJob.updateJob(jobId, JobStatus.completed, total, updated);
      msg = 'completed';
      Logger.info(`HearingScraper: COMPLETED Total ${total}, Updated ${updated}`);
    } else {
      scrapeJob.updateJob(jobId, JobStatus.skipped, 0, 0);
      msg = 'skipped';
      Logger.info('HearingScraper: SKIPPED');
    }
  } catch (e) {
      scrapeJob.updateJob(jobId, JobStatus.failed, 0, 0);
      msg = 'failed';
      Logger.error('HearingScraper: FAILED');
      Logger.error(e.toString());
      Logger.error(e.stack);
  }
  return { msg, total, updated };
}

export const scrape = (year, dir = '') => {
  const html = Fetcher.fetchHtml(URL);
  if (!LocalFile.isChanged(html, year, type, dir)) {
    Logger.info('HearingScraper#scrape: SKIPPED');
    return { msg: 'skipped', total: 0, updated: 0 };
  }

  LocalFile.save(html, year, type, dir);
  const data = parseHearings(html);
  const localDB = Hearing.create(nodeEnv);
  const r = localDB.bulkUpsert(data);
  const updated = r.inserted + r.updated;
  const total = r.ignore + updated;

  Logger.info(`HearingScraper#scrape: COMPLETED Total ${total}, Updated ${updated}`);
  return { msg: 'completed', total, updated };
}

export const run = (year, dir = '') => {
  const scrapeJob = ScrapeJob.create(nodeEnv);
  const job = scrapeJob.insertJob(DataType.HEARING);
  const jobId = job.lastInsertRowid;

  try {
    const r = HearingScraper.scrape(year, dir);
    if (r.msg === 'completed') {
      scrapeJob.updateJob(jobId, JobStatus.completed, r.total, r.updated);
    } else {
      scrapeJob.updateJob(jobId, JobStatus.skipped, 0, 0);
    }
    return r;
  } catch (e) {
      scrapeJob.updateJob(jobId, JobStatus.failed, 0, 0);
      Logger.error('HearingScraper: FAILED');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return { msg: 'failed', total: 0, updated: 0 };
  }
}

const HearingScraper = {
  scrapeOld,
  scrape,
  run
};

export default HearingScraper;

