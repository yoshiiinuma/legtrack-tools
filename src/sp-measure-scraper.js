
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

const scrape = (year, session, dir = '') => {
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
      Logger.info(`FetchSpMeasures: COMPLETED Total ${total}, Updated ${updated}`);
    } else {
      scrapeJob.updateJob(jobId, JobStatus.skipped, 0, 0);
      msg = 'skipped';
      Logger.info('FetchSpMeasures: SKIPPED');
    }
  } catch (e) {
      scrapeJob.updateJob(jobId, JobStatus.failed, 0, 0);
      msg = 'failed';
      Logger.error('FetchSpMeasures: FAILED');
      Logger.error(e.toString());
      Logger.error(e.stack);
  }
  return { msg, total, updated };
}

const SpMeasureScraper = {
  getUrl,
  scrape
};

export default SpMeasureScraper;

