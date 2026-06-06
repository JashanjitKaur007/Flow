import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { LoginInput, RegisterInput, User } from "../models/types";
import { AuthService } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginInput) => Promise<{ success: boolean; message?: string }>;
  register: (
    data: RegisterInput
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await AuthService.isAuthenticated();

        if (isAuth) {
          const userData = await AuthService.getMe();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(
    async (
      data: LoginInput
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const result = await AuthService.login(data);

        if (result.success && result.user) {
          setUser(result.user);
          if (result.user.role === "PATIENT") {
            router.replace("/(patient)/(tabs)");
          } else if (result.user.role === "STAFF") {
            router.replace("/(staff)/(tabs)");
          } else if (result.user.role === "ADMIN") {
            router.replace("/(admin)/(tabs)");
          }
          return { success: true };
        }

        return { success: false, message: result.message };
      } catch (error) {
        return { success: false, message: "Login failed. Please try again." };
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const register = useCallback(
    async (
      data: RegisterInput
    ): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const result = await AuthService.register(data);

        if (result.success) {
          router.back();
          return { success: true, message: result.message };
        }

        return { success: false, message: result.message };
      } catch (error) {
        return {
          success: false,
          message: "Registration failed. Please try again.",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      router.replace("/(public)/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await AuthService.getMe();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export default AuthContext;
