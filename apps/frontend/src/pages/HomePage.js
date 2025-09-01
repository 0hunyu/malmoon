import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import './HomePage.css';

import penguin from '../logoimage/penguin.png';
import bear from '../logoimage/bear.png';
import duck from '../logoimage/duck.png';
import wolf from '../logoimage/wolf.png';
import puppy from '../logoimage/puppy.png';
import parrot from '../logoimage/parrot.png';

import slider1 from '../logoimage/slider1.png';
import slider2 from '../logoimage/slider2.png';
import slider3 from '../logoimage/slider3.png';

import logo from '../logoimage/logo.png';

const ImageSlider = () => {
  const images = [slider1, slider2, slider3];
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 10000);
    return () => clearInterval(slideInterval);
  }, []);

  return (
    <div className="slider-wrapper">
      <div className="slider-frame">
        <div className="slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {images.map((src, i) => (
            <img key={i} src={src} alt={`slide-${i}`} className="slide-image" />
          ))}
        </div>

        <button className="arrow left" onClick={prevSlide} aria-label="이전 슬라이드">
          &lt;
        </button>
        <button className="arrow right" onClick={nextSlide} aria-label="다음 슬라이드">
          &gt;
        </button>
      </div>

      <div className="slider-indicators">
        {images.map((_, i) => (
          <span
            key={i}
            className={`indicator ${i === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(i)}
          ></span>
        ))}
      </div>
    </div>
  );
};

const CharacterCard = ({ name, image, desc }) => {
  return (
    <div className="character-item">
      <div className="character-avatar">
        <img src={image} alt={name} />
      </div>
      <div className="character-caption">
        <h3 className="character-name">{name}</h3>
        <p className="character-desc">{desc}</p>
      </div>
    </div>
  );
};

function HomePage({ setStartSessionCallback }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startSession, setStartSession] = useState(null);

  useEffect(() => {
    if (!user || !user.accessToken) {
      setStartSessionCallback(null);
      setStartSession(null);
      return;
    }

    const fetchSchedules = async () => {
      try {
        const res = await api.get('/schedule/me/today', {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });

        const todaySchedules = res.data || [];
        if (todaySchedules.length > 0) {
          const firstSchedule = todaySchedules[0];
          const bookingId = firstSchedule.id;

          const sessionFunc = () => {
            navigate('/user/session', { state: { bookingId } });
          };

          setStartSession(() => sessionFunc);
          setStartSessionCallback(() => sessionFunc);
        } else {
          setStartSession(null);
          setStartSessionCallback(null);
        }
      } catch (err) {
        console.error('Failed to fetch today schedules:', err);
        setStartSession(null);
        setStartSessionCallback(null);
      }
    };

    fetchSchedules();
    return () => {
      setStartSession(null);
      setStartSessionCallback(null);
    };
  }, [user, setStartSessionCallback, navigate]);

  return (
    <div className="home-page main-container">
      <div className="logo-header">
        <img src={logo} alt="로고" className="main-logo" />
      </div>

      <div className="homepage-subtitle">
        <p>
          온라인 의사소통 클리닉 <span className="highlight-word">
            <span className="red-text">말</span><span className="blue-text">문</span>
          </span>을 통해<br />
          언어치료사와 1:1 맞춤수업을 시작해보세요.
        </p>
      </div>

      <ImageSlider />

      {/* ✅ 캐릭터 말풍선 버튼 */}
      {startSession && (
        <div className="character-overlay clickable" onClick={startSession}>
          <div className="character-bubble">수업 바로가기!</div>
        </div>
      )}

      <section className="about-section">
        <h2 className="section-title">우리는 무엇을 하나요?</h2>
        <p>
          ‘말문’은 언어 발달이 필요한 아동과 전문 언어치료사를 연결해주는 서비스입니다.
          아이들이 재미있고 친근한 캐릭터들과 함께 즐겁게 소통하며,
          더 나은 언어 표현력을 키울 수 있도록 도와주는 안전한 소통의 공간을 제공합니다.
        </p>
      </section>

      <section className="character-info-section">
        <h2 className="section-title">캐릭터 친구들을 소개할게요!</h2>
        <div className="character-info-grid">
          <CharacterCard name="말펭이" image={penguin} desc="수줍음 많지만 누구보다 말에 진심인 말펭이!" />
          <CharacterCard name="말곰이" image={bear} desc="든든하고 다정한 친구, 항상 곁에서 응원하는 말곰이!" />
          <CharacterCard name="규덕" image={duck} desc="호기심 많고 장난꾸러기지만 의외로 똑똑한 규덕!" />
          <CharacterCard name="말랑이" image={wolf} desc="겉은 쿨하지만 속은 말랑한 늑대, 말랑이!" />
          <CharacterCard name="말뭉이" image={puppy} desc="활발하고 에너지 넘치는 말뭉이! 모두를 웃게 해줘요." />
          <CharacterCard name="말랭이" image={parrot} desc="듣고 말하는 걸 가장 좋아하는 똑똑이 말랭이!" />
        </div>
      </section>
    </div>
  );
}

export default HomePage;
