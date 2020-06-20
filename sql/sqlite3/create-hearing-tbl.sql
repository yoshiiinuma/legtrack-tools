
CREATE TABLE IF NOT EXISTS hearings
(
  year smallint NOT NULL,
  measureType nchar(4) NOT NULL,
  measureNumber smallint NOT NULL,
  measureRelativeUrl nvarchar(512),
  code nvarchar(64),
  committee nvarchar(256),
  lastUpdated int,
  timestamp int,
  datetime nvarchar(32),
  description nvarchar(512),
  room nvarchar(32),
  notice nvarchar(128),
  noticeUrl nvarchar(512),
  noticePdfUrl nvarchar(512),
  UNIQUE (year, measureType, measureNumber, notice)
);

CREATE INDEX IF NOT EXISTS hearings_lastupdated_idx ON hearings(lastUpdated);

