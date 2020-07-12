
import RemoteMeasure from '../src/remote-measure.js';
import PushJob from '../src/local-push-job.js';
import ScrapeJob from '../src/local-scrape-job.js';
import LocalMeasure from '../src/local-measure.js';
import PushHelper from '../src/push-helper.js';
import now from '../src/now.js';
import ENUM from '../src/enum.js';
import Logger from '../src/logger.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const dataType = ENUM.DataType.MEASURE;
const STATUS = ENUM.JobStatus;

/**
 * Pushes data updated after originTime to the DB
 */
const push = async (originTime) => {
  if (!originTime) {
    Logger.error('MeasurePusher#push: Speficy Time to Select Data');
    throw new Error('Speficy Time to Select Data');
  }

  const local = LocalMeasure.create(nodeEnv);
  const data = await local.selectUpdatedAfter(originTime);
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
    const unprocessedScrapeJob = PushHelper.getUnprocessedScrapeJob(pushJob, dataType);
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
  push,
  run
};

export default MeasurePusher;

