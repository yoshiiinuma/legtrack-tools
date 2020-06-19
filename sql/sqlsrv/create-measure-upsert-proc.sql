IF OBJECT_ID('measureUpsertProc') IS NULL
BEGIN
  CREATE PROCEDURE measureUpsertProc
    @TVP dbo.measureTblType READONLY
    AS
    BEGIN
      SET NOCOUNT OFF;
      MERGE INTO measures t
      USING @TVP AS s
         ON t.year = s.year
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
              bitAppropriation = s.bitAppropriation,
              description = s.description,
              status = s.status,
              introducer = s.introducer,
              currentReferral = s.currentReferral,
              companion = s.companion
      WHEN NOT MATCHED THEN
        INSERT
          (year, measureType, measureNumber, code, lastUpdated, reportTitle,
            measureTitle, measurePdfUrl, measureArchiveUrl, bitAppropriation,
            description, status, introducer, currentReferral, companion)
        VALUES
          (s.year, s.measureType, s.measureNumber, s.code, s.lastUpdated, s.reportTitle,
           s.measureTitle, s.measurePdfUrl, s.measureArchiveUrl, s.bitAppropriation,
           s.description, s.status, s.introducer, s.currentReferral, s.companion);
    END
 END
