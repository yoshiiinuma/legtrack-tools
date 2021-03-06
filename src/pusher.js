
import PushJob from './local-push-job.js';
import ScrapeJob from './local-scrape-job.js';
import PushHelper from './push-helper.js';
import now from './now.js';
import ENUM from './enum.js';
import Logger from './logger.js';
import config from './config.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const STATUS = ENUM.JobStatus;

const snakeToCamel = (str) => {
  return str.split('_')
    .map((e) => e.charAt(0).toUpperCase() + e.slice(1).toLowerCase())
    .join('');
};

const create = (type, localModel, remoteModel, env = nodeEnv) => {
  const conf = config.load(env);
  const maxRecordsPerPush = conf.maxRecordsPerPush || 1000; 
  const dataType = ENUM.DataType[type.toUpperCase()];
  if (!dataType) {
    throw new Error('Unsupported Data Type: ' + type);
  }
  const title = snakeToCamel(type) + 'Pusher';

  /**
   * Pushes data updated after originTime to the DB
   */
  const push = async (originTime) => {
    if (!originTime) {
      Logger.error(`${title}#push: Speficy Time to Select Data`);
      throw new Error('Speficy Time to Select Data');
    }

    let data = await localModel.selectUpdatedAfter(originTime);
    const size = data.length;
    if (size === 0) {
      Logger.info(`${title}#push: No Unprocessed Data`);
      return { msg: 'No Unprocessed Data', skipped: true };
    }
    let remains;
    let rowsAffected = 0;
    let times = 0;

    while (data.length > 0) {
      times += 1;
      remains = data.splice(maxRecordsPerPush);
      const res = await remoteModel.push(data);
      rowsAffected += (res && res.rowsAffected)? res.rowsAffected[0] : 0;
      Logger.debug(`PUSHED ${times}: ${data.length} / ${res.rowsAffected} / ${size}`);
      data = remains;
    }

    const msg = `Push Completed ${rowsAffected} / ${size} Data`;
    Logger.info(`${title}#push: ${msg}`);
    return { msg, size, rowsAffected };
  };

  const run = async () => {
    const pushJob = PushJob.create(env);
    let job = null;
    let pushJobId = null;

    try {
      const unprocessedScrapeJob = await PushHelper.getUnprocessedScrapeJob(pushJob, dataType);
      if (!unprocessedScrapeJob) {
        Logger.info(`${title}#run: No Unprocessed Scrape Jobs`);
        await pushJob.insert(dataType, 0, STATUS.skipped);
        return { msg: 'No Unprocessed Scrape Jobs' };
      }

      job = await pushJob.insert(dataType, unprocessedScrapeJob.id);
      pushJobId = job.lastInsertRowid;

      const r = await Pusher.push(unprocessedScrapeJob.startedAt);
      if (r.skipped) {
        await pushJob.update(pushJobId, STATUS.skipped, 0, 0);
      } else {
        await pushJob.update(pushJobId, STATUS.completed, r.size, r.size);
      }
      return r;
    } catch (e) {
      const errmsg = e.toString();
      Logger.error(`${title}#run: ${errmsg}`);
      Logger.error(e.stack);
      if (job && pushJobId) {
        await pushJob.update(pushJobId, STATUS.failed, 0, 0);
      } else {
        await pushJob.insertError(dataType);
      }
      return { msg: errmsg, error: true };
    }
  };

  const Pusher = {
    push,
    run
  };

  return Pusher;
};


export default {
  create
};

