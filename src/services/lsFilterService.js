// services/lsFilterService.js
//
// Common filter service shared across the entire LS app.
// Used by FulfillmentDashboard, OneTrack details view, and any other page
// that needs carrier / service-type / customer / status / destination filters.
//
// ─────────────────────────────────────────────────────────────────────────────
//   GET  filterapi/getlsfilter       — load current filter options (on page load
//                                      and after a refresh)
//   POST filterapi/lsfilterrefresh   — user-initiated: re-syncs filter data on
//                                      the backend (e.g. new carriers onboarded)
//                                      then call getlsfilter to get the result
// ─────────────────────────────────────────────────────────────────────────────
//
// getlsfilter response shape:
//   {
//     success:     boolean,
//     userId:      number,
//     startDate:   "yyyy-MM-dd",
//     endDate:     "yyyy-MM-dd",
//     refreshedAt: "yyyy-MM-dd HH:mm:ss",   ← pass slice(0,10) as startDate to lsfilterrefresh
//     filters: [
//       { key: "carrier_type", label: "Carrier",       values: string[] },
//       { key: "servicetype",  label: "Service Type",  values: string[] },
//       { key: "companyname",  label: "Company Name",  values: string[] },
//       // ...other keys as returned by the backend
//     ]
//   }
//
// lsfilterrefresh request payload:
//   { startDate: "yyyy-MM-dd",   ← refreshedAt from last getlsfilter response
//     endDate:   "yyyy-MM-dd" }  ← current date
//
// lsfilterrefresh response shape:
//   { success: boolean, message?: string }
//

const API_BASE_URL    = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT = 30000;

function authHeaders() {
  const token = sessionStorage.getItem('ls_access_token');
  if (!token) throw new Error('Authentication required: no access token found');
  return {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${token}`,
  };
}

async function request(path, method = 'GET', body) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: authHeaders(),
      signal:  controller.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    clearTimeout(timeoutId);
    if (response.status === 401) throw new Error('Unauthorized: invalid or expired token');
    if (!response.ok)            throw new Error(`API error: ${response.status}`);
    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timeout — please try again');
    throw err;
  }
}

export const lsFilterService = {

  /**
   * GET filterapi/getlsfilter
   *
   * Fetches the current filter options for the user.
   * Called on page load by FulfillmentDashboard and OneTrack details view.
   * Also called immediately after lsFilterRefresh to pick up the new data.
   *
   * Response: { success, carriers, serviceTypes, customers, statuses, destinations }
   */
  getLsFilter: () =>
    request('/filterapi/getlsfilter', 'GET'),

  /**
   * POST filterapi/lsfilterrefresh
   *
   * User-initiated: tells the backend to re-sync filter data (carriers, service
   * types, customers) from upstream sources. After this resolves, call getLsFilter
   * to retrieve the refreshed options.
   *
   * Response: { success, message? }
   */
  /**
   * payload: { startDate: "yyyy-MM-dd", endDate: "yyyy-MM-dd" }
   *   startDate = refreshedAt (date part) from the last getLsFilter response
   *   endDate   = current date
   */
  lsFilterRefresh: (payload = {}) =>
    request('/filterapi/lsfilterrefresh', 'POST', payload),

};
