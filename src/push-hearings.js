
import RemoteHearing from '../src/remote-hearing.js';
import PushJob from '../src/local-push-job.js';
import ScrapeJob from '../src/local-scrape-job.js';
import LocalHearing from '../src/local-hearing.js';
import now from '../src/now.js';
import ENUM from '../src/enum.js';
import Logger from '../src/logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const dataType = ENUM.DataType.HEARING;
const STATUS = ENUM.JobStatus;

export const getUnprocessedScrapeJobStart = () => {
  const pushJob = PushJob.create(nodeEnv); 
  const scrapeJob = ScrapeJob.create(nodeEnv);
  const lastProcessedScrapeJobId = pushJob.selectLastProcessedScrapeJobId(dataType);
  const unprocessedScrapeJob = scrapeJob.selectJobUpdatedAfter(dataType, lastProcessedScrapeJobId);
};

export const pushHearings = async (year) => {
  let msg = '';
  if (!year) {
    msg = 'Specify Year';
    Logger.error('PushHearings: ' + msg);
    return Promise.reject(msg);
  }
  let startedAt;
  let pushJobId;
  const pushJob = PushJob.create(nodeEnv); 
  const scrapeJob = ScrapeJob.create(nodeEnv);

  try {
    const lastProcessedScrapeJobId = await pushJob.selectLastProcessedScrapeJobId(dataType);
    const unprocessedScrapeJob = await scrapeJob.selectJobUpdatedAfter(dataType, lastProcessedScrapeJobId);

    if (unprocessedScrapeJob) {
      const r = await pushJob.insert(dataType, unprocessedScrapeJob.id);
      startedAt = r.startedAt;
      pushJobId = r.lastInsertRowid;
      const local = LocalHearing.create(nodeEnv);
      const data = await local.selectUpdatedAfter(unprocessedScrapeJob.startedAt);
      const size = data.length;
      if (size > 0) {
        const remote = RemoteHearing.create(nodeEnv);
        await remote.push(data);
        await pushJob.update(pushJobId, STATUS.completed, size, size);
        msg = `Processed ${size} Data`;
        Logger.info('PushHearings: ' + msg);
      } else {
        await pushJob.update(pushJobId, STATUS.skipped, 0, 0);
        msg = 'No Unprocessed Data';
        Logger.info('PushHearings: ' + msg);
      }
    } else {
      await pushJob.insert(dataType, 0, STATUS.skipped);
      msg = 'No Unprocessed Jobs';
      Logger.info('PushHearings: ' + msg);
    }
  } catch (e) {
    await pushJob.insertError(dataType);
    msg = e.toString();
    Logger.error('PushHearings: ' + e.toString());
    Logger.error(e.stack);
  }
 
  return { msg }; 
};

export default { pushHearings };
