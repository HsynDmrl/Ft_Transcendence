import axios from "axios";
import tokenService from "../../../services/tokenService";
import { BASE_API_URL } from "../../../environment/environment";

console.log("🔧 Axios Base URL:", BASE_API_URL);

const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
    const token = tokenService.getToken();

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("🚀 Making request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        headers: config.headers
    });
    
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => {
        console.log("✅ Response received:", {
            status: response.status,
            url: response.config.url,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error("❌ Request failed:", {
            message: error.message,
            url: error.config?.url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export default axiosInstance;
