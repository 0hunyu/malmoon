import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUpPage.css';
import therapistImage from '../../assets/therapist.png';
import userImage from '../../assets/user.png';

function SignUpPage() {
  const navigate = useNavigate();

  const handleUserTypeSelect = (type) => {
    navigate(`/signup/${type}`);
  };

  return (
    <div className="signup-page-wrapper">
      <h2 className="text-center mb-4">회원가입</h2>

      <div className="signup-type-row">
        <div
          className="signup-card"
          onClick={() => handleUserTypeSelect('therapist')}
        >
          <img src={therapistImage} alt="치료사" className="signup-image" />
          <button className="mt-3">치료사로 가입</button>
        </div>
     
        <div
          className="signup-card"
          onClick={() => handleUserTypeSelect('user')}
        >
          <img src={userImage} alt="사용자" className="signup-image" />
          <button className="mt-3">사용자로 가입</button>
        </div>
      </div>

      <p className="signup-link-text text-center mt-4">
        이미 계정이 있으신가요? <Link to="/login">로그인</Link>
      </p>
    </div>
  );
}

export default SignUpPage;
