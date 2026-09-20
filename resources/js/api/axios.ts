// resources/js/api/axios.ts
import axios, {
    AxiosInstance,
    InternalAxiosRequestConfig,
    AxiosError,
} from "axios";

const API_URL: string = "http://localhost:8000/api/web";

const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    // ✅ Don't transform response
    transformResponse: [
        (data) => {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        },
    ],
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem("access_token");
        // console.log(
        //     "Token being sent:",
        //     token ? `${token.substring(0, 20)}...` : "No token",
        // );
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError): Promise<AxiosError> => {
        return Promise.reject(error);
    },
);

// Response interceptor - DON'T wrap the response
axiosInstance.interceptors.response.use(
    (response) => {
        // If response data is an object with a data property that is an array, unwrap it
        if (
            response.data &&
            typeof response.data === "object" &&
            !Array.isArray(response.data)
        ) {
            // Check for common wrapper patterns
            if (
                response.data.data !== undefined &&
                Array.isArray(response.data.data)
            ) {
                response.data = response.data.data;
            }
            // Check for Laravel pagination
            else if (
                response.data.data !== undefined &&
                response.data.current_page !== undefined
            ) {
                // Keep pagination structure
                return response;
            }
        }
        return response;
    },
    (error) => Promise.reject(error),
);

export default axiosInstance;
