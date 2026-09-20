// resources/js/contexts/AuthContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode,
} from "react";
import { authAPI } from "../api/auth";
import { User } from "../types";
import axios from "../api/axios";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (
        email: string,
        password: string,
    ) => Promise<{ success: boolean; user?: User; error?: string }>;
    logout: () => Promise<void>;
    updateUser: (updatedUser: User) => void;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem("access_token");
    });

    useEffect(() => {
        if (token && !user) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        console.log("Auth state changed:", {
            token: !!token,
            user: !!user,
            loading,
            isAuthenticated: !!token && !!user,
        });
    }, [token, user, loading]);

    /**
     * ✅ FIXED: Fetch user and load course relationship
     */
    const fetchUser = async (): Promise<void> => {
        try {
            const response = await authAPI.getMe();
            const userData = response.data;

            // ✅ If course is not loaded, fetch it separately
            if (userData?.course_id && !userData.course) {
                try {
                    const courseResponse = await axios.get(
                        `/courses/${userData.course_id}`,
                    );
                    userData.course = courseResponse.data;
                    console.log("✅ Course loaded:", userData.course);
                } catch (e) {
                    console.warn("Could not fetch course:", e);
                }
            }

            setUser(userData);
            if (userData) {
                localStorage.setItem("user", JSON.stringify(userData));
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * ✅ FIXED: Login and load course
     */
    const login = async (
        email: string,
        password: string,
    ): Promise<{ success: boolean; user?: User; error?: string }> => {
        try {
            const response = await authAPI.login(email, password);
            console.log("Login response:", response.data);

            const newToken = response.data.token;
            const userData = response.data.user;

            if (newToken && userData) {
                // ✅ If course is not loaded, fetch it separately
                if (userData.course_id && !userData.course) {
                    try {
                        const courseResponse = await axios.get(
                            `/courses/${userData.course_id}`,
                        );
                        userData.course = courseResponse.data;
                        console.log(
                            "✅ Course loaded on login:",
                            userData.course,
                        );
                    } catch (e) {
                        console.warn("Could not fetch course on login:", e);
                    }
                }

                localStorage.setItem("access_token", newToken);
                localStorage.setItem("user", JSON.stringify(userData));
                setToken(newToken);
                setUser(userData);
                return { success: true, user: userData };
            } else {
                return {
                    success: false,
                    error:
                        response.data.message || "Invalid response from server",
                };
            }
        } catch (error: any) {
            console.error("Login error:", error);
            return {
                success: false,
                error: error.response?.data?.message || "Login failed",
            };
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
            setToken(null);
            setUser(null);
        }
    };

    const updateUser = (updatedUser: User): void => {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        updateUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
