
import mssql from 'mssql';
import SqlsrvClient from '../src/sql-server-client.js';
import now from '../src/now.js';
import config from '../src/config.js';
import Logger from '../src/logger.js';

const create = (env) => {
  const conf = config.load(env);
  const client = SqlsrvClient.create(conf);

  const formatData = (r, timestamp) => {
    const ts = timestamp || now();
    return [r.year, r.spSessionId, r.measureType, r.measureNumber,
      r.code, ts, r.reportTitle, r.measureTitle,
      r.measurePdfUrl, r.measureArchiveUrl, r.currentReferral];
  };

  const createTvp = (data) => {
    const tvp = client.createTvp('spMeasureTblType');
    tvp.columns.add('year', mssql.SmallInt);
    tvp.columns.add('spSessionId', mssql.Char(1));
    tvp.columns.add('measureType', mssql.NChar(3));
    tvp.columns.add('measureNumber', mssql.SmallInt);
    tvp.columns.add('code', mssql.NVarChar(64));
    tvp.columns.add('lastUpdated', mssql.Int);
    tvp.columns.add('reportTitle', mssql.NVarChar(512));
    tvp.columns.add('measureTitle', mssql.NVarChar(512));
    tvp.columns.add('measurePdfUrl', mssql.NVarChar(512));
    tvp.columns.add('measureArchiveUrl', mssql.NVarChar(512));
    tvp.columns.add('currentReferral', mssql.NVarChar(256));
    //tvp.columns.add('bitAppropriation', mssql.TinyInt);
    //tvp.columns.add('description', mssql.NVarChar(1024));
    //tvp.columns.add('status', mssql.NVarChar(512));
    //tvp.columns.add('introducer', mssql.NVarChar(512));
    //tvp.columns.add('companion', NVarChar(256));

    for (const r of data) {
      tvp.rows.add(...formatData(r));
    }
    return tvp;
  };

  const push = async (data) => {
    if (!data) {
      Logger.error('RemoteSpMeasure#push: No Data Given')
      throw new Error('RemoteSpMeasure#push: No Data Given')
    }
    try {
      const tvp = createTvp(data);
      await client.connect();
      const req = client.createRequest();
      req.input('TVP', mssql.TVP, tvp);
      const res = await req.execute('spMeasureUpsertProc');
      await client.close();
      return res;
    } catch (e) {
      Logger.error('RemoteSpMeasure#Push: Unexpected Exception');
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

