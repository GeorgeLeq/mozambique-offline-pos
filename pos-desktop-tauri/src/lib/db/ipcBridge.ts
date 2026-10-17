/**
 * @file ipcBridge.ts
 * @description Highly optimized Tauri IPC bridge query helper for high-performance offline database access.
 * Implements chunked streaming and automatic paginated queries to prevent memory spikes on massive tables.
 */

import { getDB } from './index';

interface PaginatedOptions<T> {
  pageSize?: number;
  limit?: number;
  onChunk?: (chunk: T[]) => void | Promise<void>;
}

/**
 * Safely executes raw SQLite select queries in small, sequential chunks.
 * Stream-loads rows over the Tauri IPC bridge, resolving memory consumption spikes.
 * 
 * @param baseQuery The SQL SELECT query (must not contain LIMIT or OFFSET)
 * @param params Positional parameters for the SQL query
 * @param options Pagination options (pageSize, total limit caps, onChunk streaming callbacks)
 * @returns {Promise<T[]>} Aggregated array of all rows fetched
 */
export async function paginatedSelect<T>(
  baseQuery: string,
  params: any[] = [],
  options: PaginatedOptions<T> = {}
): Promise<T[]> {
  const { pageSize = 1000, limit, onChunk } = options;
  const db = await getDB();
  const aggregatedResults: T[] = [];
  
  let offset = 0;
  let hasMore = true;
  
  console.log(`[IPC Bridge] Paginated SELECT initialized for query: "${baseQuery.substring(0, 80)}..."`);
  
  while (hasMore) {
    let currentLimit = pageSize;
    
    if (limit !== undefined) {
      const remaining = limit - aggregatedResults.length;
      if (remaining <= 0) {
        break;
      }
      if (remaining < pageSize) {
        currentLimit = remaining;
      }
    }
    
    // Formulate paginated clause
    const chunkQuery = `${baseQuery} LIMIT ? OFFSET ?`;
    const chunkParams = [...params, currentLimit, offset];
    
    const startTime = performance.now();
    const chunk = await db.select(chunkQuery, chunkParams) as T[];
    const duration = performance.now() - startTime;
    
    if (!chunk || chunk.length === 0) {
      hasMore = false;
      break;
    }
    
    console.log(
      `[IPC Bridge] Page fetched successfully: ${chunk.length} items (offset: ${offset}) in ${duration.toFixed(1)}ms.`
    );
    
    // Deliver chunk to consumer immediately for streaming UI rendering or progressive exports
    if (onChunk) {
      try {
        await onChunk(chunk);
      } catch (cbError) {
        console.error('[IPC Bridge] Error in paginated select onChunk callback:', cbError);
      }
    }
    
    aggregatedResults.push(...chunk);
    
    // Stop condition: if less items than the limit size were returned, we reached the end
    if (chunk.length < currentLimit) {
      hasMore = false;
    } else {
      offset += chunk.length;
    }
  }
  
  console.log(`[IPC Bridge] Completed paginated query. Aggregated total: ${aggregatedResults.length} records.`);
  return aggregatedResults;
}

/**
 * Audit wrapper for SQLite queries. 
 * Detects heavy queries that bypass pagination and logs performance warning metrics in development.
 * 
 * @param query Raw SQL select string
 * @param params Query arguments
 * @returns {Promise<T[]>} Operational database response
 */
export async function monitoredSelect<T>(query: string, params: any[] = []): Promise<T[]> {
  const db = await getDB();
  const startTime = performance.now();
  const rows = await db.select(query, params) as T[];
  const duration = performance.now() - startTime;
  
  if (rows && rows.length > 2000) {
    console.warn(
      `%c[IPC Bridge Alert] Large unpaginated query detected: ${rows.length} rows fetched in ${duration.toFixed(1)}ms.\n` +
      `This causes Webview memory pressure on physical terminals.\n` +
      `Query context: "${query.substring(0, 150)}..."\n` +
      `👉 RECOMENDAÇÃO: Use paginatedSelect() for heavy datasets.`,
      'color: yellow; font-weight: bold; background: #330000; padding: 4px; border-radius: 4px;'
    );
  }
  
  return rows;
}
