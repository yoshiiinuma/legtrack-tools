
import SqlsrvClient from '../src/sql-server-client.js';
import config from '../src/config.js';
import * as SQL from '../src/schema-definitions.js';

const createSchemaManager = (env) => {
  const conf = config.load(env);
  const client = SqlsrvClient.create(conf);

  const createSpMeasureTbl = async () => {
    return await client.batch(SQL.CREATE_SP_MEASURE_TBL);
  };

  const dropSpMeasureTbl = async () => {
    return await client.batch(SQL.DROP_SP_MEASURE_TBL);
  };

  const createSpMeasureTblType = async () => {
    return await client.batch(SQL.CREATE_SP_MEASURE_TBL_TYPE);
  };

  const dropSpMeasureTblType = async () => {
    return await client.batch(SQL.DROP_SP_MEASURE_TBL_TYPE);
  };

  /*
   * NOT work because node-mssql#batch does not support TVP
   * Run the SQL script in a different way
   */
  const createSpMeasureUpsertProc = async () => {
    return await client.batch(SQL.CREATE_SP_MEASURE_UPSERT_PROC);
  };

  const dropSpMeasureUpsertProc = async () => {
    return await client.batch(SQL.DROP_SP_MEASURE_UPSERT_PROC);
  };

  return {
    createSpMeasureTbl,
    dropSpMeasureTbl,
    createSpMeasureTblType,
    dropSpMeasureTblType,
    createSpMeasureUpsertProc,
    dropSpMeasureUpsertProc
  };
};

export default createSchemaManager;

