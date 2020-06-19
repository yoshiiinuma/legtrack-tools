IF TYPE_ID('measureTblType') IS NULL
BEGIN
  CREATE TYPE measureTblType AS TABLE
  (
    year SMALLINT,
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
    currentReferral NVARCHAR(256)
    companion NVARCHAR(256)
  )
END

