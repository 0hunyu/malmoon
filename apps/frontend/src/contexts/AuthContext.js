// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/** JWT 파싱 */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('❌ Failed to parse JWT:', e);
    return null;
  }
};

/** /me 호출: 프로젝트 응답 스키마에 맞춰 키 매핑 */
const fetchMe = async (accessToken) => {
  try {
    const res = await fetch('/api/v1/members/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();

    // 백엔드 응답 필드 변동 대비
    const profile =
      Number(data.profile ?? data.profile_image_id ?? data.profileImageId ?? 1) || 1;

    const profileImageUrl =
      data.profileImageUrl ?? data.profile_image_url ?? null;

    const nickname =
      data.nickname ?? data.nickName ?? data.userNickname ?? null;

    const name = data.name ?? null;
    const email = data.email ?? null;

    return { profile, profileImageUrl, nickname, name, email };
  } catch (e) {
    console.error('❌ fetchMe error:', e);
    return { profile: 1, profileImageUrl: null, nickname: null, name: null, email: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const navigate = useNavigate();

  // 한 탭 식별용(선택)
  const providerIdRef = useRef(Math.random().toString(36).slice(2));

  /**
   * 전역 user 갱신 + localStorage 반영
   * 아바타 캐시 무력화(_avatarVer)는 프로필 관련 변경시에만 증가
   */
  const updateUser = (patch) => {
    setUser((prev) => {
      const avatarChanged = ('profile' in patch) || ('profileImageUrl' in patch);
      const next = {
        ...prev,
        ...patch,
        _avatarVer: avatarChanged ? Date.now() : (prev?._avatarVer ?? 0),
      };
      try {
        localStorage.setItem('currentUser', JSON.stringify(next));
      } catch (e) {
        console.error('❌ Failed to save user to localStorage:', e);
      }
      return next;
    });
  };

  /** 서버 /me 로 최신화 */
  const refreshMe = async () => {
    const token = user?.accessToken;
    if (!token) return;
    const me = await fetchMe(token);
    updateUser(me);
  };

  /** 초기 복원: localStorage → 상태, 부족한 필드는 /me 로 보강 */
  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);

        // 프로필/프로필URL/닉네임 중 하나라도 없으면 /me 로 보강
        if (
          parsed?.accessToken && (
            !parsed?.profile ||
            !parsed?.profileImageUrl ||
            parsed?.nickname == null
          )
        ) {
          fetchMe(parsed.accessToken).then((me) => updateUser(me));
        }
      } catch (e) {
        console.error('❌ Failed to parse user from localStorage:', e);
        localStorage.removeItem('currentUser');
      }
    }
    setIsAuthReady(true); // 초기 로딩 완료 시점
  }, []);

  /**
   * login: 외부에서 발급받은 accessToken/기본 정보로 세팅한 뒤 /me 보강
   * 사용 예: login({ userEmail, accessToken, memberId, birthDate })
   */
  const login = async ({ userEmail, accessToken, memberId, birthDate }) => {
    const decoded = parseJwt(accessToken);
    const rawType = decoded?.userType || decoded?.role || null;

    let userType;
    if (rawType === 'ROLE_CLIENT') userType = 'user';
    else if (rawType === 'ROLE_THERAPIST') userType = 'therapist';
    else userType = rawType?.toLowerCase() || null;

    // email 키를 통일해서 저장(호환 위해 userEmail도 유지)
    const baseUser = {
      email: userEmail,
      userEmail,
      accessToken,
      userType,
      memberId,
      birthDate,
    };
    updateUser(baseUser);

    try {
      const me = await fetchMe(accessToken);
      updateUser(me);
    } catch (e) {
      console.error('❌ fetchMe error on login:', e);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!(user && user.accessToken), // 토큰 기준으로 로그인 판단
        userType: user?.userType || null,
        login,
        logout,
        isAuthReady,
        updateUser,   // 마이페이지에서 프로필 변경 후 updateUser({ profile: N }) 호출
        refreshMe,
        providerId: providerIdRef.current,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
