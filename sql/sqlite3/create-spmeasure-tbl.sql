
CREATE TABLE IF NOT EXISTS spMeasures
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
);

CREATE INDEX IF NOT EXISTS spMeasures_lastupdated_idx ON spMeasures(lastUpdated);
