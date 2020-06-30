
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
    return [r.year, r.measureType, r.measureNumber, ts, r.code,
      r.measurePdfUrl, r.measureArchiveUrl, r.measureTitle, r.reportTitle,
      r.bitAppropriation, r.description, r.status, r.introducer,
      r.currentReferral, r.companion];
  };

  const createTvp = (data) => {
    const tvp = client.createTvp('measureTblType');
    tvp.columns.add('year', mssql.SmallInt);
    tvp.columns.add('measureType', mssql.NChar(3));
    tvp.columns.add('measureNumber', mssql.SmallInt);
    tvp.columns.add('lastUpdated', mssql.Int);
    tvp.columns.add('code', mssql.NVarChar(64));
    tvp.columns.add('measurePdfUrl', mssql.NVarChar(512));
    tvp.columns.add('measureArchiveUrl', mssql.NVarChar(512));
    tvp.columns.add('measureTitle', mssql.NVarChar(512));
    tvp.columns.add('reportTitle', mssql.NVarChar(512));
    tvp.columns.add('bitAppropriation', mssql.TinyInt);
    tvp.columns.add('description', mssql.NVarChar(1024));
    tvp.columns.add('status', mssql.NVarChar(512));
    tvp.columns.add('introducer', mssql.NVarChar(512));
    tvp.columns.add('currentReferral', mssql.NVarChar(256));
    tvp.columns.add('companion', mssql.NVarChar(256));

    for (const r of data) {
      tvp.rows.add(...formatData(r));
    }
    return tvp;
  };

  const push = async (data) => {
    if (!data) {
      Logger.error('RemoteMeasure#push: No Data Given')
      throw new Error('RemoteMeasure#push: No Data Given')
    }
    try {
      const tvp = createTvp(data);
      await client.connect();
      const req = client.createRequest();
      req.input('TVP', mssql.TVP, tvp);
      const res = await req.execute('measureUpsertProc');
      await client.close();
      return res;
    } catch (e) {
      Logger.error('RemoteMeasure#Push: Unexpected Exception');
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

