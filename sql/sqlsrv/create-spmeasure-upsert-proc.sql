IF OBJECT_ID('spMeasureUpsertProc') IS NULL
BEGIN
  EXEC('
  CREATE PROCEDURE spMeasureUpsertProc
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
          SET code = s.code,
              lastUpdated = s.lastUpdated,
              reportTitle = s.reportTitle,
              measureTitle = s.measureTitle,
              measurePdfUrl = s.measurePdfUrl,
              measureArchiveUrl = s.measureArchiveUrl,
              currentReferral = s.currentReferral
      WHEN NOT MATCHED THEN
        INSERT
          (year, spSessionId, measureType, measureNumber, code, lastUpdated, 
           reportTitle, measurePdfUrl, measureArchiveUrl, measureTitle,
           currentReferral)
        VALUES
          (s.year, s.spSessionId, s.measureType, s.measureNumber, s.code, s.lastUpdated,
           s.reportTitle, s.measurePdfUrl, s.measureArchiveUrl, s.measureTitle,
           s.currentReferral);
    END
  ')
END
