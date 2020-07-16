
import mssql from 'mssql';
import SqlsrvClient from './sql-server-client.js';
import now from './now.js';
import config from './config.js';
import Logger from './logger.js';

const create = (env) => {
  const conf = config.load(env);
  const client = SqlsrvClient.create(conf);

  const formatData = (r, timestamp) => {
    const ts = timestamp || now();
    return [r.year, r.measureType, r.measureNumber, r.measureRelativeUrl,
      r.code, r.committee, ts, r.timestamp, r.datetime, r.description,
      r.room, r.notice, r.noticeUrl, r.noticePdfUrl];
  };

  const createTvp = (data) => {
    const tvp = client.createTvp('hearingTblType');
    tvp.columns.add('year', mssql.SmallInt);
    tvp.columns.add('measureType', mssql.NChar(3));
    tvp.columns.add('measureNumber', mssql.SmallInt);
    tvp.columns.add('measureRelativeUrl', mssql.NVarChar(512));
    tvp.columns.add('code', mssql.NVarChar(64));
    tvp.columns.add('committee', mssql.NVarChar(256));
    tvp.columns.add('lastUpdated', mssql.Int);
    tvp.columns.add('timestamp', mssql.Int);
    tvp.columns.add('datetime', mssql.NVarChar(32));
    tvp.columns.add('description', mssql.NVarChar(1024));
    tvp.columns.add('room', mssql.NVarChar(32));
    tvp.columns.add('notice', mssql.NVarChar(128));
    tvp.columns.add('noticeUrl', mssql.NVarChar(512));
    tvp.columns.add('noticePdfUrl', mssql.NVarChar(512));

    for (const r of data) {
      tvp.rows.add(...formatData(r));
    }
    return tvp;
  };

  const push = async (data) => {
    if (!data) {
      Logger.error('RemoteHearing#push: No Data Given')
      throw new Error('RemoteHearing#push: No Data Given')
    }
    try {
      const tvp = createTvp(data);
      await client.connect();
      const req = client.createRequest();
      req.input('TVP', mssql.TVP, tvp);
      const res = await req.execute('hearingUpsertProc');
      await client.close();
      return res;
    } catch (e) {
      Logger.error('RemoteHearing#Push: Unexpected Exception');
      Logger.error(e.toString());
      Logger.error(e.stack);
      return null;
    }
  };

  return {
    push
  };
};

export default {
  create,
};

