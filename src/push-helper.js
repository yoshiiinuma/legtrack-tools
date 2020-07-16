
import PushJob from './local-push-job.js';
import ScrapeJob from './local-scrape-job.js';

const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

const getUnprocessedScrapeJob = async (pushJob, dataType) => {
  const lastProcessedScrapeJobId = await pushJob.selectLastProcessedScrapeJobId(dataType);
  if (lastProcessedScrapeJobId === 0) {
    return null;
  }
  const scrapeJob = ScrapeJob.create(nodeEnv);
  const r = await scrapeJob.selectJobUpdatedAfter(dataType, lastProcessedScrapeJobId);
  return (r) ? r : null;
};

const PushHelper = {
  getUnprocessedScrapeJob
};

export default PushHelper;

