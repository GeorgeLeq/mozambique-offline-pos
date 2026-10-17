import { handleUsersQuery } from './usersHandler';
import { handleProductsQuery } from './productsHandler';
import { handleSalesQuery } from './salesHandler';
import { handleDebtsQuery } from './debtsHandler';
import { handleSystemQuery } from './systemHandler';

export { handleUsersQuery } from './usersHandler';
export { handleProductsQuery } from './productsHandler';
export { handleSalesQuery } from './salesHandler';
export { handleDebtsQuery } from './debtsHandler';
export { handleSystemQuery } from './systemHandler';

/**
 * Executes write SQL operations on the mock database (localStorage).
 * Delegates query execution to modular entity handlers.
 */
export const executeMockQuery = async (query: string, bindValues?: any[]): Promise<{ lastInsertId: number; rowsAffected: number }> => {
  console.log('[Mock DB] Execute:', query, bindValues);

  // Attempt each domain handler until one matches
  if (handleUsersQuery(query, bindValues)) {
    return { lastInsertId: 0, rowsAffected: 1 };
  }

  if (handleProductsQuery(query, bindValues)) {
    return { lastInsertId: 0, rowsAffected: 1 };
  }

  if (handleSalesQuery(query, bindValues)) {
    return { lastInsertId: 0, rowsAffected: 1 };
  }

  if (handleDebtsQuery(query, bindValues)) {
    return { lastInsertId: 0, rowsAffected: 1 };
  }

  if (handleSystemQuery(query, bindValues)) {
    return { lastInsertId: 0, rowsAffected: 1 };
  }

  return { lastInsertId: 0, rowsAffected: 1 };
};
