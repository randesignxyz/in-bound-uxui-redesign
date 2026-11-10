    -- Seed inbound SAP master data for supplier and UOM dropdown testing.
    -- Database: Microsoft SQL Server
    --
    -- Tables are created by the Kotlin JPA domain mappings.
    -- Run this only after the app has started once and created:
    --   inbound_supplier_master
    --   inbound_uom_master
    --   inbound_warehouse_master
    --   inbound_item_master

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

    IF OBJECT_ID('inbound_purchase_order', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_purchase_order', 'status') IS NOT NULL
    BEGIN
        IF COL_LENGTH('inbound_purchase_order', 'doc_status') IS NOT NULL
        BEGIN
            EXEC('
                UPDATE inbound_purchase_order
                SET doc_status = CASE
                    WHEN NULLIF(doc_status, '''') IS NOT NULL THEN doc_status
                    WHEN UPPER(status) IN (''OPEN'', ''CLOSE'', ''CLOSED'') THEN status
                    ELSE ''Open''
                END
            ');
        END;

        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'idx_inbound_po_status'
            AND object_id = OBJECT_ID('inbound_purchase_order')
        )
        BEGIN
            DROP INDEX idx_inbound_po_status ON inbound_purchase_order;
        END;

        IF EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'idx_inbound_po_bu_status'
            AND object_id = OBJECT_ID('inbound_purchase_order')
        )
        BEGIN
            DROP INDEX idx_inbound_po_bu_status ON inbound_purchase_order;
        END;

        ALTER TABLE inbound_purchase_order DROP COLUMN status;
    END;

    IF OBJECT_ID('inbound_po_item', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_po_item', 'line_number') IS NULL
    BEGIN
        ALTER TABLE inbound_po_item ADD line_number int NULL;
    END;

    IF OBJECT_ID('inbound_po_item', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_po_item', 'line_status') IS NULL
    BEGIN
        ALTER TABLE inbound_po_item ADD line_status varchar(40) NULL;
    END;

    IF OBJECT_ID('inbound_po_item', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_po_item', 'expected_date') IS NULL
    BEGIN
        ALTER TABLE inbound_po_item ADD expected_date varchar(255) NULL;
    END;

    IF OBJECT_ID('inbound_po_item', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_po_item', 'expected_date_dt') IS NULL
    BEGIN
        ALTER TABLE inbound_po_item ADD expected_date_dt date NULL;
    END;

    IF OBJECT_ID('inbound_receiving_item', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_receiving_item', 'po_line_number') IS NULL
    BEGIN
        ALTER TABLE inbound_receiving_item ADD po_line_number int NULL;
    END;

    IF OBJECT_ID('inbound_receiving', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_receiving', 'sap_gr_number') IS NULL
    BEGIN
        ALTER TABLE inbound_receiving ADD sap_gr_number varchar(40) NULL;
    END;

    IF OBJECT_ID('inbound_receiving', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_receiving', 'sap_gr_status') IS NULL
    BEGIN
        ALTER TABLE inbound_receiving ADD sap_gr_status varchar(40) NULL;
    END;

    IF OBJECT_ID('inbound_receiving', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_receiving', 'exception_reason') IS NOT NULL
    BEGIN
        ALTER TABLE inbound_receiving ALTER COLUMN exception_reason nvarchar(max) NULL;
    END;

    IF OBJECT_ID('inbound_receiving_activity', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_receiving_activity', 'description') IS NOT NULL
    BEGIN
        ALTER TABLE inbound_receiving_activity ALTER COLUMN description nvarchar(max) NULL;
    END;

    IF OBJECT_ID('inbound_receiving', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_receiving', 'sap_doc_no') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'idx_inbound_receiving_bu_sap_doc_no'
            AND object_id = OBJECT_ID('inbound_receiving')
    )
    BEGIN
        CREATE INDEX idx_inbound_receiving_bu_sap_doc_no ON inbound_receiving (business_unit, sap_doc_no);
    END;

    IF OBJECT_ID('inbound_po_pr_link', 'U') IS NULL
    BEGIN
        CREATE TABLE inbound_po_pr_link (
            id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
            business_unit varchar(50) NOT NULL,
            po_number varchar(40) NOT NULL,
            pr_number varchar(40) NOT NULL,
            pr_doc_entry varchar(40) NULL,
            pr_doc_num varchar(40) NULL,
            pr_uuid varchar(80) NULL,
            sap_last_updated_at datetime2 NULL,
            created_by varchar(50) NULL,
            created_date datetime2 NULL,
            last_modified_by varchar(50) NULL,
            last_modified_date datetime2 NULL,
            CONSTRAINT uk_inbound_po_pr_link_bu_po_pr UNIQUE (business_unit, po_number, pr_number)
        );

        CREATE INDEX idx_inbound_po_pr_link_business_unit ON inbound_po_pr_link (business_unit);
        CREATE INDEX idx_inbound_po_pr_link_po_number ON inbound_po_pr_link (po_number);
        CREATE INDEX idx_inbound_po_pr_link_pr_number ON inbound_po_pr_link (pr_number);
        CREATE INDEX idx_inbound_po_pr_link_bu_po_number ON inbound_po_pr_link (business_unit, po_number);
    END;

    IF OBJECT_ID('inbound_po_pr_link', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_po_pr_link', 'pr_uuid') IS NULL
    BEGIN
        ALTER TABLE inbound_po_pr_link ADD pr_uuid varchar(80) NULL;
    END;

    IF OBJECT_ID('inbound_warehouse_master', 'U') IS NULL
    BEGIN
        CREATE TABLE inbound_warehouse_master (
            id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
            business_unit varchar(50) NOT NULL,
            warehouse_code varchar(50) NOT NULL,
            warehouse_name varchar(255) NOT NULL,
            status varchar(40) NOT NULL,
            sap_last_updated_at datetime2 NULL,
            created_by varchar(50) NULL,
            created_date datetime2 NULL,
            last_modified_by varchar(50) NULL,
            last_modified_date datetime2 NULL,
            CONSTRAINT uk_inbound_warehouse_master_bu_code UNIQUE (business_unit, warehouse_code)
        );

        CREATE INDEX idx_inbound_warehouse_master_business_unit ON inbound_warehouse_master (business_unit);
        CREATE INDEX idx_inbound_warehouse_master_code ON inbound_warehouse_master (warehouse_code);
        CREATE INDEX idx_inbound_warehouse_master_name ON inbound_warehouse_master (warehouse_name);
        CREATE INDEX idx_inbound_warehouse_master_status ON inbound_warehouse_master (status);
    END;

    IF OBJECT_ID('inbound_item_master', 'U') IS NULL
    BEGIN
        CREATE TABLE inbound_item_master (
            id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
            business_unit varchar(50) NOT NULL,
            item_code varchar(50) NOT NULL,
            item_name varchar(255) NOT NULL,
            uom varchar(40) NOT NULL,
            is_active bit NOT NULL CONSTRAINT df_inbound_item_master_is_active DEFAULT ((1)),
            sap_last_updated_at datetime2 NULL,
            created_by varchar(50) NULL,
            created_date datetime2 NULL,
            last_modified_by varchar(50) NULL,
            last_modified_date datetime2 NULL,
            CONSTRAINT uk_inbound_item_master_bu_code UNIQUE (business_unit, item_code)
        );

        CREATE INDEX idx_inbound_item_master_business_unit ON inbound_item_master (business_unit);
        CREATE INDEX idx_inbound_item_master_code ON inbound_item_master (item_code);
        CREATE INDEX idx_inbound_item_master_name ON inbound_item_master (item_name);
        CREATE INDEX idx_inbound_item_master_uom ON inbound_item_master (uom);
        CREATE INDEX idx_inbound_item_master_active ON inbound_item_master (is_active);
    END;

    IF OBJECT_ID('inbound_uom_master', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_uom_master', 'business_unit') IS NULL
    BEGIN
        ALTER TABLE inbound_uom_master ADD business_unit varchar(50) NULL;
        UPDATE inbound_uom_master SET business_unit = 'OMC' WHERE business_unit IS NULL;
        ALTER TABLE inbound_uom_master ALTER COLUMN business_unit varchar(50) NOT NULL;
    END;

    IF OBJECT_ID('inbound_uom_master', 'U') IS NOT NULL
    AND COL_LENGTH('inbound_uom_master', 'uom_entry') IS NULL
    BEGIN
        ALTER TABLE inbound_uom_master ADD uom_entry int NULL;
    END;

    IF OBJECT_ID('inbound_uom_master', 'U') IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.key_constraints
            WHERE name = 'uk_inbound_uom_master_code'
            AND parent_object_id = OBJECT_ID('inbound_uom_master')
        )
        BEGIN
            ALTER TABLE inbound_uom_master DROP CONSTRAINT uk_inbound_uom_master_code;
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.key_constraints
            WHERE name = 'uk_inbound_uom_master_bu_code'
            AND parent_object_id = OBJECT_ID('inbound_uom_master')
        )
        BEGIN
            ALTER TABLE inbound_uom_master
            ADD CONSTRAINT uk_inbound_uom_master_bu_code UNIQUE (business_unit, uom_code);
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'idx_inbound_uom_master_business_unit'
            AND object_id = OBJECT_ID('inbound_uom_master')
        )
        BEGIN
            CREATE INDEX idx_inbound_uom_master_business_unit ON inbound_uom_master (business_unit);
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'idx_inbound_uom_master_bu_code'
            AND object_id = OBJECT_ID('inbound_uom_master')
        )
        BEGIN
            CREATE INDEX idx_inbound_uom_master_bu_code ON inbound_uom_master (business_unit, uom_code);
        END;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = 'idx_inbound_uom_master_uom_entry'
            AND object_id = OBJECT_ID('inbound_uom_master')
        )
        BEGIN
            CREATE INDEX idx_inbound_uom_master_uom_entry ON inbound_uom_master (uom_entry);
        END;
    END;

    IF OBJECT_ID('inbound_supplier_master', 'U') IS NOT NULL
    BEGIN
        MERGE inbound_supplier_master AS target
        USING (
            VALUES
                ('OMC', 'V000123', 'ABC Packaging Co., Ltd', 'Active'),
                ('OMC', 'V000124', 'Cambodia Raw Material Supply', 'Active'),
                ('OMC', 'V000125', 'Phnom Penh Label Printing', 'Active'),
                ('OML', 'V000223', 'Laos Packaging Partner', 'Active'),
                ('OML', 'V000224', 'Vientiane Raw Material Supply', 'Active'),
                ('OMK', 'V000323', 'Kenya Material Supply Ltd', 'Active'),
                ('OMK', 'V000324', 'Nairobi Packaging House', 'Active'),
                ('OFL', 'V000423', 'OFL Factory Local Supplier', 'Active'),
                ('OFL', 'V000424', 'OFL Packaging Supplier', 'Active'),
                ('OMC', 'SUP-OMCAM', 'OMCam Co. Ltd', 'Active'),
                ('OMC', 'SUP-SICHUAN-HX', 'Sichuan HX Printing', 'Active'),
                ('OMC', 'SUP-KA-SUGAR', 'KA Sugar', 'Active'),
                ('OMC', 'SUP-LOCAL', 'Local Supplier', 'Active'),
                ('OMC', 'SUP-DONG-GUAN-FINESTAR', 'Dong Guan City Finestar', 'Active'),
                ('OMC', 'SUP-BOC-GASES', 'BOC Gases', 'Active'),
                ('OMC', 'SUP-PTT-GC', 'PTT Global Chemical', 'Active'),
                ('OML', 'SUP-OMCAM', 'OMCam Co. Ltd', 'Active'),
                ('OML', 'SUP-SICHUAN-HX', 'Sichuan HX Printing', 'Active'),
                ('OML', 'SUP-KA-SUGAR', 'KA Sugar', 'Active'),
                ('OML', 'SUP-LOCAL', 'Local Supplier', 'Active'),
                ('OML', 'SUP-DONG-GUAN-FINESTAR', 'Dong Guan City Finestar', 'Active'),
                ('OML', 'SUP-BOC-GASES', 'BOC Gases', 'Active'),
                ('OML', 'SUP-PTT-GC', 'PTT Global Chemical', 'Active'),
                ('OMK', 'SUP-OMCAM', 'OMCam Co. Ltd', 'Active'),
                ('OMK', 'SUP-SICHUAN-HX', 'Sichuan HX Printing', 'Active'),
                ('OMK', 'SUP-KA-SUGAR', 'KA Sugar', 'Active'),
                ('OMK', 'SUP-LOCAL', 'Local Supplier', 'Active'),
                ('OMK', 'SUP-DONG-GUAN-FINESTAR', 'Dong Guan City Finestar', 'Active'),
                ('OMK', 'SUP-BOC-GASES', 'BOC Gases', 'Active'),
                ('OMK', 'SUP-PTT-GC', 'PTT Global Chemical', 'Active'),
                ('OFL', 'SUP-OMCAM', 'OMCam Co. Ltd', 'Active'),
                ('OFL', 'SUP-SICHUAN-HX', 'Sichuan HX Printing', 'Active'),
                ('OFL', 'SUP-KA-SUGAR', 'KA Sugar', 'Active'),
                ('OFL', 'SUP-LOCAL', 'Local Supplier', 'Active'),
                ('OFL', 'SUP-DONG-GUAN-FINESTAR', 'Dong Guan City Finestar', 'Active'),
                ('OFL', 'SUP-BOC-GASES', 'BOC Gases', 'Active'),
                ('OFL', 'SUP-PTT-GC', 'PTT Global Chemical', 'Active')
        ) AS source (business_unit, supplier_code, supplier_name, status)
        ON target.business_unit = source.business_unit
        AND target.supplier_code = source.supplier_code
        WHEN MATCHED THEN
            UPDATE SET
                target.supplier_name = source.supplier_name,
                target.status = source.status,
                target.last_modified_by = 'system',
                target.last_modified_date = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (
                business_unit,
                supplier_code,
                supplier_name,
                status,
                created_by,
                created_date
            )
            VALUES (
                source.business_unit,
                source.supplier_code,
                source.supplier_name,
                source.status,
                'system',
                GETDATE()
            );
    END;
    ELSE
    BEGIN
        PRINT 'Skipping supplier seed: inbound_supplier_master does not exist yet. Start app-prod once so JPA creates the table, then run this script again.';
    END;

    IF OBJECT_ID('inbound_uom_master', 'U') IS NOT NULL
    BEGIN
        MERGE inbound_uom_master AS target
        USING (
            VALUES
                ('OMC', 1, 'EA', 'Each', 'Active'),
                ('OMC', 2, 'PCS', 'Pieces', 'Active'),
                ('OMC', 3, 'KG', 'Kilogram', 'Active'),
                ('OMC', 4, 'G', 'Gram', 'Active'),
                ('OMC', 5, 'L', 'Liter', 'Active'),
                ('OMC', 6, 'ML', 'Milliliter', 'Active'),
                ('OMC', 7, 'BOX', 'Box', 'Active'),
                ('OMC', 8, 'CTN', 'Carton', 'Active'),
                ('OMC', 9, 'ROLL', 'Roll', 'Active'),
                ('OMC', 10, 'BAG', 'Bag', 'Active'),
                ('OMC', 11, 'PALLET', 'Pallet', 'Active'),
                ('OMC', 12, 'TANK', 'Tank', 'Active'),
                ('OML', 1, 'EA', 'Each', 'Active'),
                ('OML', 2, 'PCS', 'Pieces', 'Active'),
                ('OML', 3, 'KG', 'Kilogram', 'Active'),
                ('OML', 4, 'G', 'Gram', 'Active'),
                ('OML', 5, 'L', 'Liter', 'Active'),
                ('OML', 6, 'ML', 'Milliliter', 'Active'),
                ('OML', 7, 'BOX', 'Box', 'Active'),
                ('OML', 8, 'CTN', 'Carton', 'Active'),
                ('OML', 9, 'ROLL', 'Roll', 'Active'),
                ('OML', 10, 'BAG', 'Bag', 'Active'),
                ('OML', 11, 'PALLET', 'Pallet', 'Active'),
                ('OML', 12, 'TANK', 'Tank', 'Active'),
                ('OMK', 1, 'EA', 'Each', 'Active'),
                ('OMK', 2, 'PCS', 'Pieces', 'Active'),
                ('OMK', 3, 'KG', 'Kilogram', 'Active'),
                ('OMK', 4, 'G', 'Gram', 'Active'),
                ('OMK', 5, 'L', 'Liter', 'Active'),
                ('OMK', 6, 'ML', 'Milliliter', 'Active'),
                ('OMK', 7, 'BOX', 'Box', 'Active'),
                ('OMK', 8, 'CTN', 'Carton', 'Active'),
                ('OMK', 9, 'ROLL', 'Roll', 'Active'),
                ('OMK', 10, 'BAG', 'Bag', 'Active'),
                ('OMK', 11, 'PALLET', 'Pallet', 'Active'),
                ('OMK', 12, 'TANK', 'Tank', 'Active'),
                ('OFL', 1, 'EA', 'Each', 'Active'),
                ('OFL', 2, 'PCS', 'Pieces', 'Active'),
                ('OFL', 3, 'KG', 'Kilogram', 'Active'),
                ('OFL', 4, 'G', 'Gram', 'Active'),
                ('OFL', 5, 'L', 'Liter', 'Active'),
                ('OFL', 6, 'ML', 'Milliliter', 'Active'),
                ('OFL', 7, 'BOX', 'Box', 'Active'),
                ('OFL', 8, 'CTN', 'Carton', 'Active'),
                ('OFL', 9, 'ROLL', 'Roll', 'Active'),
                ('OFL', 10, 'BAG', 'Bag', 'Active'),
                ('OFL', 11, 'PALLET', 'Pallet', 'Active'),
                ('OFL', 12, 'TANK', 'Tank', 'Active')
        ) AS source (business_unit, uom_entry, uom_code, uom_name, status)
        ON target.business_unit = source.business_unit
        AND target.uom_code = source.uom_code
        WHEN MATCHED THEN
            UPDATE SET
                target.uom_entry = source.uom_entry,
                target.uom_name = source.uom_name,
                target.status = source.status,
                target.last_modified_by = 'system',
                target.last_modified_date = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (
                business_unit,
                uom_entry,
                uom_code,
                uom_name,
                status,
                created_by,
                created_date
            )
            VALUES (
                source.business_unit,
                source.uom_entry,
                source.uom_code,
                source.uom_name,
                source.status,
                'system',
                GETDATE()
            );
    END;
    ELSE
    BEGIN
        PRINT 'Skipping UOM seed: inbound_uom_master does not exist yet. Start app-prod once so JPA creates the table, then run this script again.';
    END;

    IF OBJECT_ID('inbound_warehouse_master', 'U') IS NOT NULL
    BEGIN
        MERGE inbound_warehouse_master AS target
        USING (
            VALUES
                ('OMC', 'WHM1', 'OMC Main Warehouse 1', 'Active'),
                ('OMC', 'WHM02', 'OMC Main Warehouse 2', 'Active'),
                ('OML', 'WHM1', 'OML Main Warehouse 1', 'Active'),
                ('OML', 'WHM02', 'OML Main Warehouse 2', 'Active'),
                ('OMK', 'WHM1', 'OMK Main Warehouse 1', 'Active'),
                ('OMK', 'WHM02', 'OMK Main Warehouse 2', 'Active'),
                ('OFL', 'WHM1', 'OFL Main Warehouse 1', 'Active'),
                ('OFL', 'WHM02', 'OFL Main Warehouse 2', 'Active')
        ) AS source (business_unit, warehouse_code, warehouse_name, status)
        ON target.business_unit = source.business_unit
        AND target.warehouse_code = source.warehouse_code
        WHEN MATCHED THEN
            UPDATE SET
                target.warehouse_name = source.warehouse_name,
                target.status = source.status,
                target.last_modified_by = 'system',
                target.last_modified_date = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (
                business_unit,
                warehouse_code,
                warehouse_name,
                status,
                created_by,
                created_date
            )
            VALUES (
                source.business_unit,
                source.warehouse_code,
                source.warehouse_name,
                source.status,
                'system',
                GETDATE()
            );
    END;

    IF OBJECT_ID('inbound_item_master', 'U') IS NOT NULL
    BEGIN
        MERGE inbound_item_master AS target
        USING (
            VALUES
                ('OMC', 'PM000023', 'PM - Preform 500ML', 'EA', 1),
                ('OMC', 'PM000004', 'PM - CAP-Normal', 'EA', 1),
                ('OMC', 'PM000012', 'PM - CAP-Press', 'EA', 1),
                ('OMC', 'PM000030', 'PM - Wrap Label 500ML', 'EA', 1),
                ('OMC', 'PM000029', 'PM - Wrap Paper Carton 500ML', 'EA', 1),
                ('OMC', 'PM000015', 'PM - Wrap Label 1L', 'EA', 1),
                ('OMC', 'PM000011', 'PM - Preform 1L', 'EA', 1),
                ('OMC', 'RM000005', 'Raw Material - Sugar', 'KG', 1),
                ('OMC', 'RM000001', 'Raw Material - Water', 'L', 1),
                ('OMC', 'RM000008', 'Raw Material - CO2', 'TANK', 1),
                ('OMC', 'RM000003', 'Raw Material - Citric Acid', 'KG', 1),
                ('OML', 'PM000023', 'PM - Preform 500ML', 'EA', 1),
                ('OML', 'PM000004', 'PM - CAP-Normal', 'EA', 1),
                ('OML', 'PM000012', 'PM - CAP-Press', 'EA', 1),
                ('OML', 'PM000030', 'PM - Wrap Label 500ML', 'EA', 1),
                ('OML', 'PM000029', 'PM - Wrap Paper Carton 500ML', 'EA', 1),
                ('OML', 'PM000015', 'PM - Wrap Label 1L', 'EA', 1),
                ('OML', 'PM000011', 'PM - Preform 1L', 'EA', 1),
                ('OML', 'RM000005', 'Raw Material - Sugar', 'KG', 1),
                ('OML', 'RM000001', 'Raw Material - Water', 'L', 1),
                ('OML', 'RM000008', 'Raw Material - CO2', 'TANK', 1),
                ('OML', 'RM000003', 'Raw Material - Citric Acid', 'KG', 1),
                ('OMK', 'PM000023', 'PM - Preform 500ML', 'EA', 1),
                ('OMK', 'PM000004', 'PM - CAP-Normal', 'EA', 1),
                ('OMK', 'PM000012', 'PM - CAP-Press', 'EA', 1),
                ('OMK', 'PM000030', 'PM - Wrap Label 500ML', 'EA', 1),
                ('OMK', 'PM000029', 'PM - Wrap Paper Carton 500ML', 'EA', 1),
                ('OMK', 'PM000015', 'PM - Wrap Label 1L', 'EA', 1),
                ('OMK', 'PM000011', 'PM - Preform 1L', 'EA', 1),
                ('OMK', 'RM000005', 'Raw Material - Sugar', 'KG', 1),
                ('OMK', 'RM000001', 'Raw Material - Water', 'L', 1),
                ('OMK', 'RM000008', 'Raw Material - CO2', 'TANK', 1),
                ('OMK', 'RM000003', 'Raw Material - Citric Acid', 'KG', 1),
                ('OFL', 'PM000023', 'PM - Preform 500ML', 'EA', 1),
                ('OFL', 'PM000004', 'PM - CAP-Normal', 'EA', 1),
                ('OFL', 'PM000012', 'PM - CAP-Press', 'EA', 1),
                ('OFL', 'PM000030', 'PM - Wrap Label 500ML', 'EA', 1),
                ('OFL', 'PM000029', 'PM - Wrap Paper Carton 500ML', 'EA', 1),
                ('OFL', 'PM000015', 'PM - Wrap Label 1L', 'EA', 1),
                ('OFL', 'PM000011', 'PM - Preform 1L', 'EA', 1),
                ('OFL', 'RM000005', 'Raw Material - Sugar', 'KG', 1),
                ('OFL', 'RM000001', 'Raw Material - Water', 'L', 1),
                ('OFL', 'RM000008', 'Raw Material - CO2', 'TANK', 1),
                ('OFL', 'RM000003', 'Raw Material - Citric Acid', 'KG', 1)
        ) AS source (business_unit, item_code, item_name, uom, is_active)
        ON target.business_unit = source.business_unit
        AND target.item_code = source.item_code
        WHEN MATCHED THEN
            UPDATE SET
                target.item_name = source.item_name,
                target.uom = source.uom,
                target.is_active = source.is_active,
                target.last_modified_by = 'system',
                target.last_modified_date = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (
                business_unit,
                item_code,
                item_name,
                uom,
                is_active,
                created_by,
                created_date
            )
            VALUES (
                source.business_unit,
                source.item_code,
                source.item_name,
                source.uom,
                source.is_active,
                'system',
                GETDATE()
            );
    END;
    ELSE
    BEGIN
        PRINT 'Skipping item seed: inbound_item_master does not exist yet. Start app-prod once so JPA creates the table, then run this script again.';
    END;
