// src/pages/Therapist/MyPage/TherapistMyInfoPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Modal, Row, Col, Alert } from 'react-bootstrap';
import ProfileImageSelect from '../../../components/signup/ProfileImageSelect';
import AddressSelector from '../../../components/signup/AddressSelector';
import { useAuth } from '../../../contexts/AuthContext';
import axios from 'axios';
import '../../User/MyPage/UserMyInfoPage.css'; // 동일 스타일 공유

function TherapistMyInfoPage() {
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
  const [fadeOut, setFadeOut] = useState(false);

  const [tempAddress, setTempAddress] = useState({
    city: '', district: '', dong: '', detail: ''
  });

  const [careerYears, setCareerYears] = useState(0);
  const [editCareerYears, setEditCareerYears] = useState(false);
  const [careerList, setCareerList] = useState([]);
  const [editCareers, setEditCareers] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedCareer, setEditedCareer] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newCareer, setNewCareer] = useState({ company: '', position: '', startDate: '', endDate: '' });

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
        setCareerYears(d.careerYears ?? 0);
        setCareerList(Array.isArray(d.careers) ? d.careers : []);

        // 서버 profile과 전역 profile 불일치 시 전역 동기화
        if (typeof d.profile !== 'undefined' && Number(d.profile) !== Number(user?.profile)) {
          updateUser({ profile: Number(d.profile) });
        }
      } catch (err) {
        console.error('❌ 사용자 정보 조회 실패:', err);
      }
    }
    fetchUserInfo();
    return () => clearAlertTimers();
  }, [user?.accessToken, updateUser]);

  // 전역 user.profile 변경 시 로컬 프리뷰도 동기화
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

  // ✅ 프로필 변경: 서버 → 전역 업데이트 → (옵션) /me 보강
  const handleProfileChange = async (newProfileId) => {
    if (!user?.accessToken) return;
    try {
      await axios.patch('/api/v1/members/me', { profile: newProfileId }, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });

      setFormData((prev) => ({ ...prev, profile: newProfileId }));
      setShowProfileSelect(false);
      showAlert('프로필 이미지가 수정되었습니다.');

      // 전역 상태 즉시 갱신 → App에서 배경/캐릭터 동기화
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
      await axios.patch('/api/v1/members/me', {
        tel1: formData.tel1,
        tel2: formData.tel2 || '',
      }, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
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
      await axios.patch('/api/v1/members/me', {
        city, district, dong, detail: detail || '',
      }, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
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
      await axios.patch('/api/v1/members/me/password', {
        currentPassword,
        newPassword,
      }, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      showAlert('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err) {
      if (err.response?.status === 400) {
        alert('기존 비밀번호가 틀렸습니다.');
      } else {
        alert('비밀번호 수정에 실패했습니다.');
      }
    }
  };

  const handleCareerYearsUpdate = async () => {
    if (careerYears < 0) {
      alert('경력 연차는 0 이상이어야 합니다.');
      return;
    }
    if (!user?.accessToken) return;
    try {
      await axios.patch('/api/v1/members/me', {
        careerYears,
      }, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      showAlert('총 경력 연차가 수정되었습니다.');
      setEditCareerYears(false);
    } catch (err) {
      console.error('❌ 경력 연차 수정 실패:', err);
      alert('경력 연차 수정에 실패했습니다.');
    }
  };

  const persistCareers = async (careers) => {
    if (!user?.accessToken) return;
    const cleaned = careers.map((c) => ({
      ...c,
      startDate: c.startDate || null,
      endDate: c.endDate || null,
    }));
    await axios.patch('/api/v1/members/me', {
      careerYears,
      careers: cleaned,
    }, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
  };

  const handleCareerSaveOne = async (index, data) => {
    const { company, position, startDate } = data;
    if (!company?.trim() || !position?.trim() || !startDate || startDate < '1900-01-01') {
      alert('회사명, 직책, 시작일(1900-01-01 이후)은 필수입니다.');
      return;
    }
    const updated = [...careerList];
    updated[index] = data;
    await persistCareers(updated);
    setCareerList(updated);
    setEditingIndex(null);
    showAlert('경력이 수정되었습니다.');
  };

  const handleCareerDeleteOne = async (index) => {
    const updated = careerList.filter((_, i) => i !== index);
    await persistCareers(updated);
    setCareerList(updated);
    showAlert('삭제되었습니다.');
  };

  const handleCareerAdd = async () => {
    const { company, position, startDate } = newCareer;
    if (!company.trim() || !position.trim() || !startDate || startDate < '1900-01-01') {
      alert('회사명, 직책, 시작일(1900-01-01 이후)은 필수입니다.');
      return;
    }
    const updated = [...careerList, newCareer];
    await persistCareers(updated);
    setCareerList(updated);
    setNewCareer({ company: '', position: '', startDate: '', endDate: '' });
    setAddingNew(false);
    showAlert('경력이 추가되었습니다.');
  };

  // ✅ 전역 버전으로 프로필 이미지 캐시 무력화
  const avatarVer = user?._avatarVer || 0;
  const profileImgSrc = user?.profileImageUrl
    ? `${user.profileImageUrl}?v=${avatarVer}`
    : `/images/profile${formData.profile}.png?v=${avatarVer}`;

  return (
    <div className="user-my-info-container">
      <h4>내 정보 (치료사)</h4>

      {alertMessage && (
        <Alert variant="success" className={`custom-alert ${fadeOut ? 'fade-out' : ''}`}>
          {alertMessage}
        </Alert>
      )}

      {/* 프로필 이미지 */}
      <div className="profile-image-wrapper">
        {/* key로 강제 리마운트 → 즉시 변경 보장 */}
        <img key={avatarVer} src={profileImgSrc} alt="프로필" />
        <div>
          <Button size="sm" variant="outline-primary" onClick={() => setShowProfileSelect(true)}>
            캐릭터 변경하기
          </Button>
        </div>
      </div>

      {/* 기본 정보 */}
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

      {/* 비밀번호 재설정 */}
      <div className="mb-3">
        <Button variant="outline-secondary" size="sm" onClick={() => setShowPasswordModal(true)}>
          비밀번호 재설정
        </Button>
      </div>

      {/* 전화번호 */}
      <Row className="edit-section">
        <Col>
          <Form.Label>전화번호 1</Form.Label>
          <Form.Control
            value={formData.tel1}
            onChange={(e) =>
              setFormData({ ...formData, tel1: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })
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
              setFormData({ ...formData, tel2: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })
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

      {/* 주소 */}
      <div className="mb-3">
        <Form.Label>주소</Form.Label>
        {editAddress ? (
          <>
            <AddressSelector
              address={tempAddress}
              onChange={(addr) => setTempAddress({ ...tempAddress, ...addr })}
            />
            <div className="mt-2">
              <Button variant="primary" onClick={handleAddressUpdate}>수정하기</Button>{' '}
              <Button variant="secondary" onClick={() => setEditAddress(false)}>취소</Button>
            </div>
          </>
        ) : (
          <div>
            <div className="address-display">
              {formData.city} {formData.district} {formData.dong}
              {formData.detail && ` ${formData.detail}`}
            </div>
            {/* 치료사 페이지는 기존 값으로 편집 시작 */}
            <Button
              className="mt-2"
              onClick={() => {
                setTempAddress({
                  city: formData.city || '',
                  district: formData.district || '',
                  dong: formData.dong || '',
                  detail: formData.detail || '',
                });
                setEditAddress(true);
              }}
            >
              수정
            </Button>
          </div>
        )}
      </div>

      {/* 총 경력 연차 */}
      <div className="mb-4">
        <Form.Label>총 경력 연차</Form.Label>
        {!editCareerYears ? (
          <div className="d-flex align-items-center gap-3">
            <div className="info-value-box">{careerYears}년</div>
            <Button size="sm" onClick={() => setEditCareerYears(true)}>수정</Button>
          </div>
        ) : (
          <div className="d-flex align-items-end gap-2">
            <Form.Control
              type="number"
              min="0"
              value={careerYears}
              onChange={(e) => setCareerYears(Number(e.target.value))}
              style={{ maxWidth: '150px' }}
            />
            <Button onClick={handleCareerYearsUpdate}>수정하기</Button>
          </div>
        )}
      </div>

      {/* 경력 목록 */}
      <div className="mb-4">
        <h5 className="d-flex justify-content-between align-items-center">
          경력 목록
          {!editCareers ? (
            <Button variant="secondary" onClick={() => setEditCareers(true)}>수정하기</Button>
          ) : (
            <div>
              <Button
                variant="outline-success"
                className="me-2"
                onClick={() => setAddingNew(true)}
                disabled={addingNew}
              >
                경력 추가하기
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setEditCareers(false);
                  setEditingIndex(null);
                  setAddingNew(false);
                  showAlert('경력 수정이 완료되었습니다.');
                }}
              >
                저장하기
              </Button>
            </div>
          )}
        </h5>

        {/* 기존 경력 목록 */}
        {careerList.map((career, index) => (
          <div key={index} className="border p-3 mb-2 rounded bg-light">
            {editingIndex === index ? (
              <>
                <Row className="mb-2">
                  <Col>
                    <Form.Control
                      placeholder="회사명"
                      value={editedCareer.company}
                      onChange={(e) => setEditedCareer({ ...editedCareer, company: e.target.value })}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      placeholder="직책"
                      value={editedCareer.position}
                      onChange={(e) => setEditedCareer({ ...editedCareer, position: e.target.value })}
                    />
                  </Col>
                </Row>
                <Row className="mb-2">
                  <Col>
                    <Form.Control
                      type="date"
                      value={editedCareer.startDate}
                      min="1900-01-01"
                      onChange={(e) => setEditedCareer({ ...editedCareer, startDate: e.target.value })}
                      onInput={(e) => {
                        const v = e.target.value;
                        const m = v.match(/^\d{0,4}(-\d{0,2})?(-\d{0,2})?$/);
                        e.target.value = m ? `${m[0]}` : '';
                      }}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="date"
                      value={editedCareer.endDate}
                      min="1900-01-01"
                      onChange={(e) => setEditedCareer({ ...editedCareer, endDate: e.target.value })}
                      onInput={(e) => {
                        const v = e.target.value;
                        const m = v.match(/^\d{0,4}(-\d{0,2})?(-\d{0,2})?$/);
                        e.target.value = m ? `${m[0]}` : '';
                      }}
                    />
                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  <Button variant="success" onClick={() => handleCareerSaveOne(index, editedCareer)}>저장</Button>
                  <Button variant="secondary" onClick={() => setEditingIndex(null)}>취소</Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <strong>{career.company}</strong> ({career.position})<br />
                  {career.startDate} ~ {career.endDate || '현재'}
                </div>
                {editCareers && (
                  <div className="mt-2 d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        setEditingIndex(index);
                        setEditedCareer({ ...career });
                      }}
                    >
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleCareerDeleteOne(index)}
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* 경력 추가 폼 */}
        {addingNew && (
          <div className="border p-3 rounded bg-white">
            <Row className="mb-2">
              <Col>
                <Form.Control
                  placeholder="회사명"
                  value={newCareer.company}
                  onChange={(e) => setNewCareer({ ...newCareer, company: e.target.value })}
                />
              </Col>
              <Col>
                <Form.Control
                  placeholder="직책"
                  value={newCareer.position}
                  onChange={(e) => setNewCareer({ ...newCareer, position: e.target.value })}
                />
              </Col>
            </Row>
            <Row className="mb-2">
              <Col>
                <Form.Control
                  type="date"
                  value={newCareer.startDate}
                  min="1900-01-01"
                  onChange={(e) => setNewCareer({ ...newCareer, startDate: e.target.value })}
                  onInput={(e) => {
                    const v = e.target.value;
                    const m = v.match(/^\d{0,4}(-\d{0,2})?(-\d{0,2})?$/);
                    e.target.value = m ? `${m[0]}` : '';
                  }}
                />
              </Col>
              <Col>
                <Form.Control
                  type="date"
                  value={newCareer.endDate}
                  min="1900-01-01"
                  onChange={(e) => setNewCareer({ ...newCareer, endDate: e.target.value })}
                  onInput={(e) => {
                    const v = e.target.value;
                    const m = v.match(/^\d{0,4}(-\d{0,2})?(-\d{0,2})?$/);
                    e.target.value = m ? `${m[0]}` : '';
                  }}
                />
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button variant="success" onClick={handleCareerAdd}>추가하기</Button>
              <Button variant="secondary" onClick={() => setAddingNew(false)}>취소</Button>
            </div>
          </div>
        )}
      </div>

      {/* 프로필 선택 모달 */}
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

      {/* 비밀번호 변경 모달 */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton><Modal.Title>비밀번호 변경</Modal.Title></Modal.Header>
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

export default TherapistMyInfoPage;
