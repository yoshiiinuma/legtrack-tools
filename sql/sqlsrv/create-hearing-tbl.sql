
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name='hearings' AND xtype='U')
BEGIN
  CREATE TABLE hearings
  (
    id int identity(1,1),
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
    CONSTRAINT PK_hearings PRIMARY KEY CLUSTERED (id),
    UNIQUE (year, measureType, measureNumber, notice)
  )
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='hearings_lastupdated_idx')
BEGIN
  CREATE INDEX hearings_lastupdated_idx ON hearings(lastUpdated);
END

