import axios from "axios";
import tokenService from "../../../services/tokenService";

export const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
});

axiosInstance.interceptors.request.use((config) => {
    const token = tokenService.getToken();

    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("Request interceptor çalıştı:", config.url);
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => {
        console.log("Response interceptor çalıştı");
        return response;
    },
);

export default axiosInstance;
