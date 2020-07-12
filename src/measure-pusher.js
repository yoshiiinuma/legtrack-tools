
import RemoteMeasure from '../src/remote-measure.js';
import PushJob from '../src/local-push-job.js';
import ScrapeJob from '../src/local-scrape-job.js';
import LocalMeasure from '../src/local-measure.js';
import now from '../src/now.js';
import ENUM from '../src/enum.js';
import Logger from '../src/logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const dataType = ENUM.DataType.MEASURE;
const STATUS = ENUM.JobStatus;

const getUnprocessedScrapeJob = async (pushJob, dataType) => {
  const lastProcessedScrapeJobId = await pushJob.selectLastProcessedScrapeJobId(dataType);
  if (lastProcessedScrapeJobId === 0) {
    return null;
  }
  const scrapeJob = ScrapeJob.create(nodeEnv);
  return await scrapeJob.selectJobUpdatedAfter(dataType, lastProcessedScrapeJobId);
};

const pushOld = async (year) => {
  let msg = '';
  if (!year) {
    msg = 'Specify Year';
    Logger.error('MeasurePusher#push: ' + msg);
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
      const local = LocalMeasure.create(nodeEnv);
      const data = await local.selectMeasuresUpdatedAfter(unprocessedScrapeJob.startedAt);
      const size = data.length;
      if (size > 0) {
        const remote = RemoteMeasure.create(nodeEnv);
        await remote.push(data);
        await pushJob.update(pushJobId, STATUS.completed, size, size);
        msg = `Processed ${size} Data`;
        Logger.info('MeasurePusher#push: ' + msg);
      } else {
        await pushJob.update(pushJobId, STATUS.skipped, 0, 0);
        msg = 'No Unprocessed Data';
        Logger.info('MeasurePusher#push: ' + msg);
      }
    } else {
      await pushJob.insert(dataType, 0, STATUS.skipped);
      msg = 'No Unprocessed Jobs';
      Logger.info('MeasurePusher#push: ' + msg);
    }
  } catch (e) {
    await pushJob.insertError(dataType);
    msg = e.toString();
    Logger.error('MeasurePusher#push: ' + e.toString());
    Logger.error(e.stack);
  }

  return { msg };
};

/**
 * Pushes data updated after originTime to the DB
 */
const push = async (originTime) => {
  if (!originTime) {
    Logger.error('MeasurePusher#push: Speficy Time to Select Data');
    throw new Error('Speficy Time to Select Data');
  }

  const local = LocalMeasure.create(nodeEnv);
  const data = await local.selectMeasuresUpdatedAfter(originTime);
  const size = data.length;
  if (size === 0) {
    Logger.info('MeasurePusher#push: No Unprocessed Data');
    return { msg: 'No Unprocessed Data', skipped: true };
  }

  const remote = RemoteMeasure.create(nodeEnv);
  const res = await remote.push(data);
  const msg = `Push Completed ${size} Data`;
  const rowsAffected = (res && res.rowsAffected)? res.rowsAffected[0] : null;
  Logger.info('MeasurePusher#push: ' + msg);
  return { msg, size, rowsAffected };
};

const run = async (year) => {
  if (!year) {
    Logger.error('MeasurePusher#run: Specify Year');
    return Promise.reject('Specify Year');
  }
  const pushJob = PushJob.create(nodeEnv);
  let job = null;
  let pushJobId = null;

  try {
    const unprocessedScrapeJob = MeasurePusher.getUnprocessedScrapeJob(pushJob, dataType);
    if (!unprocessedScrapeJob) {
      Logger.info('MeasurePusher#run: No Unprocessed Scrape Jobs');
      await pushJob.insert(dataType, 0, STATUS.skipped);
      return { msg: 'No Unprocessed Scrape Jobs' };
    }

    job = await pushJob.insert(dataType, unprocessedScrapeJob.id);
    pushJobId = job.lastInsertRowid;

    const r = MeasurePusher.push(unprocessedScrapeJob.startedAt);
    if (r.skipped) {
      await pushJob.update(pushJobId, STATUS.skipped, 0, 0);
    } else {
      await pushJob.update(pushJobId, STATUS.completed, r.size, r.size);
    }
    return r;
  } catch (e) {
    const errmsg = e.toString();
    Logger.error('MeasurePusher#run: ' + errmsg);
    Logger.error(e.stack);
    if (job && pushJobId) {
      await pushJob.update(pushJobId, STATUS.failed, 0, 0);
    } else {
      await pushJob.insertError(dataType);
    }
    return { msg: errmsg, error: true };
  }
};

const MeasurePusher = {
  getUnprocessedScrapeJob,
  pushOld,
  push,
  run
};

export default MeasurePusher;

