const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  
export const onetrackService = {
    /**
     * Fetch dashboard data.
     * @returns {Promise<Object>} - The dashboard data
     * 
     * 
     */

    
    getOneTrackingKPIs: async (dateRange) => {
        const token = sessionStorage.getItem('ls_access_token');

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_BASE_URL}/onetrackapi/getOneTrackingKPIs`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    datefilterVal: dateRange,
                    // token : token
                }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            throw new Error('Failed to fetch dashboard data');
        }

        return response.json();
    },

    getDashboardInit: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/onetrackapi/dashinit`,
            {
                method: 'POST',
                headers: headers
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch dashboard init data');
        }

        return response.json();
    },
    getShipmentStatistics: async (dateRange, event) => {
        const token = sessionStorage.getItem('ls_access_token');

        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(
            `${API_BASE_URL}/onetrackapi/getShipmentStatistics?${event}`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    datefilterVal: dateRange,
                    event: event   // ✅ send event
                }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            throw new Error('Failed to fetch shipment statistics');
        }

        return response.json();
    },

    getOneTrackPichart: async (dateRange) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/onetrackapi/getonetrackdashpichartapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ datefilterVal: dateRange }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch pie chart data');
        }

        return response.json();
    },

    getOneTrackLinechart: async (dateRange) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/onetrackapi/getonetrackdashlinechart`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ datefilterVal: dateRange }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch line chart data');
        }

        return response.json();
    },

    getWeeklyShippingFilters: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/weekreportapi/getFilters`,
            {
                method: 'GET',
                headers: headers,
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report filters');
        }

        return response.json();
    },

    getWeeklyShippingReport: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/weekreportapi/getDetails`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getShipmentDetailsList: async (eventKey, page = 1, pageSize = 10, search = '', filters = {}) => {
        // Mock asynchronous API call
        await new Promise(resolve => setTimeout(resolve, 800));

        const columns = [
            { field: 'isStarred', label: 'Priority', width: 80, sortable: false },
            { field: 'orderNumber', label: 'Order No', width: 130, sortable: true },
            { field: 'trackingNumber', label: 'Tracking No', width: 150, sortable: true },
            { field: 'carrier', label: 'Carrier', width: 120, sortable: true },
            { field: 'shippedDate', label: 'Shipped On', width: 120, sortable: true },
            { field: 'source', label: 'Source', width: 150, sortable: true },
            { field: 'destination', label: 'Destination', width: 150, sortable: true },
            { field: 'destinationCountry', label: 'Dest Country', width: 120, sortable: true },
            { field: 'deliveryDate', label: 'Delivered', width: 120, sortable: true },
            { field: 'estimatedDate', label: 'Estimated', width: 120, sortable: true },
            { field: 'status', label: 'Status', width: 140, sortable: true },
            { field: 'actions', label: 'Action', width: 80, sortable: false }
        ];

        // Generate mock data deterministic based on eventKey length and logic
        const mockCount = 50;
        const carriers = ["UPS", "FedEx", "DHL", "USPS", "Royal Mail", "VEHO"];
        const statuses = ["delivered", "in-transit", "exception", "delayed", "returned", "lost", "undeliverable", "just-shipped"];

        let allData = [];
        for (let i = 0; i < mockCount; i++) {
            // Apply a default status based on event key if possible
            let packageStatus = statuses[i % statuses.length];
            if (eventKey === "in-transit") packageStatus = "in-transit";
            else if (eventKey === "delayed") packageStatus = "delayed";
            else if (eventKey === "exception") packageStatus = "exception";
            else if (eventKey === "lost") packageStatus = "lost";
            else if (eventKey === "delivered") packageStatus = "delivered";
            else if (eventKey === "returned") packageStatus = "returned";
            else if (eventKey === "undeliverable") packageStatus = "undeliverable";
            else if (eventKey === "just-shipped") packageStatus = "just-shipped";

            allData.push({
                id: `pkg-${eventKey}-${i}`,
                isStarred: i % 7 === 0,
                orderNumber: `ORD-${(100000 + i).toString().slice(-5)}`,
                trackingNumber: `1Z${Math.floor(Math.random() * 9000000000000000)}`,
                carrier: carriers[i % carriers.length],
                shippedDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
                source: "Los Angeles, CA",
                destination: "United Kingdom",
                destinationCountry: "UK",
                deliveryDate: packageStatus === 'delivered' ? new Date().toISOString().split('T')[0] : null,
                estimatedDate: new Date(Date.now() + Math.floor(Math.random() * 5) * 86400000).toISOString().split('T')[0],
                status: packageStatus,
                customerName: "Joe Espinoza",
                customerEmail: "joe@example.com",
                billingAddress: "Somerville",
                shippingAddress: "Somerville",
                orderId: "UUID-XYZ",
                orderDate: "2026-02-27 15:36:00",
                product: "Sample Product X",
                amount: 149.99,
                itemCount: 1,
                contactNumber: "123-456-7890",
                emailHistory: []
            });
        }

        // Apply filters
        if (search) {
            allData = allData.filter(d => d.trackingNumber.includes(search) || d.orderNumber.includes(search));
        }
        if (filters.carrier && filters.carrier !== "All") {
            allData = allData.filter(d => d.carrier === filters.carrier);
        }
        if (filters.status && filters.status !== "All") {
            allData = allData.filter(d => d.status.toLowerCase() === filters.status.toLowerCase() || d.status.replace('-', ' ') === filters.status.toLowerCase());
        }
        if (filters.priority) {
            allData = allData.filter(d => d.isStarred);
        }

        const totalRecords = allData.length;

        // Paginate
        const startIndex = (page - 1) * pageSize;
        const pageData = allData.slice(startIndex, startIndex + pageSize);

        return {
            draw: page,
            recordsTotal: mockCount,
            recordsFiltered: totalRecords,
            columns: columns,
            data: pageData
        };
    },

    getTrackedPackages: async (payload) => {
        try {
            const { eventType, page = 1, limit = 25, search = '', filters = {}, sortModel = [], startDate, endDate } = payload;

            // Build DataTable style parameters
            const params = new URLSearchParams();
            params.append('draw', page);
            params.append('start', (page - 1) * limit);
            params.append('length', limit);
            params.append('search[value]', search);
            params.append('search[regex]', false);
            params.append('status', eventType || 'total');
            params.append('checkall', 0);
            params.append('fulfilmentType', '');
            params.append('reportType', '');

            if (startDate && endDate) {
                const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const fmtIso = (iso) => {
                    const [y, m, d] = iso.slice(0, 10).split('-');
                    return `${MONTHS[+m - 1]} ${d}, ${y}`;
                };
                params.append('datesend', `${fmtIso(startDate)} - ${fmtIso(endDate)}`);
            }

            // Columns
            // We use the exact keys returned by the user's getColumnPreferences payload
            const defaultKeys = [
                'priority', 'order_no', 'tracking_number', 'carrier',
                'ship_date', 'source', 'dest_city', 'dest_state', 'dest_country',
                'delivered', 'delivery_delay_days', 'estimated', 'status', 'action'
            ];
            const columnKeys = payload.activeColumns || defaultKeys;

            columnKeys.forEach((key, index) => {
                params.append(`columns[${index}][data]`, key);
                params.append(`columns[${index}][name]`, '');
                params.append(`columns[${index}][searchable]`, true);
                params.append(`columns[${index}][orderable]`, key !== 'isStarred' && key !== 'actions');
                params.append(`columns[${index}][search][value]`, '');
                params.append(`columns[${index}][search][regex]`, false);
            });

            // Build sorting
            if (sortModel.length > 0) {
                let colIndex = columnKeys.indexOf(sortModel[0].field);
                if (colIndex === -1) colIndex = 0;
                params.append('order[0][column]', colIndex);
                params.append('order[0][dir]', sortModel[0].sort || 'desc');
            } else {
                params.append('order[0][column]', 0);
                params.append('order[0][dir]', 'desc');
            }

            // ─── Filters ─────────────────────────────────────────────────────
            // carrier — array from multi-select, join with comma for the API
            const carrierArr = Array.isArray(filters.carrier)
                ? filters.carrier
                : filters.carrier && filters.carrier !== 'All' ? [filters.carrier] : [];
            params.append('carrier_string', carrierArr.join(','));

            // status / shipment status — array
            const statusArr = Array.isArray(filters.status)
                ? filters.status
                : filters.status && filters.status !== 'All' ? [filters.status] : [];
            params.append('status_string', statusArr.join(','));

            // destination country — array
            const destArr = Array.isArray(filters.destinationCountry)
                ? filters.destinationCountry
                : filters.destinationCountry && filters.destinationCountry !== 'All'
                    ? [filters.destinationCountry] : [];
            params.append('destination_string', destArr.join(','));

            // Estimated date range
            params.append('estimated_from', filters.estimatedDateFrom || '');
            params.append('estimated_to', filters.estimatedDateTo || '');

            // Delivery date range
            params.append('delivery_from', filters.deliveryDateFrom || '');
            params.append('delivery_to', filters.deliveryDateTo || '');

            // Priority / starred filter — tableState stores it as filters.priority
            params.append('priority', (filters.priority || filters.priorityOnly) ? '1' : '0');

            // service type — array from multi-select, join with comma
            const serviceArr = Array.isArray(filters.serviceType)
                ? filters.serviceType
                : filters.serviceType && filters.serviceType !== 'All' ? [filters.serviceType] : [];
            params.append('service_string', serviceArr.join(','));

            // 3PL customer — array from multi-select, join with comma
            const customerArr = Array.isArray(filters.customer)
                ? filters.customer
                : filters.customer && filters.customer !== 'All' ? [filters.customer] : [];
            params.append('company_string', customerArr.join(','));
            // ─────────────────────────────────────────────────────────────────

            // Call to the new backend Controller Action
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/getShipmentData`, {
                method: 'POST',
                headers,
                body: params
            });
            const response = await res.json();

            // Parse DataTable response format { data: [...], recordsTotal: ... }
            return {
                success: true,
                data: response.data || [],
                total: response.recordsFiltered || response.recordsTotal || 0,
                domainVerifyFlag: response.domainVerifyFlag || '',
            };
        } catch (error) {
            console.error('Error fetching tracked packages:', error);
            return { success: false, data: [], total: 0 };
        }
    },

    getColumnPreferences: async (pageName) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/getColumnPreferences`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ page: pageName })
            });
            const response = await res.json();

            if (response.success) {
                return { success: true, data: response.columns || response.data || [] };
            }
            return { success: true, data: [] };
        } catch (error) {
            console.error('Error retrieving column preferences:', error);
            return { success: true, data: [] };
        }
    },

    saveColumnPreferences: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/saveColumnPreferences`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            await res.json();
            return { success: true };
        } catch (error) {
            console.error('Error saving column preferences:', error);
            return { success: false };
        }
    },

    /**
     * Fetch column preferences for a specific module using a per-module endpoint.
     * Each table/page has its own endpoint suffix, e.g.:
     *   "deliverysatisfication"  → /onetrackapi/getColumnPreferencesdeliverysatisfication
     *   "trackedpackages"        → /onetrackapi/getColumnPreferencestrackedpackages
     *   "priorityshipments"      → /onetrackapi/getColumnPreferencespriorityshipments
     *   "weeklyshippingreport"   → /onetrackapi/getColumnPreferencesweeklyshippingreport
     */
    getColumnPreferencesForModule: async (moduleSuffix) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(
                `${API_BASE_URL}/onetrackapi/getColumnPreferences${moduleSuffix}`,
                { method: 'POST', headers, body: JSON.stringify({ module: moduleSuffix }) }
            );
            const response = await res.json();
            if (response.success) {
                return { success: true, data: response.columns || response.data || [] };
            }
            return { success: true, data: [] };
        } catch (error) {
            console.error(`Error retrieving column preferences for module "${moduleSuffix}":`, error);
            return { success: true, data: [] };
        }
    },

    /**
     * Save column preferences for a specific module using a per-module endpoint.
     */
    saveColumnPreferencesForModule: async (moduleSuffix, payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(
                `${API_BASE_URL}/onetrackapi/saveColumnPreferences${moduleSuffix}`,
                { method: 'POST', headers, body: JSON.stringify(payload) }
            );
            await res.json();
            return { success: true };
        } catch (error) {
            console.error(`Error saving column preferences for module "${moduleSuffix}":`, error);
            return { success: false };
        }
    },

    /**
     * Fetch satisfaction feedback rows (server-side pagination + sort + filters).
     */
    getSatisfactionFeedback: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/getSatisfactionFeedback`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const response = await res.json();
            if (response.success) {
                return { success: true, data: response.data || [], total: response.total || 0 };
            }
            return { success: false, data: [], total: 0 };
        } catch (error) {
            console.error('Error fetching satisfaction feedback:', error);
            return { success: false, data: [], total: 0 };
        }
    },

    setPriorityShipment: async ({ trackingNumber, priority }) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Always send as array — same format for single and multiple
            const res = await fetch(`${API_BASE_URL}/onetrackapi/priorityshipment`, {
                method: 'POST',
                headers,
                body: JSON.stringify([{ trackingNumber, priority }]),
            });
            const response = await res.json();
            return { success: true, data: response };
        } catch (error) {
            console.error('Error setting priority shipment:', error);
            return { success: false };
        }
    },

    /**
     * Export shipments as CSV.
     * @param {Object} payload - { columns: string[], tableState }
     */
    exportShipmentsCsv: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/exportCsv`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('CSV export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shipments_export_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            console.error('Error exporting CSV:', error);
            return { success: false };
        }
    },

    /**
     * Call selected shipment action for bulk-selected rows.
     * @param {Object} payload - { action: string, trackingNumbers: string[] }
     */
    selectedShipmentAction: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/selectedshipmentaction`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const response = await res.json();
            return { success: true, data: response };
        } catch (error) {
            console.error('Error calling selectedshipmentaction:', error);
            return { success: false };
        }
    },

    /**
     * Set priority for multiple shipments at once.
     * @param {Array<{trackingNumber: string, priority: boolean}>} items
     */
    bulkPriorityShipment: async (items) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Always send as array — backend expects array for both single and multiple

            const res = await fetch(`${API_BASE_URL}/onetrackapi/priorityshipment`, {
                method: 'POST',
                headers,
                body: JSON.stringify(items),
            });
            const response = await res.json();
            return { success: true, data: response };
        } catch (error) {
            console.error('Error calling priorityshipment:', error);
            return { success: false };
        }
    },

    /**
     * Export shipments as PDF.
     * @param {Object} payload - { columns: string[], tableState }
     */
    exportShipmentsPdf: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/onetrackapi/exportPdf`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('PDF export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shipments_export_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            console.error('Error exporting PDF:', error);
            return { success: false };
        }
    },

    getNotificationSettings: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json', };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log("url", `${API_BASE_URL}/notificationdem/notifyapi`);
        const response = await fetch(
            `${API_BASE_URL}/notificationdem/notifyapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({}),
                redirect: "follow"
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                console.error('400 details:', err);              // ✅ See exact server error
                throw new Error('Bad request');
            }
            throw new Error('Failed to fetch notification settings');
        }

        return response.json();
    },

    EmailAutomate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailnotificationapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    SmsAutomate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smsnotificationapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    AttentiveIntegrate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/attentivesmsenableapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    YotpoIntegrate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/yotposmsenableapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getEmailTemplate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getEmailTemplatePreview: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentpreviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    saveEmailContent: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsaveapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    // ── Split template (Shipped / Delivered) ─────────────────────────────────────

    getEmailSplitTemplate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsplitviewapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch split email template');
        }
        return response.json();
    },

    getEmailSplitTemplatePreview: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsplitpreviewapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch split email preview');
        }
        return response.json();
    },

    saveEmailSplitContent: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsplitsaveapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to save split email template');
        }
        return response.json();
    },

    KlaviyoIntegrate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/notificationdem/klaviyonotificationenableapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to add domain');
        }
        return response.json();
    },

    OmnisendIntegrate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/notificationdem/omnisendnotificationenableapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to add domain');
        }
        return response.json();
    },


    //domain related api start
    domainVerification: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/settingsapi/domainVerifcation`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to add domain');
        }
        return response.json();
    },

    domainVerificationDNS: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/settingsapi/domainVerifcationDNS`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to get DNS records');
        }
        return response.json();
    },

    domainVerificationStatus: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/settingsapi/domainVerifcationStatus`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to check verification status');
        }
        return response.json();
    },

    domainEmailNameUpdate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/settingsapi/domainEmailNameUpdate`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to update sender name');
        }
        return response.json();
    },

    domainEmailUpdate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/settingsapi/domainEmailUpdate`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to update sender email');
        }
        return response.json();
    },
    //domain related api end

    emailContentSend: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsendapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to send test email');
        }
        return response.json();
    },

    emailContentSendSplit: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsendsplitapi`,
            { method: 'POST', headers, body: JSON.stringify(payload) }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to send test email');
        }
        return response.json();
    },

    interceptShipment: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = {
            // The PHP backend uses getPost(), meaning it expects URL-encoded form data 
            // array mapping needs to be handled properly for FormData or x-www-form-urlencoded
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const requestPayload = Object.assign({}, payload);

        // Convert arrays to comma-separated strings (as backend expects explode(','))
        if (Array.isArray(requestPayload.trackingnumber)) {
            requestPayload.trackingnumber = requestPayload.trackingnumber.join(',');
        }

        if (Array.isArray(requestPayload.orderno)) {
            requestPayload.orderno = requestPayload.orderno.join(',');
        }

        // Default value
        requestPayload.multipleShipmentsFlag = requestPayload.multipleShipmentsFlag || 'S';

        console.log('final payload', requestPayload);

        const response = await fetch(
            `${API_BASE_URL}/lstrackparceldetailsapi/interceptorder`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestPayload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                return { success: false, message: err.message || 'Validation failed' };
            }
            throw new Error('Failed to process intercept');
        }

        const data = await response.json();
        return { success: data.status === 'success', ...data };
    },
    //ignore intercept
    ignoreintercept: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = {
            // The PHP backend uses getPost(), meaning it expects URL-encoded form data 
            // array mapping needs to be handled properly for FormData or x-www-form-urlencoded
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(
            `${API_BASE_URL}/lstrackparceldetailsapi/ignoreintercept`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                return { success: false, message: err.message || 'Validation failed' };
            }
            throw new Error('Failed to process intercept');
        }

        const data = await response.json();
        return { success: data.status === 'success', ...data };
    },
    getSmsTemplate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smscontentviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getSmsTemplatePreview: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smscontentpreviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    saveSmsContent: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smscontentsaveapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    saveCustomerEmailDetails: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/savecustomeremaildetailsapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },
    getNotificationSettings: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json', };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log("url", `${API_BASE_URL}/notificationdem/notifyapi`);
        const response = await fetch(
            `${API_BASE_URL}/notificationdem/notifyapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({}),
                redirect: "follow"
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            if (response.status === 400) {
                const err = await response.json().catch(() => ({}));
                console.error('400 details:', err);              // ✅ See exact server error
                throw new Error('Bad request');
            }
            throw new Error('Failed to fetch notification settings');
        }

        return response.json();
    },

    EmailAutomate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailnotificationapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    SmsAutomate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smsnotificationapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    AttentiveIntegrate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/attentivesmsenableapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    YotpoIntegrate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/yotposmsenableapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getEmailTemplate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getEmailTemplatePreview: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentpreviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    saveEmailContent: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/emailcontentsaveapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getSmsTemplate: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smscontentviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getSmsTemplatePreview: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smscontentpreviewapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    saveSmsContent: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/smscontentsaveapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    saveCustomerEmailDetails: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/savecustomeremaildetailsapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    connectKlaviyo: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/connectapi`,
            {
                method: 'POST',
                headers: headers,
                // body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    disConnectKlaviyo: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/notificationdem/disconnectapi`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report data');
        }

        return response.json();
    },

    getShopifyViewDetails: async (payload) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/onetrackapi/shopifyviewdetails`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch shopify order details');
        }

        return response.json();
    },

    reviewsAndLoyaltyDetails: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/reviewsandloyaltyapi/getreviewsandloyalty`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({}),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch shopify order details');
        }

        return response.json();
    },

    toggleReview: async (reviewsPlatform, next, tokenValue) => {

        const token = localStorage.getItem("accessToken");
        const headers = { "Content-Type": "application/x-www-form-urlencoded", };
        if (token) { headers["Authorization"] = `Bearer ${token}`; }

        const response = await fetch(
            `${API_BASE_URL}/reviewsandloyaltyapi/getreviewdata`,
            {
                method: "POST",
                headers,
                body: new URLSearchParams({
                    reviewtype: reviewsPlatform,
                    reviewEnableStatus: next ? "1" : "0",
                    tokenValue: tokenValue,
                }),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch helpdesk value');
        }

        return response.json();
    },

    toggleLoyaltyEvent: async (loyaltyPlatform, eventName, checked, tokenValue) => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/reviewsandloyaltyapi/getloyalty`,
            {
                method: 'POST',
                headers,
                body: new URLSearchParams({
                    loyaltytype: loyaltyPlatform,
                    eventName: eventName,
                    enableStatus: checked ? '1' : '0',
                    tokenValue: tokenValue,
                }),
            }
        );
        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to update loyalty event');
        }
        return response.json();
    },

    getViewDetails: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/settingsapi/getviewdetails`,
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({}),
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch shopify order details');
        }

        return response.json();
    },

    getWidgetDetails: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/widgetapi/getviewdetails`,
            {
                method: 'GET',
                headers: headers,
            }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to fetch weekly shipping report filters');
        }

        return response.json();
    },

    /**
     * GET fulfillmentdashboardapi/getFilterDataRefresh
     *
     * User-initiated refresh that re-syncs carrier, service type, and customer
     * filter options from the backend. Shared between FulfillmentDashboard and
     * OneTrack detail views.
     *
     * Response: { success, carriers: string[], serviceTypes: string[], customers: string[] }
     */
    getRatingDetailsInit: async () => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE_URL}/ratingdetailsapi/getviewdata`, {
                method: 'POST',
                headers,
                body: JSON.stringify({}),
            });
            const response = await res.json();
            return { success: true, data: response };
        } catch (error) {
            console.error('Error fetching rating details init:', error);
            return { success: false, data: {} };
        }
    },

    getRatingData: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE_URL}/ratingdetailsapi/ratingdata`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const response = await res.json();
            return {
                success: true,
                averageRating: response.averageRating ?? 0,
                totalRating: response.totalRating ?? 0,
                trackingArray: response.trackingArray ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                trackingPercentageArray: response.trackingPercentageArray ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        } catch (error) {
            console.error('Error fetching rating data:', error);
            return { success: false, averageRating: 0, totalRating: 0, trackingArray: {}, trackingPercentageArray: {} };
        }
    },

    getRatingShowData: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE_URL}/ratingdetailsapi/showdata`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            const response = await res.json();
            if (response.success) {
                return { success: true, data: response.data || [], total: response.total || 0 };
            }
            return { success: false, data: [], total: 0 };
        } catch (error) {
            console.error('Error fetching rating show data:', error);
            return { success: false, data: [], total: 0 };
        }
    },

    getRatingColumnPreferences: async (pageName) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/ratingdetailsapi/getColumnPreferences`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ page: pageName })
            });
            const response = await res.json();

            if (response.success) {
                return { success: true, data: response.columns || response.data || [] };
            }
            return { success: true, data: [] };
        } catch (error) {
            console.error('Error retrieving column preferences:', error);
            return { success: true, data: [] };
        }
    },

    saveRatingColumnPreferences: async (payload) => {
        try {
            const token = sessionStorage.getItem('ls_access_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/ratingdetailsapi/saveColumnPreferences`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            await res.json();
            return { success: true };
        } catch (error) {
            console.error('Error saving column preferences:', error);
            return { success: false };
        }
    },

    getFilterDataRefresh: async () => {
        const token = sessionStorage.getItem('ls_access_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(
            `${API_BASE_URL}/fulfillmentdashboardapi/getFilterDataRefresh`,
            { method: 'GET', headers }
        );

        if (!response.ok) {
            if (response.status === 401) throw new Error('Unauthorized');
            throw new Error('Failed to refresh filter data');
        }

        return response.json();
    },

};