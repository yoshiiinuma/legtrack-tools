IF TYPE_ID('hearingTblType') IS NULL
BEGIN
  CREATE TYPE hearingTblType AS TABLE
  (
    year SMALLINT,
    measureType NCHAR(3),
    measureNumber SMALLINT,
    measureRelativeUrl NVARCHAR(512),
    code NVARCHAR(64),
    committee NVARCHAR(256),
    lastUpdated INT,
    timestamp INT,
    datetime NVARCHAR(32),
    description NVARCHAR(512),
    room NVARCHAR(32),
    notice NVARCHAR(128),
    noticeUrl NVARCHAR(512),
    noticePdfUrl NVARCHAR(512)
  )
END

