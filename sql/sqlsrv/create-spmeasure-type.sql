IF TYPE_ID('spMeasureTblType') IS NULL
BEGIN
  CREATE TYPE spMeasureTblType AS TABLE
  (
    year SMALLINT,
    spSessionId CHAR(1),
    measureType NCHAR(3),
    measureNumber SMALLINT,
    code NVARCHAR(64),
    lastUpdated INT,
    reportTitle NVARCHAR(512),
    measureTitle NVARCHAR(512),
    measurePdfUrl NVARCHAR(512),
    measureArchiveUrl NVARCHAR(512),
    currentReferral NVARCHAR(256)
  )
END

