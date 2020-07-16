
import mssql from 'mssql';

import Logger from './logger.js';

mssql.on('error', (e) => {
  Logger.error('SqlServerClient Unhandled Exception');
  Logger.error(e.toString());
  Logger.error(e.stack);
});


const create = (opt) => {
  const { server, database, user, password } = opt;
  const conf = {
    server, database, user, password,
    options: {
      encrypt: true,
      enableArithAbort: true
    }
  };

  let conn = null;

  const getConfig = () => {
    return conf;
  };

  const connect = async () => {
    conn = await mssql.connect(conf);
    return conn;
  };

  const close = async () => {
    if (!conn) {
      Logger.error('SqlServerClient#Close Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      throw new Error('SQLServerClient#close: Not Connected Yet');
    }
    const r = await conn.close();
    conn = null;
    return r;
  };

  const _query = async (sql) => {
    if (!conn) {
      Logger.error('SqlServerClient#_Query Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      throw new Error('SQLServerClient#query: Not Connected Yet');
    }
    return await conn.request().query(sql);
  };

  const _batch = async (sql) => {
    if (!conn) {
      Logger.error('SqlServerClient#_Batch Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
      throw new Error('SQLServerClient#batch: Not Connected Yet');
    }
    return await conn.request().batch(sql);
  };

  const query = async (sql) => {
    try {
      await connect();
      const rslt = await _query(sql);
      await close();
      return rslt;
    } catch (e) {
      Logger.error('SqlServerClient#Query Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const batch = async (sql) => {
    try {
      await connect();
      const rslt = await _batch(sql);
      await close();
      return rslt;
    } catch (e) {
      Logger.error('SqlServerClient#Batch Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const createTvp = (name) => {
    try {
      return new mssql.Table(name);
    } catch (e) {
      Logger.error('SqlServerClient#CreateTvp Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  const createRequest = () => {
    if (!conn) {
      throw new Error('SQLServerClient#createRequest: Not Connected Yet');
    }
    //return new conn.Request();
    try {
      return new mssql.Request(conn);
    } catch (e) {
      Logger.error('SqlServerClient#CreateRequest Error');
      Logger.error(e.toString());
      Logger.error(e.stack);
    }
  };

  return {
    getConfig,
    connect,
    close,
    query,
    batch,
    createTvp,
    createRequest
  };
}

export default { create };
