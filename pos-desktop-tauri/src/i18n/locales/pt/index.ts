import { LocaleResource } from '../../types';
import { common } from './common';
import { products } from './products';
import { pos } from './pos';
import { customers } from './customers';
import { audits } from './audits';
import { settings } from './settings';
import { deliveries } from './deliveries';
import { barcodes } from './barcodes';
import { ptEmployees as employees } from './employees';
import { ptCashierControl as cashierControl } from './cashierControl';
import { ptShiftReports as shiftReports } from './shiftReports';
import { ptScanHistory as scanHistory } from './scanHistory';

export const pt: LocaleResource = {
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

export default pt;
