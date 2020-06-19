IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spComments' AND xtype='U')
BEGIN
  DROP TABLE spComments;
END

IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spPositions' AND xtype='U')
BEGIN
  DROP TABLE spPositions;
END

IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spTrackedMeasures' AND xtype='U')
BEGIN
  DROP TABLE spTrackedMeasures;
END

IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spMeasures' AND xtype='U')
BEGIN
  DROP TABLE IF EXISTS spMeasures;
END

