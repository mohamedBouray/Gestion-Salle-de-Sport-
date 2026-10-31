import api, { getCsrfCookie } from "./api";

// CHECK FIRST ADMIN SETUP
export const checkSetup = async () => {const response = await api.get("/api/setup-status");
    return response.data;
};

// GET AUTHENTICATED USER
export const getMe = async () => { const response = await api.get("/api/me");
    return response.data;
};

// REGISTER
export const registerUser = async (formData) => { await getCsrfCookie();
    const response = await api.post("/api/register",
        formData);
         return response.data;
};

// LOGIN
export const loginUser = async (formData) => {
    await getCsrfCookie();

    const response = await api.post(
        "/api/login",
        formData
    );

    return response.data;
};

// LOGOUT
export const logoutUser = async () => {
    const response = await api.post("/api/logout");
    return response.data;
};



export const forgotPassword = async (email) => {
    await getCsrfCookie();

    const response = await api.post("/api/forgot-password", {
        email,
    });

    return response.data;
};

export const resetPassword = async (formData) => {
    await getCsrfCookie();

    const response = await api.post(
        "/api/reset-password",
        formData
    );

    return response.data;
};


export const updateProfile = async (formData) => {
    const response = await api.put(
        "/api/profile",
        formData
    );

    return response.data;
};

export const changePassword = async (formData) => {
    const response = await api.put(
        "/api/change-password",
        formData
    );
    return response.data;
};
