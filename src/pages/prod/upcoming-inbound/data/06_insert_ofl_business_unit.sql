-- =============================================
-- SEED DATA FOR BUSINESS UNIT: OFL (OMCam Factory Laos)
-- Script: 20260424123400_inbound_grpo_seed_data_ofl
-- =============================================

DECLARE @businessUnit varchar(20) = 'OFL';

IF OBJECT_ID('inbound_po_item', 'U') IS NOT NULL
   AND COL_LENGTH('inbound_po_item', 'warehouse_code') IS NULL
BEGIN
    ALTER TABLE inbound_po_item ADD warehouse_code varchar(50) NULL;
END;

IF OBJECT_ID('inbound_purchase_order', 'U') IS NOT NULL
   AND COL_LENGTH('inbound_purchase_order', 'sap_doc_entry') IS NULL
BEGIN
    ALTER TABLE inbound_purchase_order ADD sap_doc_entry int NULL;
END;

IF OBJECT_ID('inbound_purchase_order', 'U') IS NOT NULL
   AND COL_LENGTH('inbound_purchase_order', 'sap_doc_num') IS NULL
BEGIN
    ALTER TABLE inbound_purchase_order ADD sap_doc_num varchar(40) NULL;
END;

IF OBJECT_ID('inbound_purchase_order', 'U') IS NOT NULL
   AND COL_LENGTH('inbound_purchase_order', 'doc_status') IS NULL
BEGIN
    ALTER TABLE inbound_purchase_order ADD doc_status varchar(40) NULL;
END;

IF OBJECT_ID('inbound_po_pr_link', 'U') IS NOT NULL
   AND COL_LENGTH('inbound_po_pr_link', 'pr_uuid') IS NULL
BEGIN
    ALTER TABLE inbound_po_pr_link ADD pr_uuid varchar(80) NULL;
END;

-- =============================================




-- =============================================
-- MERGE inbound_purchase_order
-- =============================================
MERGE inbound_purchase_order AS target
USING (
    VALUES
        ('PO-2026-0892', 'OMCam Co. Ltd', 'SUP-OMCAM', '2026-03-06', '10:00', 'Planned', 'Open', 5, 157200),
        ('PO-2026-0893', 'Sichuan HX Printing', 'SUP-SICHUAN-HX', '2026-03-06', '14:00', 'Planned', 'Open', 2, 205000),
        ('PO-2026-0894', 'KA Sugar', 'SUP-KA-SUGAR', '2026-03-06', '11:30', 'Planned', 'Open', 1, 8000),
        ('PO-2026-0888', 'OMCam Co. Ltd', 'SUP-OMCAM', '2026-03-06', '09:00', 'Planned', 'Open', 2, 180000),
        ('PO-2026-0890', 'Local Supplier', 'SUP-LOCAL', '2026-03-07', '15:00', 'Planned', 'Open', 1, 20000),
        ('PO-2026-0895', 'Dong Guan City Finestar', 'SUP-DONG-GUAN-FINESTAR', '2026-03-07', '09:00', 'Planned', 'Open', 2, 17400),
        ('PO-2026-0896', 'BOC Gases', 'SUP-BOC-GASES', '2026-03-07', '10:30', 'Planned', 'Open', 1, 200),
        ('PO-2026-0898', 'PTT Global Chemical', 'SUP-PTT-GC', '', '', 'Unplanned', 'Open', 1, 500),
        ('PO-2026-0899', 'OMCam Co. Ltd', 'SUP-OMCAM', '', '', 'Unplanned', 'Open', 1, 3000)
) AS source (po_number, supplier, supplier_code, expected_date, expected_time, type, doc_status, total_items, total_qty)
ON target.business_unit = @businessUnit AND target.po_number = source.po_number
WHEN MATCHED THEN
    UPDATE SET
        target.supplier = source.supplier,
        target.supplier_code = source.supplier_code,
        target.expected_date = source.expected_date,
        target.expected_date_dt = TRY_CONVERT(date, LEFT(NULLIF(source.expected_date, ''), 10)),
        target.expected_time = source.expected_time,
        target.type = source.type,
        target.doc_status = source.doc_status,
        target.total_items = source.total_items,
        target.total_qty = source.total_qty,
        target.last_modified_by = 'system',
        target.last_modified_date = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (business_unit, po_number, supplier, supplier_code, expected_date, expected_date_dt, expected_time, type, doc_status, total_items, total_qty, created_by, created_date)
    VALUES (@businessUnit, source.po_number, source.supplier, source.supplier_code, source.expected_date, TRY_CONVERT(date, LEFT(NULLIF(source.expected_date, ''), 10)), source.expected_time, source.type, source.doc_status, source.total_items, source.total_qty, 'system', GETDATE());

-- =============================================
-- MERGE inbound_po_item
-- =============================================
MERGE inbound_po_item AS target
USING (
    VALUES
        ('PO-2026-0892', 'PM000023', 'PM - Preform 500ML', 50000, 0, 50000, 'EA', 'WHM1', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0892', 'PM000004', 'PM - CAP-Normal', 50000, 0, 50000, 'EA', 'WHM1', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0892', 'PM000012', 'PM - CAP-Press', 20000, 0, 20000, 'EA', 'WHM1', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0892', 'PM000030', 'PM - Wrap Label 500ML', 30000, 0, 30000, 'EA', 'WHM02', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0892', 'PM000029', 'PM - Wrap Paper Carton 500ML', 7200, 0, 7200, 'EA', 'WHM02', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0893', 'PM000030', 'PM - Wrap Label 500ML', 200000, 0, 200000, 'EA', 'WHM02', 'Sichuan HX Printing', 'SUP-SICHUAN-HX'),
        ('PO-2026-0893', 'PM000015', 'PM - Wrap Label 1L', 5000, 0, 5000, 'EA', 'WHM02', 'Sichuan HX Printing', 'SUP-SICHUAN-HX'),
        ('PO-2026-0894', 'RM000005', 'Raw Material - Sugar', 8000, 0, 8000, 'KG', 'WHM1', 'KA Sugar', 'SUP-KA-SUGAR'),
        ('PO-2026-0888', 'PM000012', 'PM - CAP-Press', 100000, 60000, 40000, 'EA', 'WHM1', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0888', 'PM000004', 'PM - CAP-Normal', 80000, 35000, 45000, 'EA', 'WHM1', 'OMCam Co. Ltd', 'SUP-OMCAM'),
        ('PO-2026-0890', 'RM000001', 'Raw Material - Water', 20000, 0, 20000, 'L', 'WHM1', 'Local Supplier', 'SUP-LOCAL'),
        ('PO-2026-0895', 'PM000029', 'PM - Wrap Paper Carton 500ML', 14400, 0, 14400, 'EA', 'WHM02', 'Dong Guan City Finestar', 'SUP-DONG-GUAN-FINESTAR'),
        ('PO-2026-0895', 'PM000011', 'PM - Preform 1L', 3000, 0, 3000, 'EA', 'WHM02', 'Dong Guan City Finestar', 'SUP-DONG-GUAN-FINESTAR'),
        ('PO-2026-0896', 'RM000008', 'Raw Material - CO2', 200, 0, 200, 'TANK', 'WHM1', 'BOC Gases', 'SUP-BOC-GASES'),
        ('PO-2026-0898', 'RM000003', 'Raw Material - Citric Acid', 500, 0, 500, 'KG', 'WHM1', 'PTT Global Chemical', 'SUP-PTT-GC'),
        ('PO-2026-0899', 'PM000011', 'PM - Preform 1L', 3000, 0, 3000, 'EA', 'WHM02', 'OMCam Co. Ltd', 'SUP-OMCAM')
) AS source (po_number, item_code, item_name, po_qty, received_qty, remaining_qty, uom, warehouse_code, supplier, supplier_code)
ON target.business_unit = @businessUnit
   AND target.po_number = source.po_number
   AND target.item_code = source.item_code
WHEN MATCHED THEN
    UPDATE SET
        target.item_name = source.item_name,
        target.po_qty = source.po_qty,
        target.received_qty = source.received_qty,
        target.remaining_qty = source.remaining_qty,
        target.uom = source.uom,
        target.warehouse_code = source.warehouse_code,
        target.supplier = source.supplier,
        target.supplier_code = source.supplier_code
WHEN NOT MATCHED THEN
    INSERT (business_unit, po_number, item_code, item_name, po_qty, received_qty, remaining_qty, uom, warehouse_code, supplier, supplier_code)
    VALUES (@businessUnit, source.po_number, source.item_code, source.item_name, source.po_qty, source.received_qty, source.remaining_qty, source.uom, source.warehouse_code, source.supplier, source.supplier_code);

-- =============================================
-- MERGE inbound_po_pr_link
-- =============================================
IF OBJECT_ID('inbound_po_pr_link', 'U') IS NOT NULL
BEGIN
    MERGE inbound_po_pr_link AS target
    USING (
        VALUES
            ('PO-2026-0892', 'PR-2026-0410', '410', '20260410', '6ab615e6-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0892', 'PR-2026-0411', '411', '20260411', '6ab615e7-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0893', 'PR-2026-0412', '412', '20260412', '6ab615e8-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0894', 'PR-2026-0413', '413', '20260413', '6ab615e9-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0888', 'PR-2026-0408', '408', '20260408', '6ab615ea-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0890', 'PR-2026-0409', '409', '20260409', '6ab615eb-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0895', 'PR-2026-0414', '414', '20260414', '6ab615ec-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0896', 'PR-2026-0415', '415', '20260415', '6ab615ed-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0898', 'PR-2026-0416', '416', '20260416', '6ab615ee-1942-11f1-a4ce-005056874e4b'),
            ('PO-2026-0899', 'PR-2026-0417', '417', '20260417', '6ab615ef-1942-11f1-a4ce-005056874e4b')
    ) AS source (po_number, pr_number, pr_doc_entry, pr_doc_num, pr_uuid)
    ON target.business_unit = @businessUnit
       AND target.po_number = source.po_number
       AND target.pr_number = source.pr_number
    WHEN MATCHED THEN
        UPDATE SET
            target.pr_doc_entry = source.pr_doc_entry,
            target.pr_doc_num = source.pr_doc_num,
            target.pr_uuid = source.pr_uuid,
            target.last_modified_by = 'system',
            target.last_modified_date = GETDATE()
    WHEN NOT MATCHED THEN
        INSERT (business_unit, po_number, pr_number, pr_doc_entry, pr_doc_num, pr_uuid, created_by, created_date)
        VALUES (@businessUnit, source.po_number, source.pr_number, source.pr_doc_entry, source.pr_doc_num, source.pr_uuid, 'system', GETDATE());
END;
