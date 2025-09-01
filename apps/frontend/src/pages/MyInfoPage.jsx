import React from 'react';
import { useNavigate } from 'react-router-dom';

const MyInfoPage = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/manage-aac');
  };

  return (
    <div className="page-container">
      <section className="section-container">
        <h2>내 정보 수정</h2>
        <p>이곳에서 사용자 정보를 수정할 수 있습니다.</p>
        {/* 이 부분에 닉네임, 비밀번호 변경 등의 폼이 들어갈 수 있습니다. */}
        <hr />
        <button onClick={handleNavigate} className="btn-primary">
          AAC / 도구 관리
        </button>
      </section>
    </div>
  );
};

export default MyInfoPage;