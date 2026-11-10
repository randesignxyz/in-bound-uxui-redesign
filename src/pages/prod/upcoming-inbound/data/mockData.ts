/**
 * Mock Data for Upcoming Inbound Module
 * Generated from SQL Seed Data:
 * - 06_insert_ofl_business_unit.sql
 * - 08_item_master_seed_data.sql
 * - 09_inbound_supplier_uom_master_tables.sql
 */

import type {
  InboundSupplierMasterApi,
  InboundUomMasterApi,
  InboundWarehouseMasterApi,
  InboundItemMasterApi,
  InboundPurchaseOrderApi,
  InboundGoodsReceiptApi,
  InboundDashboardSummaryApi,
} from '../api/dto';

export const MOCK_SUPPLIERS: InboundSupplierMasterApi[] = [
  {
    "id": 1,
    "business_unit": "OMC",
    "supplier_code": "V000123",
    "supplier_name": "ABC Packaging Co., Ltd",
    "status": "Active"
  },
  {
    "id": 2,
    "business_unit": "OMC",
    "supplier_code": "V000124",
    "supplier_name": "Cambodia Raw Material Supply",
    "status": "Active"
  },
  {
    "id": 3,
    "business_unit": "OMC",
    "supplier_code": "V000125",
    "supplier_name": "Phnom Penh Label Printing",
    "status": "Active"
  },
  {
    "id": 4,
    "business_unit": "OML",
    "supplier_code": "V000223",
    "supplier_name": "Laos Packaging Partner",
    "status": "Active"
  },
  {
    "id": 5,
    "business_unit": "OML",
    "supplier_code": "V000224",
    "supplier_name": "Vientiane Raw Material Supply",
    "status": "Active"
  },
  {
    "id": 6,
    "business_unit": "OMK",
    "supplier_code": "V000323",
    "supplier_name": "Kenya Material Supply Ltd",
    "status": "Active"
  },
  {
    "id": 7,
    "business_unit": "OMK",
    "supplier_code": "V000324",
    "supplier_name": "Nairobi Packaging House",
    "status": "Active"
  },
  {
    "id": 8,
    "business_unit": "OFL",
    "supplier_code": "V000423",
    "supplier_name": "OFL Factory Local Supplier",
    "status": "Active"
  },
  {
    "id": 9,
    "business_unit": "OFL",
    "supplier_code": "V000424",
    "supplier_name": "OFL Packaging Supplier",
    "status": "Active"
  },
  {
    "id": 10,
    "business_unit": "OMC",
    "supplier_code": "SUP-OMCAM",
    "supplier_name": "OMCam Co. Ltd",
    "status": "Active"
  },
  {
    "id": 11,
    "business_unit": "OMC",
    "supplier_code": "SUP-SICHUAN-HX",
    "supplier_name": "Sichuan HX Printing",
    "status": "Active"
  },
  {
    "id": 12,
    "business_unit": "OMC",
    "supplier_code": "SUP-KA-SUGAR",
    "supplier_name": "KA Sugar",
    "status": "Active"
  },
  {
    "id": 13,
    "business_unit": "OMC",
    "supplier_code": "SUP-LOCAL",
    "supplier_name": "Local Supplier",
    "status": "Active"
  },
  {
    "id": 14,
    "business_unit": "OMC",
    "supplier_code": "SUP-DONG-GUAN-FINESTAR",
    "supplier_name": "Dong Guan City Finestar",
    "status": "Active"
  },
  {
    "id": 15,
    "business_unit": "OMC",
    "supplier_code": "SUP-BOC-GASES",
    "supplier_name": "BOC Gases",
    "status": "Active"
  },
  {
    "id": 16,
    "business_unit": "OMC",
    "supplier_code": "SUP-PTT-GC",
    "supplier_name": "PTT Global Chemical",
    "status": "Active"
  },
  {
    "id": 17,
    "business_unit": "OML",
    "supplier_code": "SUP-OMCAM",
    "supplier_name": "OMCam Co. Ltd",
    "status": "Active"
  },
  {
    "id": 18,
    "business_unit": "OML",
    "supplier_code": "SUP-SICHUAN-HX",
    "supplier_name": "Sichuan HX Printing",
    "status": "Active"
  },
  {
    "id": 19,
    "business_unit": "OML",
    "supplier_code": "SUP-KA-SUGAR",
    "supplier_name": "KA Sugar",
    "status": "Active"
  },
  {
    "id": 20,
    "business_unit": "OML",
    "supplier_code": "SUP-LOCAL",
    "supplier_name": "Local Supplier",
    "status": "Active"
  },
  {
    "id": 21,
    "business_unit": "OML",
    "supplier_code": "SUP-DONG-GUAN-FINESTAR",
    "supplier_name": "Dong Guan City Finestar",
    "status": "Active"
  },
  {
    "id": 22,
    "business_unit": "OML",
    "supplier_code": "SUP-BOC-GASES",
    "supplier_name": "BOC Gases",
    "status": "Active"
  },
  {
    "id": 23,
    "business_unit": "OML",
    "supplier_code": "SUP-PTT-GC",
    "supplier_name": "PTT Global Chemical",
    "status": "Active"
  },
  {
    "id": 24,
    "business_unit": "OMK",
    "supplier_code": "SUP-OMCAM",
    "supplier_name": "OMCam Co. Ltd",
    "status": "Active"
  },
  {
    "id": 25,
    "business_unit": "OMK",
    "supplier_code": "SUP-SICHUAN-HX",
    "supplier_name": "Sichuan HX Printing",
    "status": "Active"
  },
  {
    "id": 26,
    "business_unit": "OMK",
    "supplier_code": "SUP-KA-SUGAR",
    "supplier_name": "KA Sugar",
    "status": "Active"
  },
  {
    "id": 27,
    "business_unit": "OMK",
    "supplier_code": "SUP-LOCAL",
    "supplier_name": "Local Supplier",
    "status": "Active"
  },
  {
    "id": 28,
    "business_unit": "OMK",
    "supplier_code": "SUP-DONG-GUAN-FINESTAR",
    "supplier_name": "Dong Guan City Finestar",
    "status": "Active"
  },
  {
    "id": 29,
    "business_unit": "OMK",
    "supplier_code": "SUP-BOC-GASES",
    "supplier_name": "BOC Gases",
    "status": "Active"
  },
  {
    "id": 30,
    "business_unit": "OMK",
    "supplier_code": "SUP-PTT-GC",
    "supplier_name": "PTT Global Chemical",
    "status": "Active"
  },
  {
    "id": 31,
    "business_unit": "OFL",
    "supplier_code": "SUP-OMCAM",
    "supplier_name": "OMCam Co. Ltd",
    "status": "Active"
  },
  {
    "id": 32,
    "business_unit": "OFL",
    "supplier_code": "SUP-SICHUAN-HX",
    "supplier_name": "Sichuan HX Printing",
    "status": "Active"
  },
  {
    "id": 33,
    "business_unit": "OFL",
    "supplier_code": "SUP-KA-SUGAR",
    "supplier_name": "KA Sugar",
    "status": "Active"
  },
  {
    "id": 34,
    "business_unit": "OFL",
    "supplier_code": "SUP-LOCAL",
    "supplier_name": "Local Supplier",
    "status": "Active"
  },
  {
    "id": 35,
    "business_unit": "OFL",
    "supplier_code": "SUP-DONG-GUAN-FINESTAR",
    "supplier_name": "Dong Guan City Finestar",
    "status": "Active"
  },
  {
    "id": 36,
    "business_unit": "OFL",
    "supplier_code": "SUP-BOC-GASES",
    "supplier_name": "BOC Gases",
    "status": "Active"
  },
  {
    "id": 37,
    "business_unit": "OFL",
    "supplier_code": "SUP-PTT-GC",
    "supplier_name": "PTT Global Chemical",
    "status": "Active"
  }
];

export const MOCK_UOMS: InboundUomMasterApi[] = [
  {
    "id": 1,
    "business_unit": "OMC",
    "uom_entry": 1,
    "uom_code": "EA",
    "uom_name": "Each",
    "status": "Active"
  },
  {
    "id": 2,
    "business_unit": "OMC",
    "uom_entry": 2,
    "uom_code": "PCS",
    "uom_name": "Pieces",
    "status": "Active"
  },
  {
    "id": 3,
    "business_unit": "OMC",
    "uom_entry": 3,
    "uom_code": "KG",
    "uom_name": "Kilogram",
    "status": "Active"
  },
  {
    "id": 4,
    "business_unit": "OMC",
    "uom_entry": 4,
    "uom_code": "G",
    "uom_name": "Gram",
    "status": "Active"
  },
  {
    "id": 5,
    "business_unit": "OMC",
    "uom_entry": 5,
    "uom_code": "L",
    "uom_name": "Liter",
    "status": "Active"
  },
  {
    "id": 6,
    "business_unit": "OMC",
    "uom_entry": 6,
    "uom_code": "ML",
    "uom_name": "Milliliter",
    "status": "Active"
  },
  {
    "id": 7,
    "business_unit": "OMC",
    "uom_entry": 7,
    "uom_code": "BOX",
    "uom_name": "Box",
    "status": "Active"
  },
  {
    "id": 8,
    "business_unit": "OMC",
    "uom_entry": 8,
    "uom_code": "CTN",
    "uom_name": "Carton",
    "status": "Active"
  },
  {
    "id": 9,
    "business_unit": "OMC",
    "uom_entry": 9,
    "uom_code": "ROLL",
    "uom_name": "Roll",
    "status": "Active"
  },
  {
    "id": 10,
    "business_unit": "OMC",
    "uom_entry": 10,
    "uom_code": "BAG",
    "uom_name": "Bag",
    "status": "Active"
  },
  {
    "id": 11,
    "business_unit": "OMC",
    "uom_entry": 11,
    "uom_code": "PALLET",
    "uom_name": "Pallet",
    "status": "Active"
  },
  {
    "id": 12,
    "business_unit": "OMC",
    "uom_entry": 12,
    "uom_code": "TANK",
    "uom_name": "Tank",
    "status": "Active"
  },
  {
    "id": 13,
    "business_unit": "OML",
    "uom_entry": 1,
    "uom_code": "EA",
    "uom_name": "Each",
    "status": "Active"
  },
  {
    "id": 14,
    "business_unit": "OML",
    "uom_entry": 2,
    "uom_code": "PCS",
    "uom_name": "Pieces",
    "status": "Active"
  },
  {
    "id": 15,
    "business_unit": "OML",
    "uom_entry": 3,
    "uom_code": "KG",
    "uom_name": "Kilogram",
    "status": "Active"
  },
  {
    "id": 16,
    "business_unit": "OML",
    "uom_entry": 4,
    "uom_code": "G",
    "uom_name": "Gram",
    "status": "Active"
  },
  {
    "id": 17,
    "business_unit": "OML",
    "uom_entry": 5,
    "uom_code": "L",
    "uom_name": "Liter",
    "status": "Active"
  },
  {
    "id": 18,
    "business_unit": "OML",
    "uom_entry": 6,
    "uom_code": "ML",
    "uom_name": "Milliliter",
    "status": "Active"
  },
  {
    "id": 19,
    "business_unit": "OML",
    "uom_entry": 7,
    "uom_code": "BOX",
    "uom_name": "Box",
    "status": "Active"
  },
  {
    "id": 20,
    "business_unit": "OML",
    "uom_entry": 8,
    "uom_code": "CTN",
    "uom_name": "Carton",
    "status": "Active"
  },
  {
    "id": 21,
    "business_unit": "OML",
    "uom_entry": 9,
    "uom_code": "ROLL",
    "uom_name": "Roll",
    "status": "Active"
  },
  {
    "id": 22,
    "business_unit": "OML",
    "uom_entry": 10,
    "uom_code": "BAG",
    "uom_name": "Bag",
    "status": "Active"
  },
  {
    "id": 23,
    "business_unit": "OML",
    "uom_entry": 11,
    "uom_code": "PALLET",
    "uom_name": "Pallet",
    "status": "Active"
  },
  {
    "id": 24,
    "business_unit": "OML",
    "uom_entry": 12,
    "uom_code": "TANK",
    "uom_name": "Tank",
    "status": "Active"
  },
  {
    "id": 25,
    "business_unit": "OMK",
    "uom_entry": 1,
    "uom_code": "EA",
    "uom_name": "Each",
    "status": "Active"
  },
  {
    "id": 26,
    "business_unit": "OMK",
    "uom_entry": 2,
    "uom_code": "PCS",
    "uom_name": "Pieces",
    "status": "Active"
  },
  {
    "id": 27,
    "business_unit": "OMK",
    "uom_entry": 3,
    "uom_code": "KG",
    "uom_name": "Kilogram",
    "status": "Active"
  },
  {
    "id": 28,
    "business_unit": "OMK",
    "uom_entry": 4,
    "uom_code": "G",
    "uom_name": "Gram",
    "status": "Active"
  },
  {
    "id": 29,
    "business_unit": "OMK",
    "uom_entry": 5,
    "uom_code": "L",
    "uom_name": "Liter",
    "status": "Active"
  },
  {
    "id": 30,
    "business_unit": "OMK",
    "uom_entry": 6,
    "uom_code": "ML",
    "uom_name": "Milliliter",
    "status": "Active"
  },
  {
    "id": 31,
    "business_unit": "OMK",
    "uom_entry": 7,
    "uom_code": "BOX",
    "uom_name": "Box",
    "status": "Active"
  },
  {
    "id": 32,
    "business_unit": "OMK",
    "uom_entry": 8,
    "uom_code": "CTN",
    "uom_name": "Carton",
    "status": "Active"
  },
  {
    "id": 33,
    "business_unit": "OMK",
    "uom_entry": 9,
    "uom_code": "ROLL",
    "uom_name": "Roll",
    "status": "Active"
  },
  {
    "id": 34,
    "business_unit": "OMK",
    "uom_entry": 10,
    "uom_code": "BAG",
    "uom_name": "Bag",
    "status": "Active"
  },
  {
    "id": 35,
    "business_unit": "OMK",
    "uom_entry": 11,
    "uom_code": "PALLET",
    "uom_name": "Pallet",
    "status": "Active"
  },
  {
    "id": 36,
    "business_unit": "OMK",
    "uom_entry": 12,
    "uom_code": "TANK",
    "uom_name": "Tank",
    "status": "Active"
  },
  {
    "id": 37,
    "business_unit": "OFL",
    "uom_entry": 1,
    "uom_code": "EA",
    "uom_name": "Each",
    "status": "Active"
  },
  {
    "id": 38,
    "business_unit": "OFL",
    "uom_entry": 2,
    "uom_code": "PCS",
    "uom_name": "Pieces",
    "status": "Active"
  },
  {
    "id": 39,
    "business_unit": "OFL",
    "uom_entry": 3,
    "uom_code": "KG",
    "uom_name": "Kilogram",
    "status": "Active"
  },
  {
    "id": 40,
    "business_unit": "OFL",
    "uom_entry": 4,
    "uom_code": "G",
    "uom_name": "Gram",
    "status": "Active"
  },
  {
    "id": 41,
    "business_unit": "OFL",
    "uom_entry": 5,
    "uom_code": "L",
    "uom_name": "Liter",
    "status": "Active"
  },
  {
    "id": 42,
    "business_unit": "OFL",
    "uom_entry": 6,
    "uom_code": "ML",
    "uom_name": "Milliliter",
    "status": "Active"
  },
  {
    "id": 43,
    "business_unit": "OFL",
    "uom_entry": 7,
    "uom_code": "BOX",
    "uom_name": "Box",
    "status": "Active"
  },
  {
    "id": 44,
    "business_unit": "OFL",
    "uom_entry": 8,
    "uom_code": "CTN",
    "uom_name": "Carton",
    "status": "Active"
  },
  {
    "id": 45,
    "business_unit": "OFL",
    "uom_entry": 9,
    "uom_code": "ROLL",
    "uom_name": "Roll",
    "status": "Active"
  },
  {
    "id": 46,
    "business_unit": "OFL",
    "uom_entry": 10,
    "uom_code": "BAG",
    "uom_name": "Bag",
    "status": "Active"
  },
  {
    "id": 47,
    "business_unit": "OFL",
    "uom_entry": 11,
    "uom_code": "PALLET",
    "uom_name": "Pallet",
    "status": "Active"
  },
  {
    "id": 48,
    "business_unit": "OFL",
    "uom_entry": 12,
    "uom_code": "TANK",
    "uom_name": "Tank",
    "status": "Active"
  }
];

export const MOCK_WAREHOUSES: InboundWarehouseMasterApi[] = [
  {
    "id": 1,
    "business_unit": "OMC",
    "warehouse_code": "WHM1",
    "warehouse_name": "OMC Main Warehouse 1",
    "status": "Active"
  },
  {
    "id": 2,
    "business_unit": "OMC",
    "warehouse_code": "WHM02",
    "warehouse_name": "OMC Main Warehouse 2",
    "status": "Active"
  },
  {
    "id": 3,
    "business_unit": "OML",
    "warehouse_code": "WHM1",
    "warehouse_name": "OML Main Warehouse 1",
    "status": "Active"
  },
  {
    "id": 4,
    "business_unit": "OML",
    "warehouse_code": "WHM02",
    "warehouse_name": "OML Main Warehouse 2",
    "status": "Active"
  },
  {
    "id": 5,
    "business_unit": "OMK",
    "warehouse_code": "WHM1",
    "warehouse_name": "OMK Main Warehouse 1",
    "status": "Active"
  },
  {
    "id": 6,
    "business_unit": "OMK",
    "warehouse_code": "WHM02",
    "warehouse_name": "OMK Main Warehouse 2",
    "status": "Active"
  },
  {
    "id": 7,
    "business_unit": "OFL",
    "warehouse_code": "WHM1",
    "warehouse_name": "OFL Main Warehouse 1",
    "status": "Active"
  },
  {
    "id": 8,
    "business_unit": "OFL",
    "warehouse_code": "WHM02",
    "warehouse_name": "OFL Main Warehouse 2",
    "status": "Active"
  }
];

export const MOCK_ITEMS: InboundItemMasterApi[] = [
  {
    "id": 1,
    "business_unit": "OMC",
    "item_code": "PM000023",
    "item_name": "PM - Preform 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 2,
    "business_unit": "OMC",
    "item_code": "PM000004",
    "item_name": "PM - CAP-Normal",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 3,
    "business_unit": "OMC",
    "item_code": "PM000012",
    "item_name": "PM - CAP-Press",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 4,
    "business_unit": "OMC",
    "item_code": "PM000030",
    "item_name": "PM - Wrap Label 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 5,
    "business_unit": "OMC",
    "item_code": "PM000029",
    "item_name": "PM - Wrap Paper Carton 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 6,
    "business_unit": "OMC",
    "item_code": "PM000015",
    "item_name": "PM - Wrap Label 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 7,
    "business_unit": "OMC",
    "item_code": "PM000011",
    "item_name": "PM - Preform 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 8,
    "business_unit": "OMC",
    "item_code": "RM000005",
    "item_name": "Raw Material - Sugar",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 9,
    "business_unit": "OMC",
    "item_code": "RM000001",
    "item_name": "Raw Material - Water",
    "uom": "L",
    "is_active": true
  },
  {
    "id": 10,
    "business_unit": "OMC",
    "item_code": "RM000008",
    "item_name": "Raw Material - CO2",
    "uom": "TANK",
    "is_active": true
  },
  {
    "id": 11,
    "business_unit": "OMC",
    "item_code": "RM000003",
    "item_name": "Raw Material - Citric Acid",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 12,
    "business_unit": "OML",
    "item_code": "PM000023",
    "item_name": "PM - Preform 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 13,
    "business_unit": "OML",
    "item_code": "PM000004",
    "item_name": "PM - CAP-Normal",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 14,
    "business_unit": "OML",
    "item_code": "PM000012",
    "item_name": "PM - CAP-Press",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 15,
    "business_unit": "OML",
    "item_code": "PM000030",
    "item_name": "PM - Wrap Label 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 16,
    "business_unit": "OML",
    "item_code": "PM000029",
    "item_name": "PM - Wrap Paper Carton 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 17,
    "business_unit": "OML",
    "item_code": "PM000015",
    "item_name": "PM - Wrap Label 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 18,
    "business_unit": "OML",
    "item_code": "PM000011",
    "item_name": "PM - Preform 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 19,
    "business_unit": "OML",
    "item_code": "RM000005",
    "item_name": "Raw Material - Sugar",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 20,
    "business_unit": "OML",
    "item_code": "RM000001",
    "item_name": "Raw Material - Water",
    "uom": "L",
    "is_active": true
  },
  {
    "id": 21,
    "business_unit": "OML",
    "item_code": "RM000008",
    "item_name": "Raw Material - CO2",
    "uom": "TANK",
    "is_active": true
  },
  {
    "id": 22,
    "business_unit": "OML",
    "item_code": "RM000003",
    "item_name": "Raw Material - Citric Acid",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 23,
    "business_unit": "OMK",
    "item_code": "PM000023",
    "item_name": "PM - Preform 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 24,
    "business_unit": "OMK",
    "item_code": "PM000004",
    "item_name": "PM - CAP-Normal",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 25,
    "business_unit": "OMK",
    "item_code": "PM000012",
    "item_name": "PM - CAP-Press",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 26,
    "business_unit": "OMK",
    "item_code": "PM000030",
    "item_name": "PM - Wrap Label 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 27,
    "business_unit": "OMK",
    "item_code": "PM000029",
    "item_name": "PM - Wrap Paper Carton 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 28,
    "business_unit": "OMK",
    "item_code": "PM000015",
    "item_name": "PM - Wrap Label 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 29,
    "business_unit": "OMK",
    "item_code": "PM000011",
    "item_name": "PM - Preform 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 30,
    "business_unit": "OMK",
    "item_code": "RM000005",
    "item_name": "Raw Material - Sugar",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 31,
    "business_unit": "OMK",
    "item_code": "RM000001",
    "item_name": "Raw Material - Water",
    "uom": "L",
    "is_active": true
  },
  {
    "id": 32,
    "business_unit": "OMK",
    "item_code": "RM000008",
    "item_name": "Raw Material - CO2",
    "uom": "TANK",
    "is_active": true
  },
  {
    "id": 33,
    "business_unit": "OMK",
    "item_code": "RM000003",
    "item_name": "Raw Material - Citric Acid",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 34,
    "business_unit": "OFL",
    "item_code": "PM000023",
    "item_name": "PM - Preform 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 35,
    "business_unit": "OFL",
    "item_code": "PM000004",
    "item_name": "PM - CAP-Normal",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 36,
    "business_unit": "OFL",
    "item_code": "PM000012",
    "item_name": "PM - CAP-Press",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 37,
    "business_unit": "OFL",
    "item_code": "PM000030",
    "item_name": "PM - Wrap Label 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 38,
    "business_unit": "OFL",
    "item_code": "PM000029",
    "item_name": "PM - Wrap Paper Carton 500ML",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 39,
    "business_unit": "OFL",
    "item_code": "PM000015",
    "item_name": "PM - Wrap Label 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 40,
    "business_unit": "OFL",
    "item_code": "PM000011",
    "item_name": "PM - Preform 1L",
    "uom": "EA",
    "is_active": true
  },
  {
    "id": 41,
    "business_unit": "OFL",
    "item_code": "RM000005",
    "item_name": "Raw Material - Sugar",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 42,
    "business_unit": "OFL",
    "item_code": "RM000001",
    "item_name": "Raw Material - Water",
    "uom": "L",
    "is_active": true
  },
  {
    "id": 43,
    "business_unit": "OFL",
    "item_code": "RM000008",
    "item_name": "Raw Material - CO2",
    "uom": "TANK",
    "is_active": true
  },
  {
    "id": 44,
    "business_unit": "OFL",
    "item_code": "RM000003",
    "item_name": "Raw Material - Citric Acid",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 45,
    "business_unit": "NVC",
    "item_code": "FG000001",
    "item_name": "NVC Mineral Water 500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 46,
    "business_unit": "NVC",
    "item_code": "FG000002",
    "item_name": "NVC Mineral Water 1500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 47,
    "business_unit": "NVC",
    "item_code": "FG000003",
    "item_name": "NVC Sparkling Water 330ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 48,
    "business_unit": "NVC",
    "item_code": "FG000004",
    "item_name": "NVC Flavor Water Lemon 500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 49,
    "business_unit": "NVC",
    "item_code": "FG000005",
    "item_name": "NVC Flavor Water Orange 500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 50,
    "business_unit": "NVC",
    "item_code": "FG000006",
    "item_name": "NVC Mineral Water 350ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 51,
    "business_unit": "NVC",
    "item_code": "FG000007",
    "item_name": "NVC Mineral Water 5L",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 52,
    "business_unit": "NVC",
    "item_code": "FG000008",
    "item_name": "NVC Sparkling Water Lemon 330ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 53,
    "business_unit": "NVC",
    "item_code": "FG000009",
    "item_name": "NVC Sparkling Water Grape 330ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 54,
    "business_unit": "NVC",
    "item_code": "FG000010",
    "item_name": "NVC Alkaline Water 500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 55,
    "business_unit": "NVC",
    "item_code": "FG000011",
    "item_name": "NVC Alkaline Water 1500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 56,
    "business_unit": "NVC",
    "item_code": "FG000012",
    "item_name": "NVC Energy Drink 250ml",
    "uom": "CAN",
    "is_active": true
  },
  {
    "id": 57,
    "business_unit": "NVC",
    "item_code": "FG000013",
    "item_name": "NVC Coconut Water 330ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 58,
    "business_unit": "NVC",
    "item_code": "FG000014",
    "item_name": "NVC Vitamin Water 500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 59,
    "business_unit": "NVC",
    "item_code": "FG000015",
    "item_name": "NVC Ice Tea Peach 500ml",
    "uom": "BTL",
    "is_active": true
  },
  {
    "id": 60,
    "business_unit": "NVC",
    "item_code": "PM000004",
    "item_name": "PET Bottle 500ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 61,
    "business_unit": "NVC",
    "item_code": "PM000023",
    "item_name": "PET Preform 28mm",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 62,
    "business_unit": "NVC",
    "item_code": "PM000024",
    "item_name": "Cap 28mm Blue",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 63,
    "business_unit": "NVC",
    "item_code": "PM000029",
    "item_name": "Shrink Label 500ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 64,
    "business_unit": "NVC",
    "item_code": "PM000030",
    "item_name": "Carton Box 500ml x 24",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 65,
    "business_unit": "NVC",
    "item_code": "PM000031",
    "item_name": "PET Bottle 1500ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 66,
    "business_unit": "NVC",
    "item_code": "PM000032",
    "item_name": "PET Bottle 330ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 67,
    "business_unit": "NVC",
    "item_code": "PM000033",
    "item_name": "Cap 28mm White",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 68,
    "business_unit": "NVC",
    "item_code": "PM000034",
    "item_name": "Shrink Label 1500ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 69,
    "business_unit": "NVC",
    "item_code": "PM000035",
    "item_name": "Carton Box 1500ml x 12",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 70,
    "business_unit": "NVC",
    "item_code": "PM000036",
    "item_name": "Shrink Wrap Film Roll",
    "uom": "ROLL",
    "is_active": true
  },
  {
    "id": 71,
    "business_unit": "NVC",
    "item_code": "PM000037",
    "item_name": "Pallet Stretch Film",
    "uom": "ROLL",
    "is_active": true
  },
  {
    "id": 72,
    "business_unit": "NVC",
    "item_code": "PM000038",
    "item_name": "Aluminum Can 250ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 73,
    "business_unit": "NVC",
    "item_code": "PM000039",
    "item_name": "Sticker Label Round Logo",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 74,
    "business_unit": "NVC",
    "item_code": "PM000040",
    "item_name": "Ink Cartridge Batch Code Printer",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 75,
    "business_unit": "NVC",
    "item_code": "RM000002",
    "item_name": "Mineral Salt Compound",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 76,
    "business_unit": "NVC",
    "item_code": "RM000003",
    "item_name": "CO2 Gas Cylinder",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 77,
    "business_unit": "NVC",
    "item_code": "RM000004",
    "item_name": "Lemon Flavor Concentrate",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 78,
    "business_unit": "NVC",
    "item_code": "RM000005",
    "item_name": "Orange Flavor Concentrate",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 79,
    "business_unit": "NVC",
    "item_code": "RM000006",
    "item_name": "Sugar Syrup",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 80,
    "business_unit": "NVC",
    "item_code": "RM000007",
    "item_name": "Citric Acid Powder",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 81,
    "business_unit": "NVC",
    "item_code": "RM000008",
    "item_name": "Grape Flavor Concentrate",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 82,
    "business_unit": "NVC",
    "item_code": "RM000009",
    "item_name": "Peach Tea Extract",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 83,
    "business_unit": "NVC",
    "item_code": "RM000010",
    "item_name": "Sodium Bicarbonate",
    "uom": "KG",
    "is_active": true
  },
  {
    "id": 84,
    "business_unit": "NVC",
    "item_code": "SF000001",
    "item_name": "Blown PET Bottle 500ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 85,
    "business_unit": "NVC",
    "item_code": "SF000002",
    "item_name": "Blown PET Bottle 1500ml",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 86,
    "business_unit": "NVC",
    "item_code": "SF000003",
    "item_name": "Mixed Lemon Syrup Batch",
    "uom": "LTR",
    "is_active": true
  },
  {
    "id": 87,
    "business_unit": "NVC",
    "item_code": "SF000004",
    "item_name": "Mixed Orange Syrup Batch",
    "uom": "LTR",
    "is_active": true
  },
  {
    "id": 88,
    "business_unit": "NVC",
    "item_code": "SF000005",
    "item_name": "Carbonated Water Base",
    "uom": "LTR",
    "is_active": true
  },
  {
    "id": 89,
    "business_unit": "NVC",
    "item_code": "CS000001",
    "item_name": "Machine Lubricant Oil",
    "uom": "LTR",
    "is_active": true
  },
  {
    "id": 90,
    "business_unit": "NVC",
    "item_code": "CS000002",
    "item_name": "Cleaning Solvent",
    "uom": "LTR",
    "is_active": true
  },
  {
    "id": 91,
    "business_unit": "NVC",
    "item_code": "CS000003",
    "item_name": "Conveyor Belt Segment",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 92,
    "business_unit": "NVC",
    "item_code": "CS000004",
    "item_name": "Filter Cartridge RO System",
    "uom": "PCS",
    "is_active": true
  },
  {
    "id": 93,
    "business_unit": "NVC",
    "item_code": "CS000005",
    "item_name": "UV Lamp Replacement",
    "uom": "PCS",
    "is_active": true
  }
];

export const MOCK_PURCHASE_ORDERS: InboundPurchaseOrderApi[] = [
  {
    "id": 1,
    "business_unit": "OFL",
    "po_number": "PO-2026-0892",
    "sap_doc_entry": 1000,
    "sap_doc_num": "SAP-2026-0892",
    "supplier": "OMCam Co. Ltd",
    "expected_date": "2026-03-06",
    "expected_time": "10:00",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0810",
    "items": [
      {
        "lineNumber": 1,
        "code": "PM000023",
        "name": "PM - Preform 500ML",
        "poQty": 50000,
        "receivedQty": 0,
        "remainingQty": 50000,
        "uom": "EA",
        "warehouseCode": "WHM1",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      },
      {
        "lineNumber": 2,
        "code": "PM000004",
        "name": "PM - CAP-Normal",
        "poQty": 50000,
        "receivedQty": 0,
        "remainingQty": 50000,
        "uom": "EA",
        "warehouseCode": "WHM1",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      },
      {
        "lineNumber": 3,
        "code": "PM000012",
        "name": "PM - CAP-Press",
        "poQty": 20000,
        "receivedQty": 0,
        "remainingQty": 20000,
        "uom": "EA",
        "warehouseCode": "WHM1",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      },
      {
        "lineNumber": 4,
        "code": "PM000030",
        "name": "PM - Wrap Label 500ML",
        "poQty": 30000,
        "receivedQty": 0,
        "remainingQty": 30000,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      },
      {
        "lineNumber": 5,
        "code": "PM000029",
        "name": "PM - Wrap Paper Carton 500ML",
        "poQty": 7200,
        "receivedQty": 0,
        "remainingQty": 7200,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      }
    ],
    "total_items": 5,
    "total_qty": 157200,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0410",
        "pr_doc_entry": "410",
        "pr_doc_num": "20260410",
        "pr_uuid": "6ab615e6-1942-11f1-a4ce-005056874e4b"
      },
      {
        "pr_number": "PR-2026-0411",
        "pr_doc_entry": "411",
        "pr_doc_num": "20260411",
        "pr_uuid": "6ab615e7-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 2,
    "business_unit": "OFL",
    "po_number": "PO-2026-0893",
    "sap_doc_entry": 1001,
    "sap_doc_num": "SAP-2026-0893",
    "supplier": "Sichuan HX Printing",
    "expected_date": "2026-03-06",
    "expected_time": "14:00",
    "receiver_warehouse": "WHM02",
    "delivery_note_number": "DN-2026-0811",
    "items": [
      {
        "lineNumber": 1,
        "code": "PM000030",
        "name": "PM - Wrap Label 500ML",
        "poQty": 200000,
        "receivedQty": 0,
        "remainingQty": 200000,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "Sichuan HX Printing",
        "isAging": false
      },
      {
        "lineNumber": 2,
        "code": "PM000015",
        "name": "PM - Wrap Label 1L",
        "poQty": 5000,
        "receivedQty": 0,
        "remainingQty": 5000,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "Sichuan HX Printing",
        "isAging": false
      }
    ],
    "total_items": 2,
    "total_qty": 205000,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0412",
        "pr_doc_entry": "412",
        "pr_doc_num": "20260412",
        "pr_uuid": "6ab615e8-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 3,
    "business_unit": "OFL",
    "po_number": "PO-2026-0894",
    "sap_doc_entry": 1002,
    "sap_doc_num": "SAP-2026-0894",
    "supplier": "KA Sugar",
    "expected_date": "2026-03-06",
    "expected_time": "11:30",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0812",
    "items": [
      {
        "lineNumber": 1,
        "code": "RM000005",
        "name": "Raw Material - Sugar",
        "poQty": 8000,
        "receivedQty": 0,
        "remainingQty": 8000,
        "uom": "KG",
        "warehouseCode": "WHM1",
        "supplier": "KA Sugar",
        "isAging": false
      }
    ],
    "total_items": 1,
    "total_qty": 8000,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0413",
        "pr_doc_entry": "413",
        "pr_doc_num": "20260413",
        "pr_uuid": "6ab615e9-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 4,
    "business_unit": "OFL",
    "po_number": "PO-2026-0888",
    "sap_doc_entry": 1003,
    "sap_doc_num": "SAP-2026-0888",
    "supplier": "OMCam Co. Ltd",
    "expected_date": "2026-03-06",
    "expected_time": "09:00",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0813",
    "items": [
      {
        "lineNumber": 1,
        "code": "PM000012",
        "name": "PM - CAP-Press",
        "poQty": 100000,
        "receivedQty": 60000,
        "remainingQty": 40000,
        "uom": "EA",
        "warehouseCode": "WHM1",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      },
      {
        "lineNumber": 2,
        "code": "PM000004",
        "name": "PM - CAP-Normal",
        "poQty": 80000,
        "receivedQty": 35000,
        "remainingQty": 45000,
        "uom": "EA",
        "warehouseCode": "WHM1",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      }
    ],
    "total_items": 2,
    "total_qty": 180000,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0408",
        "pr_doc_entry": "408",
        "pr_doc_num": "20260408",
        "pr_uuid": "6ab615ea-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": [
      {
        "receipt_id": 101,
        "receiving_number": "GR-2026-0001",
        "status_label": "Approved",
        "received_by": "Warehouse Staff",
        "received_at": "2026-03-05 14:30",
        "total_received_qty": 95000,
        "received_items": [
          {
            "code": "PM000012",
            "name": "PM - CAP-Press",
            "qty": 60000
          },
          {
            "code": "PM000004",
            "name": "PM - CAP-Normal",
            "qty": 35000
          }
        ],
        "approved_items": [
          {
            "code": "PM000012",
            "name": "PM - CAP-Press",
            "qty": 60000
          },
          {
            "code": "PM000004",
            "name": "PM - CAP-Normal",
            "qty": 35000
          }
        ],
        "rejected_items": []
      }
    ]
  },
  {
    "id": 5,
    "business_unit": "OFL",
    "po_number": "PO-2026-0890",
    "sap_doc_entry": 1004,
    "sap_doc_num": "SAP-2026-0890",
    "supplier": "Local Supplier",
    "expected_date": "2026-03-07",
    "expected_time": "15:00",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0814",
    "items": [
      {
        "lineNumber": 1,
        "code": "RM000001",
        "name": "Raw Material - Water",
        "poQty": 20000,
        "receivedQty": 0,
        "remainingQty": 20000,
        "uom": "L",
        "warehouseCode": "WHM1",
        "supplier": "Local Supplier",
        "isAging": false
      }
    ],
    "total_items": 1,
    "total_qty": 20000,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0409",
        "pr_doc_entry": "409",
        "pr_doc_num": "20260409",
        "pr_uuid": "6ab615eb-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 6,
    "business_unit": "OFL",
    "po_number": "PO-2026-0895",
    "sap_doc_entry": 1005,
    "sap_doc_num": "SAP-2026-0895",
    "supplier": "Dong Guan City Finestar",
    "expected_date": "2026-03-07",
    "expected_time": "09:00",
    "receiver_warehouse": "WHM02",
    "delivery_note_number": "DN-2026-0815",
    "items": [
      {
        "lineNumber": 1,
        "code": "PM000029",
        "name": "PM - Wrap Paper Carton 500ML",
        "poQty": 14400,
        "receivedQty": 0,
        "remainingQty": 14400,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "Dong Guan City Finestar",
        "isAging": false
      },
      {
        "lineNumber": 2,
        "code": "PM000011",
        "name": "PM - Preform 1L",
        "poQty": 3000,
        "receivedQty": 0,
        "remainingQty": 3000,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "Dong Guan City Finestar",
        "isAging": false
      }
    ],
    "total_items": 2,
    "total_qty": 17400,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0414",
        "pr_doc_entry": "414",
        "pr_doc_num": "20260414",
        "pr_uuid": "6ab615ec-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 7,
    "business_unit": "OFL",
    "po_number": "PO-2026-0896",
    "sap_doc_entry": 1006,
    "sap_doc_num": "SAP-2026-0896",
    "supplier": "BOC Gases",
    "expected_date": "2026-03-07",
    "expected_time": "10:30",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0816",
    "items": [
      {
        "lineNumber": 1,
        "code": "RM000008",
        "name": "Raw Material - CO2",
        "poQty": 200,
        "receivedQty": 0,
        "remainingQty": 200,
        "uom": "TANK",
        "warehouseCode": "WHM1",
        "supplier": "BOC Gases",
        "isAging": false
      }
    ],
    "total_items": 1,
    "total_qty": 200,
    "type": "Planned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0415",
        "pr_doc_entry": "415",
        "pr_doc_num": "20260415",
        "pr_uuid": "6ab615ed-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 8,
    "business_unit": "OFL",
    "po_number": "PO-2026-0898",
    "sap_doc_entry": 1007,
    "sap_doc_num": "SAP-2026-0898",
    "supplier": "PTT Global Chemical",
    "expected_date": "2026-03-08",
    "expected_time": "10:00",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0817",
    "items": [
      {
        "lineNumber": 1,
        "code": "RM000003",
        "name": "Raw Material - Citric Acid",
        "poQty": 500,
        "receivedQty": 0,
        "remainingQty": 500,
        "uom": "KG",
        "warehouseCode": "WHM1",
        "supplier": "PTT Global Chemical",
        "isAging": false
      }
    ],
    "total_items": 1,
    "total_qty": 500,
    "type": "Unplanned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0416",
        "pr_doc_entry": "416",
        "pr_doc_num": "20260416",
        "pr_uuid": "6ab615ee-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  },
  {
    "id": 9,
    "business_unit": "OFL",
    "po_number": "PO-2026-0899",
    "sap_doc_entry": 1008,
    "sap_doc_num": "SAP-2026-0899",
    "supplier": "OMCam Co. Ltd",
    "expected_date": "2026-03-08",
    "expected_time": "10:00",
    "receiver_warehouse": "WHM02",
    "delivery_note_number": "DN-2026-0818",
    "items": [
      {
        "lineNumber": 1,
        "code": "PM000011",
        "name": "PM - Preform 1L",
        "poQty": 3000,
        "receivedQty": 0,
        "remainingQty": 3000,
        "uom": "EA",
        "warehouseCode": "WHM02",
        "supplier": "OMCam Co. Ltd",
        "isAging": false
      }
    ],
    "total_items": 1,
    "total_qty": 3000,
    "type": "Unplanned",
    "doc_status": "Open",
    "pr_links": [
      {
        "pr_number": "PR-2026-0417",
        "pr_doc_entry": "417",
        "pr_doc_num": "20260417",
        "pr_uuid": "6ab615ef-1942-11f1-a4ce-005056874e4b"
      }
    ],
    "receipt_logs": []
  }
];

export const MOCK_GOODS_RECEIPTS: InboundGoodsReceiptApi[] = [
  {
    "id": 1,
    "receiving_number": "GR-2026-0001",
    "po_number": "PO-2026-0888",
    "business_unit": "OFL",
    "supplier": "OMCam Co. Ltd",
    "received_date": "2026-03-05",
    "received_time": "14:30",
    "receiver_warehouse": "WHM1",
    "delivery_note_number": "DN-2026-0810",
    "status": "APPROVED",
    "status_label": "Approved",
    "qc_status": "PASSED",
    "qc_by": "QC Inspector",
    "qc_at": "2026-03-05 15:10",
    "received_by": "Warehouse Staff",
    "total_items": 2,
    "items": [
      {
        "id": 1,
        "code": "PM000012",
        "name": "PM - CAP-Press",
        "receiveQty": 60000,
        "poQty": 60000,
        "condition": "Good",
        "isMissing": false,
        "uom": "EA",
        "qcDecision": "Pass"
      },
      {
        "id": 2,
        "code": "PM000004",
        "name": "PM - CAP-Normal",
        "receiveQty": 35000,
        "poQty": 35000,
        "condition": "Good",
        "isMissing": false,
        "uom": "EA",
        "qcDecision": "Pass"
      }
    ],
    "activities": [
      {
        "grNumber": "GR-2026-0001",
        "title": "Received items at dock",
        "performedBy": "Warehouse Staff",
        "timestamp": "2026-03-05 14:30",
        "state": "done"
      },
      {
        "grNumber": "GR-2026-0001",
        "title": "QC inspection passed",
        "performedBy": "QC Inspector",
        "timestamp": "2026-03-05 15:10",
        "state": "done"
      }
    ]
  }
] as any;

export const MOCK_DASHBOARD_SUMMARY: InboundDashboardSummaryApi = {
  expectedToday: 7,
  qcPending: 1,
  supervisorPending: 1,
  approved: 2,
  completed: 5,
  exceptions: 0,
  returnedForCorrection: 0,
  awaitingPOLink: 0,
  agingPoItems: 1,
  totalGRs: 3,
  totalIrGrs: 3,
};
