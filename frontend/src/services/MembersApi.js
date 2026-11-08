
import api from "./api";

const data = (response) => response.data;

// ========================================
// MEMBER DASHBOARD
// ========================================

export const memberApi = {
    dashboard: {
        get() {
            return api.get("/api/member/dashboard").then(data);
        },
    },
};

export { apiError } from "./api";

export default memberApi;
