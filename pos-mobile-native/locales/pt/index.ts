import { common } from './common';
import { dashboard } from './dashboard';
import { debt } from './debt';
import { deliveries } from './deliveries';
import { inventory } from './inventory';
import { authRequests } from './authRequests';
import { settings } from './settings';

export const pt = {
  ...common,
  ...dashboard,
  ...debt,
  ...deliveries,
  ...inventory,
  ...authRequests,
  ...settings,
};
