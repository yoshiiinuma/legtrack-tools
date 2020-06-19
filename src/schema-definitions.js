
export const DROP_LEGTRACK_DB = `
  DROP DATABASE IF EXISTS LegTrack
`;

export const CREATE_LEGTRACK_DB = `
  CREATE DATABASE LegTrack
`;

export const DROP_SP_MEASURE_TBL = `
  DROP TABLE IF EXISTS spMeasures
`;

export const CREATE_SP_MEASURE_TBL = `
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='spMeasures' AND xtype='U')
    CREATE TABLE spMeasures
    (
      id INT IDENTITY(1,1),
      year SMALLINT NOT NULL,
      spSessionId CHAR(1) NOT NULL,
      measureType NCHAR(3) NOT NULL,
      measureNumber SMALLINT NOT NULL,
      lastUpdated INT,
      code NVARCHAR(64),
      measurePdfUrl NVARCHAR(512),
      measureArchiveUrl NVARCHAR(512),
      measureTitle NVARCHAR(512),
      reportTitle NVARCHAR(512),
      bitAppropriation TINYINT,
      description NVARCHAR(1024),
      status NVARCHAR(512),
      introducer NVARCHAR(512),
      currentReferral NVARCHAR(256),
      trackingDepts NVARCHAR(256),
      companion NVARCHAR(256),
      CONSTRAINT PK_spMeasures PRIMARY KEY CLUSTERED (id),
      CONSTRAINT UQ_spMeasures UNIQUE (year, spSessionId, measureType, measureNumber)
    )
`;

export const DROP_SP_MEASURE_TBL_TYPE = `
  DROP TYPE IF EXISTS spMeasureTblType
`;

export const CREATE_SP_MEASURE_TBL_TYPE = `
  IF TYPE_ID('spMeasureTblType') IS NULL
    CREATE TYPE spMeasureTblType AS TABLE
    (
      year SMALLINT,
      spSessionId CHAR(1),
      measureType NCHAR(3),
      measureNumber SMALLINT,
      lastUpdated INT,
      code NVARCHAR(64),
      measurePdfUrl NVARCHAR(512),
      measureArchiveUrl NVARCHAR(512),
      measureTitle NVARCHAR(512),
      reportTitle NVARCHAR(512),
      bitAppropriation TINYINT,
      description NVARCHAR(1024),
      status NVARCHAR(512),
      introducer NVARCHAR(512),
      currentReferral NVARCHAR(256),
      trackingDepts NVARCHAR(256),
      companion NVARCHAR(256)
    )
`;

export const DROP_SP_MEASURE_UPSERT_PROC = `
  DROP PROC IF EXISTS spMeasureUpsertProc
`;

export const CREATE_SP_MEASURE_UPSERT_PROC = `
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='spMeasureUpsertProc' AND xtype='P')
    CREATE PROC spMeasureUpsertProc
      @TVP dbo.spMeasureTblType READONLY
      AS
      BEGIN
        SET NOCOUNT OFF;
        MERGE INTO spMeasures t
        USING @TVP AS s
           ON t.year = s.year
          AND t.spSessionId = s.spSessionId
          AND t.measureType = s.measureType
          AND t.measureNumber = s.measureNumber
        WHEN MATCHED THEN
          UPDATE
            SET lastUpdated = s.lastUpdated,
                code = s.code,
                measurePdfUrl = s.measurePdfUrl,
                measureArchiveUrl = s.measureArchiveUrl,
                measureTitle = s.measureTitle,
                reportTitle = s.reportTitle,
                bitAppropriation = s.bitAppropriation,
                description = s.description,
                status = s.status,
                introducer = s.introducer,
                currentReferral = s.currentReferral,
                trackingDepts = s.trackingDepts,
                companion = s.companion
        WHEN NOT MATCHED THEN
          INSERT
            (year, spSessionId, measureType, measureNumber, lastUpdated, 
             code, measurePdfUrl, measureArchiveUrl, measureTitle,
             reportTitle, bitAppropriation, description, status, 
             introducer, currentReferral, trackingDepts, companion)
          VALUES
            (s.year, s.spSessionId, s.measureType, s.measureNumber, s.lastUpdated,
             s.code, s.measurePdfUrl, s.measureArchiveUrl, s.measureTitle,
             s.reportTitle, s.bitAppropriation, s.description, s.status,
             s.introducer, s.currentReferral, s.trackingDepts, s.companion);
      END
`;
