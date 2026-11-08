
import api from "./api";

const data = (response) => response.data;

// ========================================
// COACH DASHBOARD
// ========================================

export const coachApi = {
    dashboard: {
        get() {return api.get("/api/coach/dashboard").then(data);
        },
    },
};

export { apiError } from "./api";

export default coachApi;
