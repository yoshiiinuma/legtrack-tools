
import { expect } from 'chai';

import SqliteClient from '../src/sqlite-client.js';
import * as helper from './sqlite-helper.js';

const DROP_MEASURES_TABLE_SQL = "DROP TABLE IF EXISTS spMeasures;";

const CREATE_SP_MEASURES =
   `CREATE TABLE IF NOT EXISTS spMeasures
    (
      year smallint NOT NULL,
      spSessionId char(1) NOT NULL,
      measureType nchar(3) NOT NULL,
      measureNumber smallint NOT NULL,
      lastUpdated int,
      code nvarchar(64),
      measurePdfUrl nvarchar(512),
      measureArchiveUrl nvarchar(512),
      measureTitle nvarchar(512),
      reportTitle nvarchar(512),
      bitAppropriation tinyint,
      description nvarchar(1024),
      status nvarchar(512),
      introducer nvarchar(512),
      currentReferral nvarchar(256),
      companion nvarchar(256),
      PRIMARY KEY (year, spSessionId, measureType, measureNumber)
    );`;

const DROP_SP_MEASURES_INDEX_SQL = 
  `DROP INDEX IF EXISTS spMeasures_lastupdated_idx ON spMeasures;`;

const CREATE_SP_MEASURES_INDEX_SQL = 
  `CREATE INDEX IF NOT EXISTS spMeasures_lastupdated_idx ON spMeasures(lastUpdated);`;

const INSERT_SP_MEASURES_SQL =
  `INSERT INTO spMeasures
          (year, spSessionId, measureType, measureNumber, reportTitle, measureTitle, currentReferral)
   VALUES (2020, 'a', 'hb', 1, 'REP1', 'MEASURE1', 'REF1'),
          (2020, 'a', 'hb', 2, 'REP2', 'MEASURE2', 'REF2'),
          (2020, 'a', 'hb', 3, 'REP3', 'MEASURE3', 'REF3');`;

describe('SqliteClient', () => {
  const db = SqliteClient.create('test');
  let r;

  it('handles CRUD operations', async () => {
    await db.run('DELETE FROM spMeasures');
    r = await db.get('SELECT COUNT(*) FROM spMeasures');
    expect(r['COUNT(*)']).to.equal(0);
    r = await db.run(INSERT_SP_MEASURES_SQL);
    expect(r['changes']).to.equal(3);
    r = await db.get('SELECT COUNT(*) FROM spMeasures');
    expect(r['COUNT(*)']).to.equal(3);
    r = await db.all('SELECT * FROM spMeasures');
    expect(r.map((e) => e.measureNumber)).to.eql([1, 2, 3]);
    expect(r.map((e) => e.reportTitle)).to.eql(['REP1', 'REP2', 'REP3']);
    expect(r.map((e) => e.measureTitle)).to.eql(['MEASURE1', 'MEASURE2', 'MEASURE3']);
    expect(r.map((e) => e.currentReferral)).to.eql(['REF1', 'REF2', 'REF3']);
  });
});

