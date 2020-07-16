
import Fetcher from './fetcher.js';
import LocalFile from './local-file.js';
import SpMeasureParser from './sp-measure-parser.js';
import SpMeasure from './local-sp-measure.js';
import ScrapeJob from './local-scrape-job.js';
import ENUM from './enum.js';
import now from './now.js';
import Logger from './logger.js';

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
  const type = TYPE + session.toLowerCase();
  const html = Fetcher.fetchHtml(SpMeasureScraper.getUrl(year, session));

  if (!LocalFile.isChanged(html, year, type, dir)) {
    Logger.info('SpMeasureScraper#scrape: SKIPPED');
    return { msg: 'skipped', total: 0, updated: 0 };
  }

  LocalFile.save(html, year, type, dir);
  const data = SpMeasureParser.parseAll(html);
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
  const job = scrapeJob.insertJob(DataType.SP_MEASURE);
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
  run
};

export default SpMeasureScraper;

