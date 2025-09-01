import React, { useState, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from './contexts/AuthContext';

import './App.css';

import NavBar from './components/navigation/NavBar';
import ChatModal from './components/modals/ChatModal';
import Footer from "./components/navigation/Footer";
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import GuidePage from './pages/GuidePage';
import MyInfoPage from './pages/MyInfoPage';

import TherapistMyInfoPage from './pages/Therapist/MyPage/TherapistMyInfoPage';
import TherapistSchedulePage from './pages/Therapist/MyPage/TherapistSchedulePage';
import TherapistRegisterSchedulePage from './pages/Therapist/MyPage/TherapistRegisterSchedulePage';
import TherapistMatchingPage from './pages/Therapist/MyPage/TherapistMatchingPage';
import TherapistToolsPage from './pages/Therapist/MyPage/TherapistToolsPage';

import TherapistSessionRoom from './pages/Therapist/TherapistSessionRoom';
import TherapistFeedbackPage from './pages/Therapist/MyPage/TherapistFeedbackPage';

import TherapistBookingPage from './pages/User/Booking/TherapistBookingPage';
import UserMyInfoPage from './pages/User/MyPage/UserMyInfoPage';
import UserMatchingPage from './pages/User/MyPage/UserMatchingPage';
import UserSchedulePage from './pages/User/MyPage/UserSchedulePage';
import UserSessionRoom from './pages/User/UserSessionRoom';
import UserAssessmentPage from './pages/User/UserAssessmentPage';

import UserSignUp from './pages/signup/UserSignUp';
import TherapistSignUp from './pages/signup/TherapistSignUp';

import char1 from "./logoimage/char1.png";
import char2 from "./logoimage/char2.png";
import char3 from "./logoimage/char3.png";
import char4 from "./logoimage/char4.png";
import char5 from "./logoimage/char5.png";
import char6 from "./logoimage/char6.png";

/** 캐릭터 메타(고정 id로 관리) */
const characterData = [
  { id: "bear", src: char1, bgColor: "#f3eade", buttonColors: { primaryBg: "#b38b6d", primaryText: "#ffffff", primaryHoverBg: "#8d6d53", secondaryBg: "#8d6d53", secondaryText: "#ffffff", secondaryHoverBg: "#5a463c", infoBg: "#87CEEB", infoText: "#ffffff", infoHoverBg: "#6CA6CD", successBg: "#90EE90", successText: "#ffffff", successHoverBg: "#7CCD7C", dangerBg: "#FF6347", dangerText: "#ffffff", dangerHoverBg: "#E5533D", calendarSelectedDayBg: "#b38b6d" } },
  { id: "duck", src: char2, bgColor: "#fff9c4", buttonColors: { primaryBg: "#ffd600", primaryText: "#000000", primaryHoverBg: "#f9a825", secondaryBg: "#f9a825", secondaryText: "#ffffff", secondaryHoverBg: "#212121", infoBg: "#87CEEB", infoText: "#ffffff", infoHoverBg: "#6CA6CD", successBg: "#90EE90", successText: "#ffffff", successHoverBg: "#7CCD7C", dangerBg: "#FF6347", dangerText: "#ffffff", dangerHoverBg: "#E5533D", calendarSelectedDayBg: "#ffd600" } },
  { id: "wolf", src: char3, bgColor: "#eceff1", buttonColors: { primaryBg: "#78909c", primaryText: "#ffffff", primaryHoverBg: "#455a64", secondaryBg: "#455a64", secondaryText: "#ffffff", secondaryHoverBg: "#263238", infoBg: "#87CEEB", infoText: "#ffffff", infoHoverBg: "#6CA6CD", successBg: "#90EE90", successText: "#ffffff", successHoverBg: "#7CCD7C", dangerBg: "#FF6347", dangerText: "#ffffff", dangerHoverBg: "#E5533D", calendarSelectedDayBg: "#78909c" } },
  { id: "dog", src: char4, bgColor: "#fffde7", buttonColors: { primaryBg: "#a1887f", primaryText: "#ffffff", primaryHoverBg: "#795548", secondaryBg: "#795548", secondaryText: "#ffffff", secondaryHoverBg: "#4e342e", infoBg: "#87CEEB", infoText: "#ffffff", infoHoverBg: "#6CA6CD", successBg: "#90EE90", successText: "#ffffff", successHoverBg: "#7CCD7C", dangerBg: "#FF6347", dangerText: "#ffffff", dangerHoverBg: "#E5533D", calendarSelectedDayBg: "#a1887f" } },
  { id: "parrot", src: char5, bgColor: "#f1f8e9", buttonColors: { primaryBg: "#aed581", primaryText: "#ffffff", primaryHoverBg: "#66bb6a", secondaryBg: "#66bb6a", secondaryText: "#ffffff", secondaryHoverBg: "#43a047", infoBg: "#87CEEB", infoText: "#ffffff", infoHoverBg: "#6CA6CD", successBg: "#90EE90", successText: "#ffffff", successHoverBg: "#7CCD7C", dangerBg: "#FF6347", dangerText: "#ffffff", dangerHoverBg: "#E5533D", calendarSelectedDayBg: "#aed581" } },
  { id: "penguin", src: char6, bgColor: "#e3f2fd", buttonColors: { primaryBg: "#64b5f6", primaryText: "#ffffff", primaryHoverBg: "#2196f3", secondaryBg: "#2196f3", secondaryText: "#ffffff", secondaryHoverBg: "#0d47a1", infoBg: "#87CEEB", infoText: "#ffffff", infoHoverBg: "#6CA6CD", successBg: "#90EE90", successText: "#ffffff", successHoverBg: "#7CCD7C", dangerBg: "#FF6347", dangerText: "#ffffff", dangerHoverBg: "#E5533D", calendarSelectedDayBg: "#64b5f6" } },
];

/** 백엔드의 프로필 숫자(id) ↔ 프론트 캐릭터 id 매핑 (순서와 무관) */
const PROFILE_MAP = {
  1: "bear",
  5: "duck",
  2: "wolf",
  3: "dog",
  4: "parrot",
  6: "penguin",
};

const getRandomCharacter = (current) => {
  let next;
  do {
    const idx = Math.floor(Math.random() * characterData.length);
    next = characterData[idx];
  } while (current && next.id === current.id);
  return next;
};

const getCharacterByProfile = (profileNumber) => {
  const key = PROFILE_MAP[profileNumber];
  return characterData.find(c => c.id === key) || characterData[0];
};

function App() {
  const { isAuthReady, user } = useAuth();
  const location = useLocation();

  const [showChatModal, setShowChatModal] = useState(false);
  const [guestCharacter, setGuestCharacter] = useState(() => getRandomCharacter());

  // ✅ 오늘의 수업 시작을 위한 상태 추가
  const [startSessionCallback, setStartSessionCallback] = useState(null);

  const isLoggedIn = !!(user && user.accessToken);

  const setCharacterIfGuest = (updater) => {
    if (isLoggedIn) return;
    setGuestCharacter(prev =>
      typeof updater === 'function' ? updater(prev) : updater
    );
  };

  const handleShowChatModal = () => setShowChatModal(true);
  const handleCloseChatModal = () => setShowChatModal(false);

  // ✅ 캐릭터 오버레이 클릭 핸들러
  const handleOverlayClick = () => {
    if (startSessionCallback) {
      startSessionCallback();
    }
  };

  if (!isAuthReady) return null;

  const effectiveCharacter = isLoggedIn
    ? getCharacterByProfile(user.profile)
    : guestCharacter;

  const isVideoChatPage = location.pathname.startsWith('/session/') || location.pathname === '/user/session';
  const isHomePage = location.pathname === '/';

  // ✅ 홈페이지이고 수업이 있을 때만 클릭 가능하도록 class 추가
  const overlayClassName = `character-overlay ${isHomePage && startSessionCallback ? 'clickable' : ''}`;

  const contentClassName = isVideoChatPage ? 'content full-screen' : 'content';

  return (
    <div
      className="App"
      style={{
        "--app-bg-color": effectiveCharacter.bgColor,
        "--bg-character": `url(${effectiveCharacter.src})`,
        "--btn-primary-bg": effectiveCharacter.buttonColors.primaryBg,
        "--btn-primary-text": effectiveCharacter.buttonColors.primaryText,
        "--btn-primary-hover-bg": effectiveCharacter.buttonColors.primaryHoverBg,
        "--btn-secondary-bg": effectiveCharacter.buttonColors.secondaryBg,
        "--btn-secondary-text": effectiveCharacter.buttonColors.secondaryText,
        "--btn-secondary-hover-bg": effectiveCharacter.buttonColors.secondaryHoverBg,
        "--btn-info-bg": effectiveCharacter.buttonColors.infoBg,
        "--btn-info-text": effectiveCharacter.buttonColors.infoText,
        "--btn-info-hover-bg": effectiveCharacter.buttonColors.infoHoverBg,
        "--btn-success-bg": effectiveCharacter.buttonColors.successBg,
        "--btn-success-text": effectiveCharacter.buttonColors.successText,
        "--btn-success-hover-bg": effectiveCharacter.buttonColors.successHoverBg,
        "--btn-danger-bg": effectiveCharacter.buttonColors.dangerBg,
        "--btn-danger-text": effectiveCharacter.buttonColors.dangerText,
        "--btn-danger-hover-bg": effectiveCharacter.buttonColors.dangerHoverBg,
        "--calendar-selected-day-bg": effectiveCharacter.buttonColors.calendarSelectedDayBg,
      }}
    >
      { !isVideoChatPage && (
        <NavBar
          setCurrentCharacter={setCharacterIfGuest}
          getRandomCharacter={getRandomCharacter}
          onShowChat={handleShowChatModal}
        />
      )}

      <main className={contentClassName}>
        <Routes>
          {/* ✅ HomePage에 수업 시작 콜백 함수를 전달 */}
          <Route path="/" element={<HomePage setStartSessionCallback={setStartSessionCallback} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/info" element={<h1>안내</h1>} />
          <Route path="/test" element={<h1>간이 언어평가</h1>} />
          <Route path="/my-info" element={<MyInfoPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/signup/user" element={<UserSignUp />} />
          <Route path="/signup/therapist" element={<TherapistSignUp />} />

          {/* 치료사 전용 보호 라우트 */}
          <Route element={<ProtectedRoute allowedRoles={['therapist']} />}>
            <Route path="/therapist/mypage/info" element={<TherapistMyInfoPage />} />
            <Route path="/therapist/mypage/matching" element={<TherapistMatchingPage />} />
            <Route path="/therapist/mypage/manage" element={<TherapistFeedbackPage />} />
            <Route path="/therapist/mypage/tools" element={<TherapistToolsPage />} />
            <Route path="/therapist/mypage/schedule" element={<TherapistSchedulePage />} />
            <Route path="/therapist/mypage/schedule/:clientId" element={<TherapistSchedulePage />} />
            <Route path="/therapist/register-schedule" element={<TherapistRegisterSchedulePage />} />
            <Route path="/therapist/profile-settings" element={<h1>치료사 프로필 설정 페이지 (구현 예정)</h1>} />
            <Route path="/session/:roomId" element={<TherapistSessionRoom />} />
            <Route path="/therapist/feedback" element={<TherapistFeedbackPage />} />
          </Route>

          {/* 사용자 전용 보호 라우트 */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
            <Route path="/user/mypage/info" element={<UserMyInfoPage />} />
            <Route path="/user/mypage/matching" element={<UserMatchingPage />} />
            <Route path="/user/mypage/schedule" element={<UserSchedulePage />} />
            <Route path="/user/session" element={<UserSessionRoom />} />
            <Route path="/assessment" element={<UserAssessmentPage />} />
            <Route path="/user/profile-settings" element={<h1>사용자 프로필 설정 페이지 (구현 예정)</h1>} />
            <Route path="/user/booking/:therapistId" element={<TherapistBookingPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<h1>404: 페이지를 찾을 수 없습니다.</h1>} />
        </Routes>
      </main>

      { !isVideoChatPage && <Footer /> }
      <ChatModal show={showChatModal} handleClose={handleCloseChatModal} />

      { !isVideoChatPage && (
        <div
          className={overlayClassName}
          aria-hidden="true"
          // ✅ 클릭 핸들러 추가
          onClick={handleOverlayClick}
          role={isHomePage && startSessionCallback ? "button" : "presentation"}
        />
      )}
    </div>
  );
}

export default App;
