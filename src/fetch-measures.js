

import Fetcher from '../src/fetcher.js';
import LocalFile from '../src/local-file.js';
import { parseBills } from '../src/parse-measures.js';
import Measure from '../src/local-measure.js';
import ScrapeJob from '../src/local-scrape-job.js';
import ENUM from '../src/enum.js';
import now from '../src/now.js';
import Logger from '../src/logger.js';

/**
 *
 * Require PHP >= 7.0
 *
 * Scrape and Store measures from:
 *
 *   Capitol Deadline Tracking Page < Reports and Lists Page
 *
 *   e.g.
 *     http://capitol.hawaii.gov/advreports/advreport.aspx?year=2017&report=deadline&active=true&rpt_type=&measuretype=hb
 *
 *   URL:
 *
 *     http://capitol.hawaii.gov/advreports/advreport.aspx
 *
 *   mandatory parameters:
 *
 *      year:        2017
 *      report:      deadline
 *      active:      true (necessary only if measuretype is hb or sb)
 *      rpt_type:
 *      measuretype: [hb|sb|hr|sr|hcr|scr|gm]
 *
 *   Measure Type:
 *      hb:  House Bills
 *      sb:  Senate Bills
 *      hr:  House Resos
 *      sr:  Senate Resos
 *      hcr: House Concurrent Resos
 *      scr: Senate Concurrent Resos
 *      gm:  Governer's Messages
 *
 * UASGE:
 *
 *   php scrape-measures.php [env] [year] [debug]
 *
 *      env: production | development | test (default development)
 *           need configuration under config for the selected env
 *
 **/
const DEFAULT_ENV = 'development';
const nodeEnv = process.env.NODE_ENV || DEFAULT_ENV;

export const getUrl = (year, type) => {
  let url = 'http://capitol.hawaii.gov/advreports/advreport.aspx?year=' + year + '&report=deadline';
  if (type == 'hb' || type == 'sb') url += '&active=true';
  url += '&rpt_type=&measuretype=' + type;
  return url;
};

const JobStatus = ENUM.JobStatus;
const DataType = ENUM.DataType;

export const fetchMeasures = async (year, type, dir = '') => {
  const scrapeJob = ScrapeJob.create(nodeEnv);
  let r = scrapeJob.insertJob(DataType.MEASURE);
  const jobId = r.lastInsertRowid;
  const startedAt = r.startedAt;
  const typeId = ENUM.MeasureType[type];
  let total = 0;
  let updated = 0;
  let msg = '';

  try {
    const html = await Fetcher.fetchHtml(getUrl(year, type));
    if (LocalFile.isChanged(html, year, type, dir)) {
      LocalFile.save(html, year, type, dir);
      const data = parseBills(html);
      const localDb = Measure.create(nodeEnv);
      r = localDb.bulkUpsert(data);
      updated = r.inserted + r.updated;
      total = r.ignore + updated; 
      scrapeJob.updateJob(jobId, JobStatus.completed, total, updated);
      scrapeJob.insertDetail(jobId, typeId, JobStatus.completed, startedAt, total, updated);
      msg = 'completed';
      Logger.info(`FetchMeasures: COMPLETED Total ${total}, Updated ${updated}`);
    } else {
      scrapeJob.updateJob(jobId, JobStatus.skipped, 0, 0);
      msg = 'skipped';
      Logger.info('FetchMeasures: SKIPPED');
    }
  } catch (e) {
      scrapeJob.updateJob(jobId, JobStatus.failed, 0, 0);
      msg = 'failed';
      Logger.error('FetchMeasures: FAILED');
      Logger.error(e.toString());
      Logger.error(e.stack);
  }
  return { msg, total, updated };
}

