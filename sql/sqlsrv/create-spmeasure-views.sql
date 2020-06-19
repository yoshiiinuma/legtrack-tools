IF NOT EXISTS (SELECT 1 FROM sys.views WHERE name='spMeasureView' AND type='VIEW')
BEGIN
  EXEC('
  CREATE VIEW spMeasureView AS
  SELECT m.id, m.year,
         CONCAT(TRIM(m.measureType), RIGHT(''00000'' + CAST(m.measureNumber as nvarchar(5)), 5)) as billId,
         m.spSessionId, m.measureType, m.measureNumber, m.code, m.measurePdfUrl, m.measureArchiveUrl,
         m.measureTitle, m.reportTitle, m.bitAppropriation, m.description, m.status,
         m.introducer, m.currentReferral as committee, m.companion,
         ((SELECT '','' + CAST(t.deptId as nvarchar(12))
            FROM spTrackedMeasures t
            WHERE t.tracked = 1 AND t.measureId = m.id
            ORDER BY t.deptId
            FOR XML PATH('''')) + '',''
         )  as trackedBy
    FROM spMeasures m
   ')
END

IF NOT EXISTS (SELECT 1 FROM sys.views WHERE name='spTrackedMeasureView')
BEGIN
  EXEC('
  CREATE VIEW spTrackedMeasureView AS
  SELECT t.id, t.measureId, m.year, t.deptId, t.tracked,
         CONCAT(TRIM(m.measureType), RIGHT(''00000'' + CAST(m.measureNumber as nvarchar(5)), 5)) as billId,
         m.spSessionId as spSessionId, m.measureType, m.measureNumber, m.code, m.measurePdfUrl, m.measureArchiveUrl,
         m.measureTitle, m.reportTitle, m.bitAppropriation, m.description, m.status as measureStatus,
         m.introducer, m.currentReferral as committee, m.companion,
         t.billProgress, t.scrNo, t.adminBill, t.dead, t.confirmed, t.passed, t.ccr,
         t.appropriation, t.appropriationAmount, t.report, t.directorAttention,
         t.govMsgNo, t.dateToGov, t.actDate, t.actNo, t.reportingRequirement, t.reportDueDate,
         t.sectionsAffected, t.effectiveDate, t.veto, t.vetoDate, t.vetoOverride, t.vetoOverrideDate,
         t.finalBill, t.version, 1 as rowcnt
    FROM spTrackedMeasures t
    JOIN spMeasures m ON m.id = t.measureId
   ')
END

IF NOT EXISTS (SELECT 1 FROM sys.views WHERE name='spPositionView')
BEGIN
  EXEC('
  CREATE VIEW spPositionView AS
  SELECT p.id as positionId, t.id as trackedMeasureId, t.measureId, t.year, t.deptId, p.groupId, g.groupName,
         t.tracked, p.role, p.category, p.position, p.approvalStatus, p.status as testimonyStatus, p.assignedTo, u.userPrincipalName as assigneePrincipalName, u.displayName as assignee,
         t.billId, t.spSessionId, t.measureType, t.measureNumber, t.code, t.measurePdfUrl, t.measureArchiveUrl,
         t.measureTitle, t.reportTitle, t.bitAppropriation, t.description, t.measureStatus,
         t.introducer, t.committee, t.companion,
         t.billProgress, t.scrNo, t.adminBill, t.dead, t.confirmed, t.passed, t.ccr,
         t.appropriation, t.appropriationAmount, t.report, t.directorAttention,
         t.govMsgNo, t.dateToGov, t.actDate, t.actNo, t.reportingRequirement, t.reportDueDate,
         t.sectionsAffected, t.effectiveDate, t.veto, t.vetoDate, t.vetoOverride, t.vetoOverrideDate,
         t.finalBill, t.version as trackedMeasureVersion, p.version as positionVersion
    FROM spTrackedMeasureView t
    JOIN spPositions p ON p.year = t.year
                    AND p.deptId = t.deptId
                    AND p.measureId = t.measureId
    JOIN groups g on g.id = p.groupId
    LEFT JOIN users u on u.id = p.assignedTo
   ')
END

