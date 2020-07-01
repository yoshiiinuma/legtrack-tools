IF OBJECT_ID('hearingUpsertProc') IS NULL
BEGIN
  EXEC('
  CREATE PROCEDURE hearingUpsertProc
    @TVP dbo.hearingTblType READONLY
    AS
    BEGIN
      SET NOCOUNT OFF;
      MERGE INTO hearings t
      USING @TVP AS s
         ON t.year = s.year
        AND t.measureType = s.measureType
        AND t.measureNumber = s.measureNumber
        AND t.notice = s.notice
      WHEN MATCHED THEN
        UPDATE
          SET measureRelativeUrl = s.measureRelativeUrl,
              code = s.code,
              committee = s.committee,
              lastUpdated = s.lastUpdated,
              timestamp = s.timestamp,
              datetime = s.datetime,
              description = s.description,
              room = s.room,
              noticeUrl = s.noticeUrl,
              noticePdfUrl = s.noticePdfUrl
      WHEN NOT MATCHED THEN
        INSERT
          (year, measureType, measureNumber, notice, measureRelativeUrl,
           code, committee, lastUpdated, timestamp, datetime, description,
           room, noticeUrl, noticePdfUrl)
        VALUES
          (s.year, s.measureType, s.measureNumber, s.notice, s.measureRelativeUrl,
           s.code, s.committee, s.lastUpdated, s.timestamp, s.datetime, s.description,
           s.room, s.noticeUrl, s.noticePdfUrl);
    END
  ')
 END
