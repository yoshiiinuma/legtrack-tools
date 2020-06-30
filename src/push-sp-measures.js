
import RemoteSpMeasure from '../src/remote-sp-measure.js';
import PushJob from '../src/local-push-job.js';
import ScrapeJob from '../src/local-scrape-job.js';
import SpMeasure from '../src/local-sp-measure.js';
import now from '../src/now.js';
import ENUM from '../src/enum.js';
import Logger from '../src/logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const dataType = ENUM.DataType.SPECIAL_SESSION;
const STATUS = ENUM.JobStatus;

export const getUnprocessedScrapeJobStart = () => {
  const pushJob = PushJob.create(nodeEnv); 
  const scrapeJob = ScrapeJob.create(nodeEnv);
  const lastProcessedScrapeJobId = pushJob.selectLastProcessedScrapeJobId(dataType);
  const unprocessedScrapeJob = scrapeJob.selectJobUpdatedAfter(dataType, lastProcessedScrapeJobId);
};

export const pushSpMeasures = async (year, session) => {
  let msg = '';
  if (!year || !session) {
    msg = 'Specify Year and Session';
    Logger.error('PushSpMeasures: ' + msg);
    return Promise.reject(msg);
  }
  if (session != 'a' && session != 'b') {
    msg = 'Invalid Session: ' + session;
    Logger.error('PushSpMeasures: ' + msg);
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
      const spBill = SpMeasure.create(nodeEnv);
      const data = await spBill.selectSpMeasuresUpdatedAfter(year, session, unprocessedScrapeJob.startedAt);
      const size = data.length;
      if (size > 0) {
        const remoteSpMeasure = RemoteSpMeasure.create(nodeEnv);
        await remoteSpMeasure.push(data);
        await pushJob.update(pushJobId, STATUS.completed, size, size);
        msg = `Processed ${size} Data`;
        Logger.info('PushSpMeasures: ' + msg);
      } else {
        await pushJob.update(pushJobId, STATUS.skipped, 0, 0);
        msg = 'No Unprocessed Data';
        Logger.info('PushSpMeasures: ' + msg);
      }
    } else {
      await pushJob.insert(dataType, 0, STATUS.skipped);
      msg = 'No Unprocessed Jobs';
      Logger.info('PushSpMeasures: ' + msg);
    }
  } catch (e) {
    await pushJob.insertError(dataType);
    msg = e.toString();
    Logger.error('PushSpMeasures: ' + e.toString());
    Logger.error(e.stack);
  }
 
  return { msg }; 
};

export default { pushSpMeasures };
