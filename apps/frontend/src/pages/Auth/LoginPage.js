import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './LoginPage.css';
import { useAuth } from '../../contexts/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (password.trim().length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      // 1) 로그인
      const res = await api.post(`/auth/login`, { email, password });
      const { accessToken, memberId, birthDate, role: roleFromLogin } = res.data;

      // 2) 컨텍스트 저장
      await login({ userEmail: email, accessToken, memberId, birthDate });

      // 3) 역할 확인
      let role = roleFromLogin;
      if (!role) {
        try {
          const me = await api.get(`/members/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          role = me.data?.role ?? me.data?.memberType ?? me.data?.type;
        } catch {
          try {
            const me2 = await api.get(`/members/${memberId}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            role = me2.data?.role ?? me2.data?.memberType ?? me2.data?.type;
          } catch {}
        }
      }

      // 4) 역할별 이동
      const isUser = String(role || '').toLowerCase() === 'user';
      const to = isUser
        ? '/user/mypage/schedule'
        : '/therapist/mypage/schedule';

      navigate(to, { replace: true });
    } catch (err) {
      console.error(err);
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="login-layout">
      {/* 왼쪽: 배경 이미지 섹션 */}
      <div className="login-hero" aria-hidden="true" />

      {/* 오른쪽: 로그인 폼 */}
      <div className="login-panel">
        <div className="login-form-card">
          <h2>로그인</h2>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">이메일 주소</label>
              <input
                type="email"
                id="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={30}
              />
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="login-link-text">
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
