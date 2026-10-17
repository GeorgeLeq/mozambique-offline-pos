import { LocaleResource } from '../../types';
import { common } from './common';
import { products } from './products';
import { pos } from './pos';
import { customers } from './customers';
import { audits } from './audits';
import { settings } from './settings';
import { deliveries } from './deliveries';
import { barcodes } from './barcodes';
import { swEmployees as employees } from './employees';
import { swCashierControl as cashierControl } from './cashierControl';
import { swShiftReports as shiftReports } from './shiftReports';
import { swScanHistory as scanHistory } from './scanHistory';

export const sw: LocaleResource = {
  common,
  products,
  pos,
  customers,
  audits,
  settings,
  deliveries,
  barcodes,
  employees,
  cashierControl,
  shiftReports,
  scanHistory
};

export default sw;
