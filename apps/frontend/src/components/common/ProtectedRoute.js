import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // AuthContext의 useAuth 훅 임포트

// ProtectedRoute 컴포넌트: 로그인 상태에 따라 접근을 제어합니다.
// allowedRoles는 선택 사항으로, 특정 역할(예: 'therapist', 'user')만 접근 가능하도록 할 때 사용합니다.
function ProtectedRoute({ allowedRoles }) {
  const { isLoggedIn, userType, user } = useAuth(); // AuthContext에서 로그인 상태와 사용자 타입 가져오기

  // 1. 로그인되어 있지 않다면 로그인 페이지로 리다이렉트
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />; // replace: 현재 히스토리 엔트리를 대체하여 뒤로가기 방지
  }

  // 2. allowedRoles가 정의되어 있다면, 사용자 타입이 허용된 역할에 포함되는지 확인
  //    예: <ProtectedRoute allowedRoles={['therapist']}>
  
  //        </ProtectedRoute>
  if (allowedRoles && !allowedRoles.includes(userType)) {
    // 허용되지 않은 역할이라면 홈 페이지나 접근 거부 페이지로 리다이렉트
    // 실제 서비스에서는 에러 페이지나 권한 없음 페이지로 안내하는 것이 좋습니다.
    console.warn(`Access Denied: User type '${userType}' not in allowed roles (${allowedRoles.join(', ')}) for path.`);
    return <Navigate to="/" replace />; // 또는 특정 에러 페이지로
  }

  // 3. 모든 조건을 통과하면 자식 컴포넌트 (라우트 요소)를 렌더링
  return <Outlet />; // Nested routes를 렌더링하기 위해 Outlet 사용
}

export default ProtectedRoute;