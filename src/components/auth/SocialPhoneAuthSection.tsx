import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Phone,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import logoUrl from '../../assets/logo.svg';
import { useAuth } from '../../hooks/useAuth';
import { AuthProviderType, IUser } from '../../interfaces';
import {
  AUTH_STORAGE_KEYS,
  IStoredAccount,
  isValidVietnamPhone,
  normalizeVietnamPhone,
} from '../../mock/auth.mock';
import { createAvatarSvgDataUri } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import styles from './SocialPhoneAuthSection.module.css';

export interface ISocialPhoneAuthSectionProps {
  mode: 'login' | 'register';
  disabled?: boolean;
}

export interface IOidcIdTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  nbf: number;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface ICredentialResponse {
  credential: string;
  select_by: 'btn' | 'user' | 'fedcm';
  provider: AuthProviderType;
}

export function decodeJWT(token: string): IOidcIdTokenPayload {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload) as IOidcIdTokenPayload;
}

function encodeBase64Url(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(
    /%([0-9A-F]{2})/g,
    (_, p1: string) => String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8Bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createOidcIdToken(params: {
  provider: AuthProviderType;
  sub: string;
  email: string;
  name: string;
  picture: string;
}): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const issuerMap: Record<AuthProviderType, string> = {
    google: 'https://accounts.google.com',
    apple: 'https://appleid.apple.com',
    linkedin: 'https://www.linkedin.com/oauth',
    phone: 'https://id.nexuscrm.vn/phone',
  };

  const header = {
    alg: 'RS256',
    kid: 'c7e04465649ffa606557650c7e65f0a87ae00fe8',
    typ: 'JWT',
  };

  const nameParts = params.name.trim().split(/\s+/);
  const givenName = nameParts.length > 1 ? nameParts.slice(-1)[0] : params.name;
  const familyName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';

  const payload: IOidcIdTokenPayload = {
    iss: issuerMap[params.provider],
    azp: '721724668570-nexuscrm.apps.googleusercontent.com',
    aud: '721724668570-nexuscrm.apps.googleusercontent.com',
    sub: params.sub,
    email: params.email,
    email_verified: true,
    nbf: nowSec - 300,
    name: params.name,
    picture: params.picture,
    given_name: givenName,
    family_name: familyName,
    iat: nowSec,
    exp: nowSec + 3600,
    jti: `jti_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = encodeBase64Url(`sig_${params.provider}_${params.sub}_${nowSec}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

interface IUserSavedSocialAccount {
  sub: string;
  name: string;
  identifier: string;
  picture: string;
  companyName: string;
  roleTitle: string;
}

const GoogleLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.46 0-.72-.06-1.41-.19-2.05H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64C4.57 19.72 8.01 22 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M6.3 13.75A5.99 5.99 0 0 1 5.98 12c0-.61.11-1.2.32-1.75V7.61H2.89A9.98 9.98 0 0 0 2 12c0 1.61.39 3.14 1.08 4.39l3.22-2.64z"
    />
    <path
      fill="#4285F4"
      d="M12 6.05c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 3.01 14.75 2 12 2 8.01 2 4.57 4.28 2.89 7.61l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2z"
    />
  </svg>
);

const AppleLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const LinkedInLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#0A66C2"
      d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
    />
  </svg>
);

type OAuthStage = 'account_chooser' | 'add_or_connect_account' | 'verify_secret';

export const SocialPhoneAuthSection: React.FC<ISocialPhoneAuthSectionProps> = ({
  mode,
  disabled = false,
}) => {
  const { loginWithSocial, sendPhoneOtp, verifyPhoneOtp, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeProvider, setActiveProvider] = useState<AuthProviderType | null>(null);
  const [stage, setStage] = useState<OAuthStage>('account_chooser');
  const [isProcessingJwt, setIsProcessingJwt] = useState<boolean>(false);

  // Danh sách tài khoản mạng xã hội DO CHÍNH NGƯỜI DÙNG ĐÃ THÊM vào dữ liệu (Không dùng tài khoản mẫu có sẵn)
  const [userSavedAccounts, setUserSavedAccounts] = useState<IUserSavedSocialAccount[]>([]);

  // Form kết nối & thêm tài khoản của người dùng vào dữ liệu
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [fullNameInput, setFullNameInput] = useState<string>('');
  const [companyInput, setCompanyInput] = useState<string>('NexusCRM Enterprise VN');
  const [roleTitleInput, setRoleTitleInput] = useState<string>('Quản trị viên Doanh nghiệp');
  const [secretInput, setSecretInput] = useState<string>('');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [smsOtpGenerated, setSmsOtpGenerated] = useState<string | null>(null);
  const [matchedExistingAccount, setMatchedExistingAccount] = useState<IStoredAccount | null>(
    null
  );
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    const scriptId = 'google-gsi-client-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  /**
   * Đọc danh sách tài khoản của chính người dùng từ dữ liệu (localStorage REGISTERED_USERS).
   * Tuyệt đối KHÔNG dùng bất kỳ tài khoản ảo có sẵn nào.
   */
  const loadAccountsFromDataStore = useCallback((provider: AuthProviderType | null): void => {
    if (!provider) {
      setUserSavedAccounts([]);
      return;
    }
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEYS.REGISTERED_USERS);
    if (!raw) {
      setUserSavedAccounts([]);
      return;
    }
    try {
      const stored = JSON.parse(raw) as IStoredAccount[];
      const filtered = stored
        .filter((item) => item.user.id.includes(`usr-${provider}`))
        .map((item): IUserSavedSocialAccount => ({
          sub: item.user.id,
          name: item.user.fullName,
          identifier:
            provider === 'phone'
              ? item.email.replace('@phone.nexuscrm.vn', '')
              : item.email,
          picture: item.user.avatarUrl,
          companyName: item.user.workspaceName,
          roleTitle: item.user.title,
        }));
      setUserSavedAccounts(filtered);
    } catch {
      setUserSavedAccounts([]);
    }
  }, []);

  /**
   * Lưu trực tiếp tài khoản mạng xã hội / SĐT của người dùng vào cơ sở dữ liệu (AUTH_STORAGE_KEYS.REGISTERED_USERS)
   */
  const persistAccountToDataStore = (
    provider: AuthProviderType,
    identifier: string,
    fullName: string,
    passwordOrToken: string,
    companyName: string,
    roleTitle: string
  ): IStoredAccount => {
    const normalizedEmail =
      provider === 'phone'
        ? `${normalizeVietnamPhone(identifier)}@phone.nexuscrm.vn`
        : identifier.trim().toLowerCase();

    const colorIdxMap: Record<AuthProviderType, number> = {
      google: 1,
      apple: 0,
      linkedin: 3,
      phone: 2,
    };

    const raw = window.localStorage.getItem(AUTH_STORAGE_KEYS.REGISTERED_USERS);
    const list: IStoredAccount[] = raw ? (JSON.parse(raw) as IStoredAccount[]) : [];

    const existingIdx = list.findIndex(
      (item) => item.email.toLowerCase() === normalizedEmail
    );

    const userObj: IUser = {
      id:
        existingIdx >= 0
          ? list[existingIdx].user.id
          : `usr-${provider}-${Date.now()}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      role: 'Super Admin',
      title: roleTitle.trim() || `Tài khoản ${provider.toUpperCase()}`,
      department: 'Ban Điều Hành & Kinh Doanh',
      avatarUrl: createAvatarSvgDataUri(fullName.trim(), colorIdxMap[provider]),
      workspaceName: companyName.trim() || 'NexusCRM Enterprise VN',
    };

    const storedRecord: IStoredAccount = {
      email: normalizedEmail,
      password: passwordOrToken,
      user: userObj,
    };

    if (existingIdx >= 0) {
      list[existingIdx] = storedRecord;
    } else {
      list.push(storedRecord);
    }

    window.localStorage.setItem(AUTH_STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(list));
    loadAccountsFromDataStore(provider);
    return storedRecord;
  };

  /**
   * Xóa một tài khoản khỏi danh sách lưu trữ nếu người dùng muốn gỡ bỏ
   */
  const handleRemoveSavedAccount = (identifier: string): void => {
    if (!activeProvider) return;
    const targetEmail =
      activeProvider === 'phone'
        ? `${normalizeVietnamPhone(identifier)}@phone.nexuscrm.vn`
        : identifier.toLowerCase();

    const raw = window.localStorage.getItem(AUTH_STORAGE_KEYS.REGISTERED_USERS);
    if (!raw) return;
    try {
      const list = JSON.parse(raw) as IStoredAccount[];
      const nextList = list.filter((item) => item.email.toLowerCase() !== targetEmail);
      window.localStorage.setItem(
        AUTH_STORAGE_KEYS.REGISTERED_USERS,
        JSON.stringify(nextList)
      );
      loadAccountsFromDataStore(activeProvider);
      showToast('info', 'Đã xóa tài khoản khỏi danh sách lưu trữ trên trình duyệt.');
    } catch {
      // ignore
    }
  };

  /**
   * Hàm callback handleCredentialResponse nhận JWT ID Token, giải mã bằng decodeJWT
   * và đăng nhập người dùng vào hệ thống (Đúng theo Bước 2 & Bước 6 Google Codelab)
   */
  const handleCredentialResponse = async (
    response: ICredentialResponse,
    companyName?: string,
    roleTitle?: string
  ): Promise<void> => {
    setIsProcessingJwt(true);
    try {
      const responsePayload = decodeJWT(response.credential);

      console.info('Encoded JWT ID token: ' + response.credential);
      console.info('Decoded JWT ID token fields:', {
        fullName: responsePayload.name,
        givenName: responsePayload.given_name,
        familyName: responsePayload.family_name,
        uniqueSubId: responsePayload.sub,
        profilePicture: responsePayload.picture,
        email: responsePayload.email,
      });

      if (response.provider === 'phone') {
        const phoneNum = responsePayload.email.replace('@phone.nexuscrm.vn', '');
        const otpRes = await sendPhoneOtp(phoneNum);
        await verifyPhoneOtp({
          phoneNumber: phoneNum,
          fullName: responsePayload.name,
          otpCode: otpRes.otpCode,
        });
      } else {
        await loginWithSocial({
          provider: response.provider,
          email: responsePayload.email,
          fullName: responsePayload.name,
          companyName,
          roleTitle,
        });
      }

      setActiveProvider(null);
      setIsProcessingJwt(false);
      showToast('success', 'Đăng nhập thành công! Chào mừng bạn vào hệ thống.');
      navigate('/dashboard');
    } catch {
      setIsProcessingJwt(false);
      setFieldError('Không thể xác minh mã thông báo nhận dạng JWT.');
      showToast('error', 'Không thể xác thực danh tính. Vui lòng thử lại.');
    }
  };

  const handleOpenProvider = (provider: AuthProviderType): void => {
    setActiveProvider(provider);
    loadAccountsFromDataStore(provider);
    setStage('account_chooser');
    setIdentifierInput('');
    setFullNameInput('');
    setCompanyInput('NexusCRM Enterprise VN');
    setRoleTitleInput('Quản trị viên Doanh nghiệp');
    setSecretInput('');
    setShowSecret(false);
    setSmsOtpGenerated(null);
    setMatchedExistingAccount(null);
    setFieldError(null);
    setStatusNotice(null);
  };

  const handleCloseOAuth = (): void => {
    if (isProcessingJwt) return;
    setActiveProvider(null);
    setFieldError(null);
    setStatusNotice(null);
  };

  /**
   * Khi người dùng nhấn vào tài khoản của chính họ trong "Chọn một tài khoản" -> Cấp JWT & đăng nhập ngay
   */
  const handleSelectSavedAccount = async (account: IUserSavedSocialAccount): Promise<void> => {
    if (!activeProvider) return;
    setFieldError(null);

    const emailClaim =
      activeProvider === 'phone'
        ? `${normalizeVietnamPhone(account.identifier)}@phone.nexuscrm.vn`
        : account.identifier;

    const jwtToken = createOidcIdToken({
      provider: activeProvider,
      sub: account.sub,
      email: emailClaim,
      name: account.name,
      picture: account.picture,
    });

    await handleCredentialResponse(
      {
        credential: jwtToken,
        select_by: 'user',
        provider: activeProvider,
      },
      account.companyName,
      account.roleTitle
    );
  };

  /**
   * Bước 1 trong mục "Sử dụng một tài khoản / số điện thoại khác":
   * Kết nối tới dữ liệu để kiểm tra tài khoản đã có hay thêm mới, sau đó chuyển sang xác thực mật khẩu / OTP
   */
  const handleConnectAccountStep1 = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!activeProvider) return;
    setFieldError(null);
    setStatusNotice(null);

    const rawId = identifierInput.trim();
    if (!rawId) {
      setFieldError(
        activeProvider === 'phone'
          ? 'Vui lòng nhập số điện thoại di động của bạn.'
          : 'Vui lòng nhập địa chỉ email tài khoản của bạn.'
      );
      return;
    }

    if (activeProvider === 'phone') {
      if (!isValidVietnamPhone(rawId)) {
        setFieldError('Số điện thoại không hợp lệ (phải gồm 10 chữ số, đầu 03, 05, 07, 08, 09).');
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawId)) {
        setFieldError('Địa chỉ email không đúng định dạng.');
        return;
      }
      if (
        activeProvider === 'google' &&
        !rawId.toLowerCase().endsWith('@gmail.com') &&
        !rawId.toLowerCase().endsWith('.vn')
      ) {
        setFieldError('Tài khoản Google phải sử dụng địa chỉ @gmail.com hoặc Google Workspace.');
        return;
      }
    }

    // Tra cứu trong cơ sở dữ liệu (localStorage REGISTERED_USERS)
    const lookupEmail =
      activeProvider === 'phone'
        ? `${normalizeVietnamPhone(rawId)}@phone.nexuscrm.vn`
        : rawId.toLowerCase();

    const rawStored = window.localStorage.getItem(AUTH_STORAGE_KEYS.REGISTERED_USERS);
    const list: IStoredAccount[] = rawStored ? (JSON.parse(rawStored) as IStoredAccount[]) : [];
    const found = list.find((a) => a.email.toLowerCase() === lookupEmail) ?? null;

    setMatchedExistingAccount(found);

    if (found) {
      setFullNameInput(found.user.fullName);
      setCompanyInput(found.user.workspaceName);
      setRoleTitleInput(found.user.title);
      setStatusNotice(
        `Đã tìm thấy tài khoản "${found.user.fullName}" trong dữ liệu. Vui lòng xác thực để tiếp tục.`
      );
    } else {
      if (fullNameInput.trim().length < 2) {
        setFieldError('Vui lòng nhập Họ và tên của bạn để liên kết tài khoản mới vào dữ liệu.');
        return;
      }
      setStatusNotice(
        `Đang khởi tạo liên kết dữ liệu mới cho tài khoản "${fullNameInput.trim()}".`
      );
    }

    if (activeProvider === 'phone') {
      try {
        const res = await sendPhoneOtp(rawId);
        setSmsOtpGenerated(res.otpCode);
        setSecretInput('');
      } catch {
        setFieldError('Không thể gửi mã OTP tới số điện thoại này.');
        return;
      }
    }

    setStage('verify_secret');
  };

  /**
   * Bước 2: Xác thực mật khẩu / OTP, lưu tài khoản của người dùng vào dữ liệu hệ thống,
   * và cho phép: (1) Lưu vào danh sách Chọn tài khoản, hoặc (2) Kết nối & Đăng nhập ngay!
   */
  const verifyAndSaveAccount = (): IStoredAccount | null => {
    if (!activeProvider) return null;
    setFieldError(null);

    const rawId = identifierInput.trim();

    if (activeProvider === 'phone') {
      if (!smsOtpGenerated || secretInput.trim() !== smsOtpGenerated) {
        setFieldError('Mã xác minh OTP không chính xác. Vui lòng kiểm tra lại.');
        return null;
      }
    } else {
      if (secretInput.length < 6) {
        setFieldError('Mật khẩu tài khoản phải có tối thiểu 6 ký tự.');
        return null;
      }

      if (
        matchedExistingAccount &&
        !matchedExistingAccount.password.startsWith('oauth_') &&
        matchedExistingAccount.password !== secretInput
      ) {
        setFieldError('Mật khẩu không chính xác với tài khoản đã lưu trong dữ liệu.');
        return null;
      }
    }

    const finalName =
      fullNameInput.trim() ||
      matchedExistingAccount?.user.fullName ||
      rawId.split('@')[0];

    return persistAccountToDataStore(
      activeProvider,
      rawId,
      finalName,
      secretInput,
      companyInput,
      roleTitleInput
    );
  };

  /**
   * Nút 1: Lưu tài khoản của người dùng vào dữ liệu và hiển thị ngay trong danh sách "Chọn một tài khoản"
   */
  const handleSaveToChooserListOnly = (): void => {
    const saved = verifyAndSaveAccount();
    if (!saved) return;
    const msg = `Đã thêm tài khoản "${saved.user.fullName}" vào dữ liệu thành công! Bạn có thể chọn để đăng nhập.`;
    setStatusNotice(msg);
    showToast('success', msg);
    setStage('account_chooser');
  };

  /**
   * Nút 2: Lưu tài khoản vào dữ liệu, phát hành JWT ID Token và đăng nhập thẳng vào hệ thống
   */
  const handleSaveAndLoginImmediately = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!activeProvider) return;
    const saved = verifyAndSaveAccount();
    if (!saved) return;

    const jwtToken = createOidcIdToken({
      provider: activeProvider,
      sub: saved.user.id,
      email: saved.email,
      name: saved.user.fullName,
      picture: saved.user.avatarUrl,
    });

    await handleCredentialResponse(
      {
        credential: jwtToken,
        select_by: 'btn',
        provider: activeProvider,
      },
      saved.user.workspaceName,
      saved.user.title
    );
  };

  const verbPrefix = mode === 'register' ? 'Đăng ký bằng' : 'Đăng nhập bằng';
  const isSignupBlue = mode === 'register';

  const getProviderHeaderInfo = () => {
    switch (activeProvider) {
      case 'google':
        return {
          title: 'Đăng nhập bằng Google',
          providerLabel: 'Google',
          icon: <GoogleLogoSvg size={18} />,
          inputLabel: 'Địa chỉ Email Google của bạn *',
          placeholder: 'tenban@gmail.com',
          anotherText: 'Sử dụng một tài khoản Google khác',
        };
      case 'apple':
        return {
          title: 'Đăng nhập bằng Tài khoản Apple',
          providerLabel: 'Apple ID',
          icon: <AppleLogoSvg size={18} />,
          inputLabel: 'Tài khoản Apple ID (iCloud Email) *',
          placeholder: 'tenban@icloud.com',
          anotherText: 'Sử dụng một tài khoản Apple khác',
        };
      case 'linkedin':
        return {
          title: 'Đăng nhập bằng LinkedIn',
          providerLabel: 'LinkedIn',
          icon: <LinkedInLogoSvg size={18} />,
          inputLabel: 'Email tài khoản LinkedIn của bạn *',
          placeholder: 'tenban@linkedin.com',
          anotherText: 'Sử dụng một tài khoản LinkedIn khác',
        };
      case 'phone':
      default:
        return {
          title: 'Xác thực bằng Số điện thoại',
          providerLabel: 'Số điện thoại',
          icon: <Phone size={17} color="#81C995" />,
          inputLabel: 'Số điện thoại di động của bạn (10 số) *',
          placeholder: '0912345678',
          anotherText: 'Sử dụng một số điện thoại khác',
        };
    }
  };

  const providerInfo = getProviderHeaderInfo();

  return (
    <div className={styles.gsiSection}>
      <div
        id="g_id_onload"
        data-auto_prompt="false"
        data-client_id="721724668570-nexuscrm.apps.googleusercontent.com"
        style={{ display: 'none' }}
      />

      <div className={styles.divider}>
        <span>HOẶC {mode === 'register' ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'} VỚI</span>
      </div>

      {/* Lưới 2x2 nút bấm chuẩn Google Codelab Bước 7 */}
      <div className={styles.gsiGrid}>
        <button
          type="button"
          className={`${styles.gsiButton} ${
            isSignupBlue ? styles['gsiButton--filledBlue'] : ''
          }`}
          disabled={disabled || isLoading}
          onClick={() => handleOpenProvider('google')}
        >
          <span className={styles.gsiButton__iconWrap}>
            <GoogleLogoSvg size={16} />
          </span>
          <span className={styles.gsiButton__label}>{verbPrefix} Google</span>
        </button>

        <button
          type="button"
          className={styles.gsiButton}
          disabled={disabled || isLoading}
          onClick={() => handleOpenProvider('apple')}
        >
          <span className={styles.gsiButton__iconWrap}>
            <AppleLogoSvg size={17} />
          </span>
          <span className={styles.gsiButton__label}>{verbPrefix} Apple</span>
        </button>

        <button
          type="button"
          className={styles.gsiButton}
          disabled={disabled || isLoading}
          onClick={() => handleOpenProvider('linkedin')}
        >
          <span className={styles.gsiButton__iconWrap}>
            <LinkedInLogoSvg size={17} />
          </span>
          <span className={styles.gsiButton__label}>{verbPrefix} LinkedIn</span>
        </button>

        <button
          type="button"
          className={styles.gsiButton}
          disabled={disabled || isLoading}
          onClick={() => handleOpenProvider('phone')}
        >
          <span className={styles.gsiButton__iconWrap} style={{ color: '#059669' }}>
            <Phone size={16} />
          </span>
          <span className={styles.gsiButton__label}>{verbPrefix} SĐT</span>
        </button>
      </div>

      {/* Cửa sổ OAuth kết nối dữ liệu thực tế của người dùng */}
      <AnimatePresence>
        {activeProvider !== null && (
          <div
            className={styles.oauthBackdrop}
            role="dialog"
            aria-modal="true"
            aria-label={providerInfo.title}
          >
            <motion.div
              className={styles.oauthDialog}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.16 }}
            >
              {isProcessingJwt && (
                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} />
                </div>
              )}

              <div className={styles.oauthTopBar}>
                <div className={styles.oauthTopBar__brand}>
                  {providerInfo.icon}
                  <span>{providerInfo.title}</span>
                </div>
                <button
                  type="button"
                  className={styles.oauthTopBar__close}
                  onClick={handleCloseOAuth}
                  aria-label="Đóng"
                >
                  <X size={16} />
                </button>
              </div>

              <div className={styles.oauthContent}>
                {/* MÀN HÌNH 1: CHỌN MỘT TÀI KHOẢN (Chỉ hiển thị các tài khoản do chính người dùng đã thêm vào dữ liệu) */}
                {stage === 'account_chooser' && (
                  <>
                    <div className={styles.appIdentity}>
                      <img
                        src={logoUrl}
                        alt="NexusCRM"
                        className={styles.appIdentity__logo}
                      />
                      <h2 className={styles.appIdentity__title}>Chọn một tài khoản</h2>
                      <p className={styles.appIdentity__subtitle}>
                        để tiếp tục tới <strong>NexusCRM</strong>
                      </p>
                    </div>

                    {statusNotice && (
                      <div className={styles.dbStatusBadge}>
                        <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                        <span>{statusNotice}</span>
                      </div>
                    )}

                    <div className={styles.chooserList}>
                      {userSavedAccounts.length === 0 ? (
                        <div className={styles.emptyAccountsHint}>
                          Chưa có tài khoản {providerInfo.providerLabel} nào được kết nối trên
                          trình duyệt này. Hãy nhấn vào mục bên dưới để thêm tài khoản của bạn
                          vào dữ liệu hệ thống.
                        </div>
                      ) : (
                        userSavedAccounts.map((acc) => (
                          <div key={acc.sub} className={styles.chooserRowWrap}>
                            <button
                              type="button"
                              className={styles.chooserItem}
                              disabled={isProcessingJwt}
                              onClick={() => void handleSelectSavedAccount(acc)}
                            >
                              <img
                                src={acc.picture}
                                alt={acc.name}
                                className={styles.chooserItem__avatar}
                              />
                              <div className={styles.chooserItem__text}>
                                <span className={styles.chooserItem__name}>{acc.name}</span>
                                <span className={styles.chooserItem__email}>
                                  {acc.identifier}
                                </span>
                              </div>
                            </button>
                            <button
                              type="button"
                              className={styles.removeAccBtn}
                              title="Gỡ tài khoản này khỏi danh sách"
                              onClick={() => handleRemoveSavedAccount(acc.identifier)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}

                      {/* Nút "Sử dụng một tài khoản / số điện thoại khác" -> Mở form kết nối & thêm tài khoản vào dữ liệu */}
                      <button
                        type="button"
                        className={styles.chooserItem}
                        disabled={isProcessingJwt}
                        onClick={() => {
                          setFieldError(null);
                          setStatusNotice(null);
                          setStage('add_or_connect_account');
                        }}
                      >
                        <span className={styles.chooserItem__iconCircle}>
                          <UserPlus size={18} />
                        </span>
                        <div className={styles.chooserItem__text}>
                          <span className={styles.chooserItem__name}>
                            {providerInfo.anotherText}
                          </span>
                          <span className={styles.chooserItem__email}>
                            Kết nối dữ liệu & thêm tài khoản {providerInfo.providerLabel} của bạn
                          </span>
                        </div>
                      </button>
                    </div>

                    <p className={styles.policyCopy}>
                      Để tiếp tục, nhà cung cấp danh tính sẽ chia sẻ tên, địa chỉ email và ảnh
                      hồ sơ của bạn với <span>NexusCRM</span> thông qua mã thông báo JWT.
                    </p>
                  </>
                )}

                {/* MÀN HÌNH 2: FORM KẾT NỐI ĐẾN DỮ LIỆU & THÊM TÀI KHOẢN CỦA NGƯỜI DÙNG */}
                {stage === 'add_or_connect_account' && (
                  <form
                    onSubmit={(e) => void handleConnectAccountStep1(e)}
                    className={styles.stepForm}
                    noValidate
                  >
                    <div className={styles.appIdentity}>
                      <img
                        src={logoUrl}
                        alt="NexusCRM"
                        className={styles.appIdentity__logo}
                      />
                      <h2 className={styles.appIdentity__title}>
                        Kết nối tài khoản {providerInfo.providerLabel}
                      </h2>
                      <p className={styles.appIdentity__subtitle}>
                        Đăng nhập hoặc đăng ký tài khoản {providerInfo.providerLabel} của bạn vào
                        dữ liệu <strong>NexusCRM</strong>
                      </p>
                    </div>

                    <div className={styles.outlinedField}>
                      <label htmlFor="oauth-user-identifier">{providerInfo.inputLabel}</label>
                      <input
                        id="oauth-user-identifier"
                        type={activeProvider === 'phone' ? 'tel' : 'email'}
                        className={styles.outlinedInput}
                        value={identifierInput}
                        onChange={(e) => {
                          setIdentifierInput(e.target.value);
                          setFieldError(null);
                        }}
                        placeholder={providerInfo.placeholder}
                        autoFocus
                      />
                    </div>

                    <div className={styles.outlinedField}>
                      <label htmlFor="oauth-user-fullname">Họ và tên chủ tài khoản *</label>
                      <input
                        id="oauth-user-fullname"
                        type="text"
                        className={styles.outlinedInput}
                        value={fullNameInput}
                        onChange={(e) => {
                          setFullNameInput(e.target.value);
                          setFieldError(null);
                        }}
                        placeholder="Nhập họ và tên thật của bạn"
                      />
                    </div>

                    <div className={styles.formGrid2}>
                      <div className={styles.outlinedField}>
                        <label htmlFor="oauth-user-company">Công ty / Tổ chức</label>
                        <input
                          id="oauth-user-company"
                          type="text"
                          className={styles.outlinedInput}
                          value={companyInput}
                          onChange={(e) => setCompanyInput(e.target.value)}
                          placeholder="Tên doanh nghiệp"
                        />
                      </div>

                      <div className={styles.outlinedField}>
                        <label htmlFor="oauth-user-role">Chức danh</label>
                        <input
                          id="oauth-user-role"
                          type="text"
                          className={styles.outlinedInput}
                          value={roleTitleInput}
                          onChange={(e) => setRoleTitleInput(e.target.value)}
                          placeholder="Chức vụ của bạn"
                        />
                      </div>
                    </div>

                    {fieldError && (
                      <div className={styles.fieldError} role="alert">
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{fieldError}</span>
                      </div>
                    )}

                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => {
                          setFieldError(null);
                          setStage('account_chooser');
                        }}
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={isLoading}
                      >
                        Tiếp theo
                      </button>
                    </div>
                  </form>
                )}

                {/* MÀN HÌNH 3: XÁC MINH MẬT KHẨU / OTP -> LƯU VÀO DỮ LIỆU HOẶC ĐĂNG NHẬP NGAY */}
                {stage === 'verify_secret' && (
                  <form
                    onSubmit={(e) => void handleSaveAndLoginImmediately(e)}
                    className={styles.stepForm}
                    noValidate
                  >
                    <div className={styles.appIdentity}>
                      <h2 className={styles.appIdentity__title}>
                        Xác nhận liên kết dữ liệu
                      </h2>
                      <button
                        type="button"
                        className={styles.userChip}
                        onClick={() => {
                          setFieldError(null);
                          setStage('add_or_connect_account');
                        }}
                      >
                        <img
                          src={createAvatarSvgDataUri(fullNameInput || identifierInput, 1)}
                          alt=""
                          className={styles.userChip__avatar}
                        />
                        <span>
                          {fullNameInput} ({identifierInput})
                        </span>
                      </button>
                    </div>

                    {statusNotice && (
                      <div className={styles.dbStatusBadge}>
                        <Database size={14} style={{ flexShrink: 0 }} />
                        <span>{statusNotice}</span>
                      </div>
                    )}

                    {activeProvider === 'phone' && smsOtpGenerated && (
                      <div className={styles.smsHintBox}>
                        <span>
                          <CheckCircle2
                            size={13}
                            style={{ display: 'inline', marginRight: 5, color: '#81C995' }}
                          />
                          Mã SMS OTP gửi tới {normalizeVietnamPhone(identifierInput)}:{' '}
                          <strong>{smsOtpGenerated}</strong>
                        </span>
                        <button
                          type="button"
                          className={styles.ghostBtn}
                          onClick={() => {
                            setSecretInput(smsOtpGenerated);
                            setFieldError(null);
                          }}
                        >
                          Điền mã
                        </button>
                      </div>
                    )}

                    <div className={styles.outlinedField}>
                      <label htmlFor="oauth-user-secret">
                        {activeProvider === 'phone'
                          ? 'Nhập mã xác thực OTP (6 chữ số) *'
                          : `Mật khẩu tài khoản ${providerInfo.providerLabel} (tối thiểu 6 ký tự) *`}
                      </label>
                      <div className={styles.outlinedInputWrap}>
                        <input
                          id="oauth-user-secret"
                          type={
                            activeProvider === 'phone'
                              ? 'text'
                              : showSecret
                              ? 'text'
                              : 'password'
                          }
                          className={styles.outlinedInput}
                          value={secretInput}
                          onChange={(e) => {
                            setSecretInput(e.target.value);
                            setFieldError(null);
                          }}
                          placeholder={
                            activeProvider === 'phone'
                              ? 'Nhập 6 chữ số OTP'
                              : 'Nhập mật khẩu để lưu & xác thực'
                          }
                          autoFocus
                        />
                        {activeProvider !== 'phone' && (
                          <button
                            type="button"
                            className={styles.oauthTopBar__close}
                            style={{ position: 'absolute', right: 8 }}
                            onClick={() => setShowSecret((p) => !p)}
                            aria-label={showSecret ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                      {fieldError && (
                        <div className={styles.fieldError} role="alert">
                          <AlertCircle size={14} style={{ flexShrink: 0 }} />
                          <span>{fieldError}</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.ghostBtn}
                        onClick={() => {
                          setFieldError(null);
                          setStage('add_or_connect_account');
                        }}
                      >
                        Quay lại
                      </button>

                      <div className={styles.actionRowRight}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          disabled={isProcessingJwt || isLoading}
                          onClick={handleSaveToChooserListOnly}
                        >
                          Lưu vào danh sách
                        </button>
                        <button
                          type="submit"
                          className={styles.primaryBtn}
                          disabled={isProcessingJwt || isLoading}
                        >
                          {isProcessingJwt ? 'Đang kết nối...' : 'Kết nối & Đăng nhập'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
