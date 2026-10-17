import { LocaleResource } from '../../types';
import { common } from './common';
import { products } from './products';
import { pos } from './pos';
import { customers } from './customers';
import { audits } from './audits';
import { settings } from './settings';
import { deliveries } from './deliveries';
import { barcodes } from './barcodes';
import { enEmployees as employees } from './employees';
import { enCashierControl as cashierControl } from './cashierControl';
import { enShiftReports as shiftReports } from './shiftReports';
import { enScanHistory as scanHistory } from './scanHistory';

export const en: LocaleResource = {
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

export default en;
