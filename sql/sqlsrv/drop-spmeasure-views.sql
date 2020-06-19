IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spPositionView' AND xtype='V')
BEGIN
  DROP VIEW spPositionView;
END

IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spTrackedMeasureView' AND xtype='V')
BEGIN
  DROP VIEW spTrackedMeasureView;
END

IF EXISTS (SELECT 1 FROM sysobjects WHERE name='spMeasureView' AND xtype='V')
BEGIN
  DROP VIEW spMeasureView;
END

