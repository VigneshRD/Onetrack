// ─── lstrackparceldetailsService ────────────────────────────────────────────
// API service for fetching shipment tracking detail info.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('ls_access_token');
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
};

const lstrackparceldetailsService = {
    /**
     * Fetch full tracking info for a shipment.
     *
     * @param {string} trackingnumber_or_ordernumber - Tracking number or order number
     * @param {string} wherefrom - Source page identifier
     * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
     */
    getTrackInfo: async ({ trackingnumber_or_ordernumber, wherefrom = "tracked-packages" }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/gettrackinfo`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ wherefrom, trackingnumber_or_ordernumber }),
            });
            const data = await res.json();
            return { success: true, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.getTrackInfo error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit a note for a tracked parcel.
     *
     * @param {string} trackingnumber - The shipment tracking number
     * @param {string} note           - Note text (max 50 characters)
     * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
     */
    submitNote: async ({ trackingnumber, note, ordernumber }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/addnote`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ trackingnumber, note, ordernumber }),
            });
            const data = await res.json();
            return { success: true, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.submitNote error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update an existing note.
     *
     * @param {string} trackingnumber - The shipment tracking number
     * @param {number} id             - Note ID to update
     * @param {string} note           - Updated note text (max 50 characters)
     * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
     */
    updateNote: async ({ trackingnumber, ordernumber, note, old_note }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/updatenote`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ trackingnumber, ordernumber, note, old_note }),
            });
            const data = await res.json();
            return { success: data.success, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.updateNote error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Soft-delete a note (sets status = 'del').
     *
     * @param {number} id - Note ID to delete
     * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
     */
    deleteNote: async ({ trackingnumber, ordernumber, note }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/deletenote`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ trackingnumber, ordernumber, note }),
            });
            const data = await res.json();
            return { success: data.success, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.deleteNote error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch email history for a tracked parcel.
     *
     * @param {string} mail_doc_id - The mail document ID
     * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
     */
    getemailhistoryapi: async ({ trackingnumber }) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/getemailhistory`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ trackingnumber }),
            });
            const data = await res.json();
            return { success: true, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.getemailhistoryapi error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch email template view (HTML/text content).
     *
     * @param {object} payload - The tracking email details payload
     * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
     */
    getEmailTemplateView: async (payload) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/sendmailemailtemplateview`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            return { success: true, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.getEmailTemplateView error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetch send mail content for a specific event template.
     * @param {object} payload - e.g. { trackingnumber, event }
     */
    getSendMailContent: async (payload) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/sendmailcontent`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            return { success: true, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.getSendMailContent error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send email based on template
     */
    sendMail: async (payload) => {
        try {
            const res = await fetch(`${API_BASE_URL}/lstrackparceldetailsapi/sendmail`, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            return { success: data.success ?? true, data };
        } catch (error) {
            console.error("lstrackparceldetailsService.sendMail error:", error);
            return { success: false, error: error.message };
        }
    },
};

export default lstrackparceldetailsService;