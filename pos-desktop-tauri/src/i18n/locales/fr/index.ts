import { LocaleResource } from '../../types';
import { common } from './common';
import { products } from './products';
import { pos } from './pos';
import { customers } from './customers';
import { audits } from './audits';
import { settings } from './settings';
import { deliveries } from './deliveries';
import { barcodes } from './barcodes';
import { frEmployees as employees } from './employees';
import { frCashierControl as cashierControl } from './cashierControl';
import { frShiftReports as shiftReports } from './shiftReports';
import { frScanHistory as scanHistory } from './scanHistory';

export const fr: LocaleResource = {
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

export default fr;
