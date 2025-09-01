import React from 'react';
import './GuidePage.css';
import logoImage from '../logoimage/logo.png';

function GuidePage() {
  return (
    <div className="guide-page main-container">
      <div className="guide-logo-wrapper">
        <img src={logoImage} alt="로고" className="guide-logo" />
      </div>

      <section className="intro-section">
        <h1>
          언어 소통 약자를 위한{' '}
          <span className="highlight">
            <span className="mm-red">말</span><span className="mm-blue">문</span>
          </span>
        </h1>
        <p className="subtitle">누구나 간편하게 이용가능</p>
        <p>시간, 장소 제약 없이 스마트폰으로 훈련할 수 있으며<br />매회 치료의 효과를 편리하게 확인 가능합니다.</p>
      </section>

      {/* HomePage의 파스텔 밴드 느낌 */}
      <section className="feature-section band-section">
        <h2 className="section-title">주요 서비스</h2>
        <div className="feature-list">
          <div className="feature-item card-base">
            <h3>언어치료 전문가 매칭</h3>
            <p>언어치료사와 1:1 매칭으로 나의 치료 및 스케줄에 대한 주기적인 피드백을 제공합니다.</p>
          </div>
          <div className="feature-item card-base">
            <h3>비대면 화상 치료 수업</h3>
            <p>웹 RTC을 활용한 화상 미팅을 통해 대면 치료의 어려움을 극복합니다.</p>
          </div>
          <div className="feature-item card-base">
            <h3>AI 언어훈련 서비스</h3>
            <p>학습자의 음성을 인식·합성하여 언어훈련의 효과를 극대화합니다.</p>
          </div>
          <div className="feature-item card-base">
            <h3>다양한 언어훈련 콘텐츠</h3>
            <p>AAC 그림카드 활용, 동화 문장 읽기, 필터 효과 적용 등의 콘텐츠를 통해 아이들의 집중력을 높입니다.</p>
          </div>
        </div>
      </section>

      <section className="institution-section">
        <h2 className="section-title">언어 재활기관 및 치료사를 위한 말문</h2>
        <div className="institution-grid">
          <div className="institution-card card-base hover-lift">
            <h3>효과적인 스케줄 관리</h3>
            <p>클래스/회원/피드백을 한눈에 볼 수 있는<br />효율적인 관리 시스템을 제공합니다.</p>
          </div>
          <div className="institution-card card-base hover-lift">
            <h3>화상보조 훈련</h3>
            <p>시간과 공간의 제약 없이<br />언제 어디서나 훈련 진행이 가능합니다.</p>
          </div>
          <div className="institution-card card-base hover-lift">
            <h3>더 많은 소통 약자 연결</h3>
            <p>플랫폼을 통해 다양한 대상자를<br />전문가와 효율적으로 연결할 수 있습니다.</p>
          </div>
        </div>
      </section>

      <section className="qa-section band-section-soft">
        <h2 className="section-title">자주 묻는 질문 (Q&A)</h2>
        <div className="qa-item">
          <h4>Q. 꼭 전문가와 매칭해야 하나요?</h4>
          <p>A. 전문가 매칭하여 더 체계적인 피드백을 받을 수 있습니다.</p>
        </div>
        <div className="qa-item">
          <h4>Q. 기기나 앱 설치가 필요한가요?</h4>
          <p>A. 별도 앱 설치 없이 웹사이트 또는 모바일 브라우저로 바로 이용할 수 있습니다.</p>
        </div>
        <div className="qa-item">
          <h4>Q. 비용이 어떻게 되나요?</h4>
          <p>A. 일부 콘텐츠는 무료 제공되며, 전문가 매칭 및 프리미엄 콘텐츠는 별도 비용이 발생합니다.</p>
        </div>
      </section>
    </div>
  );
}

export default GuidePage;
