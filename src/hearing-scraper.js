
import Fetcher from './fetcher.js';
import LocalFile from './local-file.js';
import HearingParser from './hearing-parser.js';
import Hearing from './local-hearing.js';
import ScrapeJob from './local-scrape-job.js';
import ENUM from './enum.js';
import now from './now.js';
import Logger from './logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const URL = 'https://www.capitol.hawaii.gov/upcominghearings.aspx';

const JobStatus = ENUM.JobStatus;
const DataType = ENUM.DataType;
const type = 'hearings';

export const scrape = async (year, dir = '') => {
  const html = await Fetcher.fetchHtml(URL);
  if (!LocalFile.isChanged(html, year, type, dir)) {
    Logger.info('HearingScraper#scrape: SKIPPED');
    return { msg: 'skipped', total: 0, updated: 0 };
  }

  LocalFile.save(html, year, type, dir);
  const data = HearingParser.parseAll(html);
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
  scrape,
  run
};

export default HearingScraper;

