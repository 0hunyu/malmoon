import React from 'react';
import { Form, FloatingLabel, Button } from 'react-bootstrap';
import ProfileImageSelect from './ProfileImageSelect';
import AddressSelector from './AddressSelector';

function CommonSignUpForm({
  formData,
  handleChange,
  handleAddressChange,
  errors,
  duplicateCheckProps,
}) {
  const {
    checkEmail,
    checking,
    isDuplicate,
    message,
  } = duplicateCheckProps || {};

  const today = new Date().toISOString().split('T')[0];

  const isValidEmailFormat = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  return (
    <>
      {/* 프로필 선택 */}
      <ProfileImageSelect
        value={formData.profile || 1}
        onChange={(value) => handleChange({ target: { name: 'profile', value } })}
        error={errors.profile}
      />

      {/* 이름 (30자 제한) */}
      <FloatingLabel label="이름" className="mb-3">
        <Form.Control
          name="name"
          maxLength={30}
          value={formData.name || ''}
          onChange={handleChange}
          isInvalid={!!errors.name}
        />
        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
      </FloatingLabel>

      {/* 닉네임 (30자 제한) */}
      <FloatingLabel label="닉네임" className="mb-3">
        <Form.Control
          name="nickname"
          maxLength={30}
          value={formData.nickname || ''}
          onChange={handleChange}
          isInvalid={!!errors.nickname}
        />
        <Form.Control.Feedback type="invalid">{errors.nickname}</Form.Control.Feedback>
      </FloatingLabel>

      {/* 생년월일 */}
      <FloatingLabel label="생년월일" className="mb-3">
        <Form.Control
          type="date"
          name="birthDate"
          value={formData.birthDate || ''}
          onChange={handleChange}
          isInvalid={!!errors.birthDate}
          min="1900-01-01"
          max={today}
        />
        <Form.Control.Feedback type="invalid">{errors.birthDate}</Form.Control.Feedback>
      </FloatingLabel>

      {/* 이메일 (30자 제한, 영어/숫자/@._-만 허용) */}
      <div className="mb-1 d-flex gap-2">
        <FloatingLabel label="이메일" className="flex-grow-1">
          <Form.Control
            name="email"
            maxLength={30}
            value={formData.email || ''}
            onChange={(e) => {
              const val = e.target.value;
              const filtered = val.replace(/[^a-zA-Z0-9@._-]/g, ''); // 허용 문자만
              handleChange({ target: { name: 'email', value: filtered } });
            }}
            isInvalid={!!errors.email}
          />
          <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
        </FloatingLabel>
        <Button
          variant="outline-secondary"
          disabled={checking || !formData.email || !isValidEmailFormat(formData.email)}
          onClick={() => checkEmail(formData.email)}
        >
          {checking ? '확인 중...' : '중복 확인'}
        </Button>
      </div>

      {formData.email && !isValidEmailFormat(formData.email) && (
        <div className="text-danger mb-2">이메일 형식을 확인해주세요.</div>
      )}

      {message && isValidEmailFormat(formData.email) && (
        <div className={`mb-3 ${isDuplicate ? 'text-danger' : 'text-success'}`}>
          {message}
        </div>
      )}

      {/* 비밀번호 */}
      <FloatingLabel label="비밀번호" className="mb-3">
        <Form.Control
          type="password"
          name="password"
          value={formData.password || ''}
          onChange={handleChange}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
      </FloatingLabel>

      {/* 비밀번호 확인 */}
      <FloatingLabel label="비밀번호 확인" className="mb-3">
        <Form.Control
          type="password"
          name="passwordConfirm"
          value={formData.passwordConfirm || ''}
          onChange={handleChange}
          isInvalid={!!errors.passwordConfirm}
        />
        <Form.Control.Feedback type="invalid">{errors.passwordConfirm}</Form.Control.Feedback>
      </FloatingLabel>

      {/* 전화번호 1 (숫자만, 15자 제한) */}
      <FloatingLabel label="전화번호 1" className="mb-3">
        <Form.Control
          name="tel1"
          maxLength={15}
          value={formData.tel1 || ''}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/[^0-9]/g, '');
            handleChange({ target: { name: 'tel1', value: onlyNums } });
          }}
          isInvalid={!!errors.tel1}
        />
        <Form.Control.Feedback type="invalid">{errors.tel1}</Form.Control.Feedback>
      </FloatingLabel>

      {/* 전화번호 2 (선택, 숫자만, 15자 제한) */}
      <FloatingLabel label="전화번호 2 (선택)" className="mb-3">
        <Form.Control
          name="tel2"
          maxLength={15}
          value={formData.tel2 || ''}
          onChange={(e) => {
            const onlyNums = e.target.value.replace(/[^0-9]/g, '');
            handleChange({ target: { name: 'tel2', value: onlyNums } });
          }}
        />
      </FloatingLabel>

      {/* 주소 선택 */}
      <AddressSelector
        address={{
          city: formData.city || '',
          district: formData.district || '',
          dong: formData.dong || '',
          detail: formData.detail || '',
        }}
        onChange={handleAddressChange}
        error={errors.address}
      />
    </>
  );
}

export default CommonSignUpForm;
