// src/pages/User/MyPage/UserMyInfoPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Modal, Row, Col, Alert } from 'react-bootstrap';
import ProfileImageSelect from '../../../components/signup/ProfileImageSelect';
import AddressSelector from '../../../components/signup/AddressSelector';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import './UserMyInfoPage.css';

function UserMyInfoPage() {
  const { user, updateUser, refreshMe } = useAuth();

  const [formData, setFormData] = useState({
    profile: 1,
    name: '',
    nickname: '',
    birthDate: '',
    email: '',
    tel1: '',
    tel2: '',
    city: '',
    district: '',
    dong: '',
    detail: '',
  });

  const [editPhone, setEditPhone] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [showProfileSelect, setShowProfileSelect] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [tempAddress, setTempAddress] = useState({ city: '', district: '', dong: '', detail: '' });
  const [fadeOut, setFadeOut] = useState(false);

  const alertTimers = useRef([]);

  const clearAlertTimers = () => {
    alertTimers.current.forEach((t) => clearTimeout(t));
    alertTimers.current = [];
  };

  useEffect(() => {
    async function fetchUserInfo() {
      if (!user?.accessToken) return;
      try {
        const res = await axios.get('/api/v1/members/me', {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        const d = res.data || {};
        setFormData((prev) => ({
          ...prev,
          profile: Number(d.profile ?? d.profile_image_id ?? d.profileImageId ?? prev.profile ?? 1) || 1,
          name: d.name ?? prev.name ?? '',
          nickname: d.nickname ?? d.nickName ?? prev.nickname ?? '',
          birthDate: d.birthDate ?? prev.birthDate ?? '',
          email: d.email ?? prev.email ?? '',
          tel1: d.tel1 ?? prev.tel1 ?? '',
          tel2: d.tel2 ?? prev.tel2 ?? '',
          city: d.city ?? prev.city ?? '',
          district: d.district ?? prev.district ?? '',
          dong: d.dong ?? prev.dong ?? '',
          detail: d.detail ?? prev.detail ?? '',
        }));
      } catch (err) {
        console.error('❌ 사용자 정보 조회 실패:', err);
      }
    }
    fetchUserInfo();
    return () => clearAlertTimers();
  }, [user?.accessToken]);

  // 전역 user.profile이 바뀌면 프리뷰(로컬 formData.profile)도 동기화
  useEffect(() => {
    if (typeof user?.profile === 'number') {
      setFormData((prev) => ({ ...prev, profile: user.profile }));
    }
  }, [user?.profile]);

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setFadeOut(false);
    clearAlertTimers();
    alertTimers.current.push(setTimeout(() => setFadeOut(true), 2500));
    alertTimers.current.push(
      setTimeout(() => {
        setAlertMessage('');
        setFadeOut(false);
      }, 3000)
    );
  };

  // ✅ 프로필 변경: 서버 성공 → 전역 user 즉시 갱신(배경/캐릭터 즉시 변경) → 필요 시 /me 동기화
  const handleProfileChange = async (newProfileId) => {
    if (!user?.accessToken) return;
    try {
      await axios.patch(
        '/api/v1/members/me',
        { profile: newProfileId },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      setFormData((prev) => ({ ...prev, profile: newProfileId }));
      setShowProfileSelect(false);
      showAlert('프로필 이미지가 수정되었습니다.');

      // 전역 AuthContext 상태 즉시 변경 → App이 배경/캐릭터 동기화
      updateUser({ profile: newProfileId, profileImageUrl: null });

      // 백엔드가 다른 필드도 갱신했다면 서버값으로 보강
      await refreshMe();
    } catch (err) {
      console.error('❌ 프로필 수정 실패:', err);
      alert('프로필 수정에 실패했습니다.');
    }
  };

  const handlePhoneUpdate = async () => {
    if (!formData.tel1) {
      alert('전화번호 1은 필수입니다.');
      return;
    }
    if (formData.tel1.length > 15 || (formData.tel2 && formData.tel2.length > 15)) {
      alert('전화번호는 최대 15자리까지 가능합니다.');
      return;
    }
    if (!user?.accessToken) return;
    try {
      await axios.patch(
        '/api/v1/members/me',
        { tel1: formData.tel1, tel2: formData.tel2 || '' },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setEditPhone(false);
      showAlert('전화번호가 수정되었습니다.');
    } catch (err) {
      console.error('❌ 전화번호 수정 실패:', err);
      alert('전화번호 수정에 실패했습니다.');
    }
  };

  const handleAddressUpdate = async () => {
    const { city, district, dong, detail } = tempAddress;
    if (!city || !district || !dong) {
      alert('시/군/구, 동(읍/면/리)을 모두 선택해주세요.');
      return;
    }
    if (!user?.accessToken) return;
    try {
      await axios.patch(
        '/api/v1/members/me',
        { city, district, dong, detail: detail || '' },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setFormData((prev) => ({ ...prev, city, district, dong, detail }));
      setEditAddress(false);
      showAlert('주소가 수정되었습니다.');
    } catch (err) {
      console.error('❌ 주소 수정 실패:', err);
      alert('주소 수정에 실패했습니다.');
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      alert('모든 입력 칸을 채워주세요.');
      return;
    }
    if (newPassword.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (currentPassword === newPassword) {
      alert('같은 비밀번호로 변경할 수 없습니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      alert('비밀번호를 다시 확인해주세요.');
      return;
    }
    if (!user?.accessToken) return;

    try {
      await axios.patch(
        '/api/v1/members/me/password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      showAlert('비밀번호가 성공적으로 변경되었습니다.');
      alert('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err) {
      console.error('❌ 비밀번호 수정 실패:', err);
      if (err.response?.status === 400) {
        alert('기존 비밀번호가 틀렸습니다.');
      } else {
        alert('비밀번호 수정에 실패했습니다.');
      }
    }
  };

  const handleAddressEditClick = () => {
    // 요구사항대로 수정 시작 시 빈 입력값으로 시작
    setTempAddress({ city: '', district: '', dong: '', detail: '' });
    setEditAddress(true);
  };

  const handleAddressCancel = () => {
    setEditAddress(false); // 표시 영역은 기존 formData 값이 그대로 보임
  };

  // 페이지 내 프리뷰용 프로필 이미지 src (전역 버전으로 캐시 무력화)
  const avatarVer = user?._avatarVer || 0;
  const profileImgSrc = user?.profileImageUrl
    ? `${user.profileImageUrl}?v=${avatarVer}`
    : `/images/profile${formData.profile}.png?v=${avatarVer}`;

  return (
    <div className="user-my-info-container">
      <h4>내 정보</h4>

      {alertMessage && (
        <Alert variant="success" className={`custom-alert ${fadeOut ? 'fade-out' : ''}`}>
          {alertMessage}
        </Alert>
      )}

      <div className="profile-image-wrapper">
        {/* key 로 강제 리마운트하여 캐시 즉시 무력화 */}
        <img key={avatarVer} src={profileImgSrc} alt="프로필" />
        <div>
          <Button size="sm" variant="outline-primary" onClick={() => setShowProfileSelect(true)}>
            캐릭터 변경하기
          </Button>
        </div>
      </div>

      <div className="basic-info-box">
        <h5 className="section-title">기본 정보</h5>

        <div className="info-item-box">
          <Form.Label>이름</Form.Label>
          <div className="info-value-box">{formData.name}</div>
        </div>

        <div className="info-item-box">
          <Form.Label>닉네임</Form.Label>
          <div className="info-value-box">{formData.nickname}</div>
        </div>

        <div className="info-item-box">
          <Form.Label>생년월일</Form.Label>
          <div className="info-value-box">{formData.birthDate}</div>
        </div>

        <div className="info-item-box">
          <Form.Label>이메일</Form.Label>
          <div className="info-value-box">{formData.email}</div>
        </div>
      </div>

      <div className="mb-3">
        <Button variant="outline-secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
          비밀번호 재설정
        </Button>
      </div>

      <Row className="edit-section">
        <Col>
          <Form.Label>전화번호 1</Form.Label>
          <Form.Control
            value={formData.tel1}
            onChange={(e) =>
              setFormData({
                ...formData,
                tel1: e.target.value.replace(/[^0-9]/g, '').slice(0, 15),
              })
            }
            readOnly={!editPhone}
            inputMode="numeric"
            placeholder="숫자만 입력 (최대 15자리)"
          />
        </Col>
        <Col>
          <Form.Label>전화번호 2 (선택)</Form.Label>
          <Form.Control
            value={formData.tel2}
            onChange={(e) =>
              setFormData({
                ...formData,
                tel2: e.target.value.replace(/[^0-9]/g, '').slice(0, 15),
              })
            }
            readOnly={!editPhone}
            inputMode="numeric"
            placeholder="숫자만 입력 (최대 15자리)"
          />
        </Col>
        <Col xs="auto">
          <Button onClick={editPhone ? handlePhoneUpdate : () => setEditPhone(true)}>
            {editPhone ? '수정하기' : '수정'}
          </Button>
        </Col>
      </Row>

      <div className="mb-3">
        <Form.Label>주소</Form.Label>
        {editAddress ? (
          <>
            <AddressSelector
              address={tempAddress}
              onChange={(addr) => setTempAddress({ ...tempAddress, ...addr })}
            />
            <div className="mt-2">
              <Button variant="primary" onClick={handleAddressUpdate}>
                수정하기
              </Button>{' '}
              <Button variant="secondary" onClick={handleAddressCancel}>
                취소
              </Button>
            </div>
          </>
        ) : (
          <div>
            <div className="address-display">
              {formData.city} {formData.district} {formData.dong}
              {formData.detail && ` ${formData.detail}`}
            </div>
            <Button className="mt-2" onClick={handleAddressEditClick}>
              수정
            </Button>
          </div>
        )}
      </div>

      <Modal
        show={showProfileSelect}
        onHide={() => setShowProfileSelect(false)}
        dialogClassName="therapist-profile-modal"
      >
        <Modal.Header closeButton><Modal.Title>캐릭터 선택</Modal.Title></Modal.Header>
        <Modal.Body>
          {/* 내부 모달 없이 즉시 그리드 표시 */}
          <ProfileImageSelect
            value={formData.profile}
            onChange={(id) => {
              // 선택 즉시 서버 패치 + 알림 + 모달 닫기 (기존 로직 재사용)
              handleProfileChange(id);
              setShowProfileSelect(false);
            }}
            pickerOnly
          />
        </Modal.Body>
      </Modal>

      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>비밀번호 변경</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>현재 비밀번호</Form.Label>
            <Form.Control
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>새 비밀번호</Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>비밀번호 확인</Form.Label>
            <Form.Control
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
            />
          </Form.Group>
          <Button onClick={handlePasswordUpdate}>비밀번호 수정</Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default UserMyInfoPage;
