import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import CommonSignUpForm from '../../components/signup/CommonSignUpForm';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './SignupPage.css';
import { useDuplicateCheck } from '../../components/signup/useDuplicateCheck';

function UserSignUp() {
  const [formData, setFormData] = useState({
    profile: 1, 
    name: '',
    nickname: '',
    birthDate: '',
    email: '',
    password: '',
    passwordConfirm: '',
    tel1: '',
    tel2: '',
    city: '',
    district: '',
    dong: '',
    detail: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    checkEmail,
    checking,
    isDuplicate,
    message,
    setIsDuplicate,
    setMessage,
  } = useDuplicateCheck();

  const previousEmailRef = useRef(formData.email);
  useEffect(() => {
    if (formData.email !== previousEmailRef.current) {
      setIsDuplicate(null);
      setMessage('');
      previousEmailRef.current = formData.email;
    }
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: undefined,
      ...(name === 'city' || name === 'district' || name === 'dong' ? { address: undefined } : {}),
    }));

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (updated) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      address: undefined,
    }));

    setFormData((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const validate = () => {
    const err = {};
    const f = formData;

    if (!f.profile) err.profile = '프로필 이미지를 선택해주세요.'; // ✅ 수정됨
    if (!f.name) err.name = '이름은 필수입니다.';
    if (!f.nickname) err.nickname = '닉네임은 필수입니다.';

    if (!f.birthDate) {
      err.birthDate = '생년월일은 필수입니다.';
    } else {
      const inputDate = new Date(f.birthDate);
      const minDate = new Date('1900-01-01');
      if (isNaN(inputDate.getTime())) {
        err.birthDate = '유효한 날짜를 입력해주세요.';
      } else if (inputDate < minDate) {
        err.birthDate = '1900년 1월 1일 이후로 설정해주세요.';
      }
    }

    if (!f.email) err.email = '이메일은 필수입니다.';
    if (!f.password || f.password.length < 6) err.password = '비밀번호는 6자 이상이어야 합니다.';
    if (f.password !== f.passwordConfirm) err.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!f.tel1) err.tel1 = '전화번호는 필수입니다.';
    if (!f.city || !f.district || !f.dong) err.address = '주소를 선택해주세요.';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');
    setSuccess(false);

    if (!validate()) return;

    if (isDuplicate === null) {
      alert('이메일 중복 확인을 해주세요.');
      return;
    }
    if (isDuplicate === true) {
      alert('이미 사용 중인 이메일입니다.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        role: 'user',
      };
      await api.post('/members', payload);
      setSuccess(true);
      navigate('/login');
    } catch (err) {
      console.error(err);
      setServerError('회원가입 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-form-container">
        <Form onSubmit={handleSubmit} noValidate>
          <div className="form-title">사용자 회원가입</div>

          {serverError && <Alert variant="danger">{serverError}</Alert>}
          {success && <Alert variant="success">회원가입 성공! 로그인 해주세요.</Alert>}

          <div className="form-section">
            <CommonSignUpForm
              formData={formData}
              handleChange={handleChange}
              handleAddressChange={handleAddressChange}
              errors={errors}
              duplicateCheckProps={{ checkEmail, checking, isDuplicate, message }}
            />
          </div>

          <div className="button-row">
            <Button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default UserSignUp;
