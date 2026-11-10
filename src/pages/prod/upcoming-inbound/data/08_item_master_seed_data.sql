-- =============================================
-- ITEM MASTER SEED DATA
-- Source: 20260304120000_item_master_seed_data.xml
-- Database target: Microsoft SQL Server
-- =============================================

/*
    This script is the SQL equivalent of the Liquibase changelog.
    It seeds:
    - item_group
    - item
    - bom_item
    - child_bom_item
    - production_line

    Run only once on an empty or clean seed target.
*/

-- ===================================================================
-- Item Groups
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM item_group)
BEGIN
    INSERT INTO item_group (id, item_group_name) VALUES (1, 'Finished Goods');
    INSERT INTO item_group (id, item_group_name) VALUES (2, 'Packaging Materials');
    INSERT INTO item_group (id, item_group_name) VALUES (3, 'Raw Materials');
    INSERT INTO item_group (id, item_group_name) VALUES (4, 'Semi-Finished Goods');
    INSERT INTO item_group (id, item_group_name) VALUES (5, 'Consumables');
END;

-- ===================================================================
-- Items - Finished Goods
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM item)
BEGIN
    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000001', 'NVC Mineral Water 500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000002', 'NVC Mineral Water 1500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000003', 'NVC Sparkling Water 330ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000004', 'NVC Flavor Water Lemon 500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000005', 'NVC Flavor Water Orange 500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000006', 'NVC Mineral Water 350ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000007', 'NVC Mineral Water 5L', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000008', 'NVC Sparkling Water Lemon 330ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000009', 'NVC Sparkling Water Grape 330ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000010', 'NVC Alkaline Water 500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000011', 'NVC Alkaline Water 1500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000012', 'NVC Energy Drink 250ml', 'CAN', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000013', 'NVC Coconut Water 330ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000014', 'NVC Vitamin Water 500ml', 'BTL', 'NVC', 1, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('FG000015', 'NVC Ice Tea Peach 500ml', 'BTL', 'NVC', 1, 1, 'Y');
END;

-- ===================================================================
-- Items - Packaging Materials
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM item WHERE item_code LIKE 'PM%')
BEGIN
    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000004', 'PET Bottle 500ml', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000023', 'PET Preform 28mm', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000024', 'Cap 28mm Blue', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000029', 'Shrink Label 500ml', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000030', 'Carton Box 500ml x 24', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000031', 'PET Bottle 1500ml', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000032', 'PET Bottle 330ml', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000033', 'Cap 28mm White', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000034', 'Shrink Label 1500ml', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000035', 'Carton Box 1500ml x 12', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000036', 'Shrink Wrap Film Roll', 'ROLL', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000037', 'Pallet Stretch Film', 'ROLL', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000038', 'Aluminum Can 250ml', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000039', 'Sticker Label Round Logo', 'PCS', 'NVC', 2, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('PM000040', 'Ink Cartridge Batch Code Printer', 'PCS', 'NVC', 2, 1, 'Y');
END;

-- ===================================================================
-- Items - Raw Materials
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM item WHERE item_code LIKE 'RM%')
BEGIN
    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000001', 'Purified Water (Bulk)', 'LTR', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000002', 'Mineral Salt Compound', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000003', 'CO2 Gas Cylinder', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000004', 'Lemon Flavor Concentrate', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000005', 'Orange Flavor Concentrate', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000006', 'Sugar Syrup', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000007', 'Citric Acid Powder', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000008', 'Grape Flavor Concentrate', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000009', 'Peach Tea Extract', 'KG', 'NVC', 3, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('RM000010', 'Sodium Bicarbonate', 'KG', 'NVC', 3, 1, 'Y');
END;

-- ===================================================================
-- Semi-Finished Goods
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM item WHERE item_code LIKE 'SF%')
BEGIN
    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('SF000001', 'Blown PET Bottle 500ml', 'PCS', 'NVC', 4, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('SF000002', 'Blown PET Bottle 1500ml', 'PCS', 'NVC', 4, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('SF000003', 'Mixed Lemon Syrup Batch', 'LTR', 'NVC', 4, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('SF000004', 'Mixed Orange Syrup Batch', 'LTR', 'NVC', 4, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('SF000005', 'Carbonated Water Base', 'LTR', 'NVC', 4, 1, 'Y');
END;

-- ===================================================================
-- Consumables
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM item WHERE item_code LIKE 'CS%')
BEGIN
    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('CS000001', 'Machine Lubricant Oil', 'LTR', 'NVC', 5, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('CS000002', 'Cleaning Solvent', 'LTR', 'NVC', 5, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('CS000003', 'Conveyor Belt Segment', 'PCS', 'NVC', 5, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('CS000004', 'Filter Cartridge RO System', 'PCS', 'NVC', 5, 1, 'Y');

    INSERT INTO item (item_code, item_name, inventory_uom, tendency, item_group_id, active, invnt_item)
    VALUES ('CS000005', 'UV Lamp Replacement', 'PCS', 'NVC', 5, 1, 'Y');
END;

-- ===================================================================
-- BOM Items
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM bom_item)
BEGIN
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000001', 'NVC Mineral Water 500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000002', 'NVC Mineral Water 1500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000003', 'NVC Sparkling Water 330ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000004', 'NVC Flavor Water Lemon 500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000005', 'NVC Flavor Water Orange 500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000006', 'NVC Mineral Water 350ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000007', 'NVC Mineral Water 5L', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000008', 'NVC Sparkling Water Lemon 330ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000009', 'NVC Sparkling Water Grape 330ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000010', 'NVC Alkaline Water 500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000011', 'NVC Alkaline Water 1500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000012', 'NVC Energy Drink 250ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000013', 'NVC Coconut Water 330ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000014', 'NVC Vitamin Water 500ml', 'NVC', 1);
    INSERT INTO bom_item (product_code, product_name, tendency, active) VALUES ('FG000015', 'NVC Ice Tea Peach 500ml', 'NVC', 1);
END;

-- ===================================================================
-- Child BOM Items
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM child_bom_item)
BEGIN
    -- FG000001
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000001', 1, 'RM000001', '0.500', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000001', 2, 'RM000002', '0.003', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000001', 3, 'PM000004', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000001', 4, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000001', 5, 'PM000029', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000001', 6, 'PM000030', '0.042', 1);

    -- FG000002
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000002', 1, 'RM000001', '1.500', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000002', 2, 'RM000002', '0.008', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000002', 3, 'PM000031', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000002', 4, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000002', 5, 'PM000034', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000002', 6, 'PM000035', '0.083', 1);

    -- FG000003
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000003', 1, 'RM000001', '0.330', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000003', 2, 'RM000002', '0.002', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000003', 3, 'RM000003', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000003', 4, 'PM000032', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000003', 5, 'PM000024', '1', 1);

    -- FG000004
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 1, 'RM000001', '0.490', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 2, 'RM000004', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 3, 'RM000006', '0.025', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 4, 'RM000007', '0.001', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 5, 'PM000004', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 6, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 7, 'PM000029', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000004', 8, 'PM000030', '0.042', 1);

    -- FG000005
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 1, 'RM000001', '0.490', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 2, 'RM000005', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 3, 'RM000006', '0.025', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 4, 'RM000007', '0.001', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 5, 'PM000004', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 6, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 7, 'PM000029', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000005', 8, 'PM000030', '0.042', 1);

    -- FG000006
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000006', 1, 'RM000001', '0.350', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000006', 2, 'RM000002', '0.002', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000006', 3, 'PM000032', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000006', 4, 'PM000024', '1', 1);

    -- FG000007
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000007', 1, 'RM000001', '5.000', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000007', 2, 'RM000002', '0.025', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000007', 3, 'PM000033', '1', 1);

    -- FG000008
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000008', 1, 'RM000001', '0.320', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000008', 2, 'RM000003', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000008', 3, 'RM000004', '0.003', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000008', 4, 'RM000006', '0.015', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000008', 5, 'PM000032', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000008', 6, 'PM000024', '1', 1);

    -- FG000009
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000009', 1, 'RM000001', '0.320', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000009', 2, 'RM000003', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000009', 3, 'RM000008', '0.003', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000009', 4, 'RM000006', '0.015', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000009', 5, 'PM000032', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000009', 6, 'PM000024', '1', 1);

    -- FG000010
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 1, 'RM000001', '0.500', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 2, 'RM000002', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 3, 'RM000010', '0.002', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 4, 'PM000004', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 5, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 6, 'PM000029', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000010', 7, 'PM000030', '0.042', 1);

    -- FG000011
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 1, 'RM000001', '1.500', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 2, 'RM000002', '0.012', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 3, 'RM000010', '0.005', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 4, 'PM000031', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 5, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 6, 'PM000034', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000011', 7, 'PM000035', '0.083', 1);

    -- FG000012
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000012', 1, 'RM000001', '0.240', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000012', 2, 'RM000006', '0.030', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000012', 3, 'RM000007', '0.002', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000012', 4, 'RM000003', '0.004', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000012', 5, 'PM000038', '1', 1);

    -- FG000013
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000013', 1, 'RM000001', '0.300', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000013', 2, 'RM000006', '0.020', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000013', 3, 'PM000032', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000013', 4, 'PM000024', '1', 1);

    -- FG000014
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 1, 'RM000001', '0.490', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 2, 'RM000002', '0.003', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 3, 'RM000006', '0.010', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 4, 'PM000004', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 5, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 6, 'PM000029', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000014', 7, 'PM000030', '0.042', 1);

    -- FG000015
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 1, 'RM000001', '0.480', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 2, 'RM000009', '0.008', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 3, 'RM000006', '0.030', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 4, 'RM000007', '0.001', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 5, 'PM000004', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 6, 'PM000024', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 7, 'PM000029', '1', 1);
    INSERT INTO child_bom_item (father, child_num, code, quantity, active) VALUES ('FG000015', 8, 'PM000030', '0.042', 1);
END;

-- ===================================================================
-- Production Lines
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM production_line)
BEGIN
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-01', 'Line 1', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-02', 'Line 2', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-03', 'Line 3', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-04', 'Line 4', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-05', 'Line 5', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-06', 'Line 6', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-07', 'Production Line 07', 1);
    INSERT INTO production_line (prdcode, prdname, active) VALUES ('LINE-08', 'Production Line 08', 1);
END;
