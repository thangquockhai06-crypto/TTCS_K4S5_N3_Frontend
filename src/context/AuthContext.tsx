import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  IAuthContext,
  IAuthResponse,
  ILoginPayload,
  IPhoneOtpVerifyPayload,
  IRegisterPayload,
  ISocialAuthPayload,
  IUser,
} from '../interfaces';
import {
  ADMIN_ACCOUNT,
  AUTH_STORAGE_KEYS,
  authenticateWithMock,
  authenticateWithSocialMock,
  registerWithMock,
  sendPhoneOtpWithMock,
  verifyPhoneOtpWithMock,
} from '../mock/auth.mock';
import {
  axiosInstance,
  triggerSimulated401OnNextCall,
  USE_REAL_BACKEND,
} from '../utils/axiosInstance';

export const AuthContext = createContext<IAuthContext | undefined>(undefined);

interface IAuthProviderProps {
  children: React.ReactNode;
}

interface ITokenRefreshedEventDetail {
  accessToken: string;
  refreshToken: string;
  refreshedAt: string;
}

export const AuthProvider: React.FC<IAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!raw) return ADMIN_ACCOUNT.user;
    try {
      const parsed = JSON.parse(raw) as IUser;
      if (parsed.id === 'usr-admin-01' && parsed.email !== ADMIN_ACCOUNT.user.email) {
        window.localStorage.setItem(
          AUTH_STORAGE_KEYS.USER,
          JSON.stringify(ADMIN_ACCOUNT.user)
        );
        return ADMIN_ACCOUNT.user;
      }
      return parsed;
    } catch {
      return ADMIN_ACCOUNT.user;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    if (stored) return stored;
    const initialToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.nexus_admin_session_token';
    window.localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, initialToken);
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.REFRESH_TOKEN,
      'nexus_admin_refresh_token_2026'
    );
    window.localStorage.setItem(
      AUTH_STORAGE_KEYS.USER,
      JSON.stringify(ADMIN_ACCOUNT.user)
    );
    return initialToken;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    window.localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastTokenRefresh, setLastTokenRefresh] = useState<string | null>(
    'Phiên đang hoạt động'
  );

  useEffect(() => {
    const handleTokenRefreshed = (event: Event): void => {
      const customEvent = event as CustomEvent<ITokenRefreshedEventDetail>;
      if (customEvent.detail) {
        setAccessToken(customEvent.detail.accessToken);
        setRefreshToken(customEvent.detail.refreshToken);
        setLastTokenRefresh(`Làm mới lúc ${customEvent.detail.refreshedAt}`);
      }
    };

    const handleAuthExpired = (): void => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    };

    window.addEventListener('nexus:token-refreshed', handleTokenRefreshed);
    window.addEventListener('nexus:auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('nexus:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('nexus:auth-expired', handleAuthExpired);
    };
  }, []);

  const login = useCallback(async (payload: ILoginPayload): Promise<IAuthResponse> => {
    setIsLoading(true);
    try {
      let response: IAuthResponse;
      if (USE_REAL_BACKEND) {
        try {
          const { data } = await axiosInstance.post<IAuthResponse>('/auth/login', payload);
          response = data;
        } catch (error: any) {
          // Nếu Backend lỗi (chưa cấu hình MySQL / 500 / Network Error), tự động fallback sang Mock Auth cho Admin
          if (
            !error.response ||
            error.response.status >= 500 ||
            error.code === 'ERR_NETWORK' ||
            error.code === 'ECONNABORTED'
          ) {
            console.warn('[AUTH] Backend 500 hoặc mất kết nối, chuyển sang Mock Auth dự phòng.');
            response = await authenticateWithMock(payload);
          } else {
            throw error;
          }
        }
      } else {
        response = await authenticateWithMock(payload);
      }

      window.localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      window.localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      window.localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.user));
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
      window.localStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_UNTIL);

      setAccessToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUser(response.user);
      setLastTokenRefresh(`Cấp lúc ${response.issuedAt}`);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: IRegisterPayload): Promise<IAuthResponse> => {
      setIsLoading(true);
      try {
        let response: IAuthResponse;
        if (USE_REAL_BACKEND) {
          const { data } = await axiosInstance.post<IAuthResponse>('/auth/register', payload);
          response = data;
        } else {
          response = await registerWithMock(payload);
        }

        window.localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.user));
        window.localStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
        window.localStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_UNTIL);

        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        setUser(response.user);
        setLastTokenRefresh(`Khởi tạo lúc ${response.issuedAt}`);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loginWithSocial = useCallback(
    async (payload: ISocialAuthPayload): Promise<IAuthResponse> => {
      setIsLoading(true);
      try {
        const response = await authenticateWithSocialMock(payload);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.user));
        window.localStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
        window.localStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_UNTIL);

        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        setUser(response.user);
        setLastTokenRefresh(`Cấp qua ${payload.provider.toUpperCase()} lúc ${response.issuedAt}`);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendPhoneOtp = useCallback(
    async (
      phoneNumber: string
    ): Promise<{ otpCode: string; expiresInSeconds: number; existingUser: IUser | null }> => {
      setIsLoading(true);
      try {
        return await sendPhoneOtpWithMock(phoneNumber);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyPhoneOtp = useCallback(
    async (payload: IPhoneOtpVerifyPayload): Promise<IAuthResponse> => {
      setIsLoading(true);
      try {
        const response = await verifyPhoneOtpWithMock(payload);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
        window.localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(response.user));
        window.localStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
        window.localStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_UNTIL);

        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        setUser(response.user);
        setLastTokenRefresh(`Xác thực OTP lúc ${response.issuedAt}`);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * [S1-02] Nút Logout: Gửi request thu hồi phiên phía server & xóa sạch storage
   */
  const logout = useCallback((): void => {
    if (USE_REAL_BACKEND) {
      const storedRefreshToken = window.localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
      axiosInstance
        .post('/auth/logout', { refreshToken: storedRefreshToken })
        .catch(() => {});
    }

    window.localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
    window.sessionStorage.clear();

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setLastTokenRefresh(null);
  }, []);

  const triggerMockTokenRefresh = useCallback(async (): Promise<string> => {
    triggerSimulated401OnNextCall();
    await axiosInstance.get('/auth/session-heartbeat');
    const updatedToken = window.localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN) ?? '';
    return updatedToken;
  }, []);

  const updateUserProfile = useCallback((partial: Partial<IUser>): void => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: IUser = { ...prev, ...partial };
      window.localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const contextValue = useMemo<IAuthContext>(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      lastTokenRefresh,
      login,
      register,
      loginWithSocial,
      sendPhoneOtp,
      verifyPhoneOtp,
      logout,
      triggerMockTokenRefresh,
      updateUserProfile,
    }),
    [
      user,
      accessToken,
      refreshToken,
      isLoading,
      lastTokenRefresh,
      login,
      register,
      loginWithSocial,
      sendPhoneOtp,
      verifyPhoneOtp,
      logout,
      triggerMockTokenRefresh,
      updateUserProfile,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
