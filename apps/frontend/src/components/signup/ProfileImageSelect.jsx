// src/components/signup/ProfileImageSelect.jsx
import React, { useState } from 'react';
import { Form, Image, Row, Col, Button, Modal } from 'react-bootstrap';

const PROFILE_IMAGES = [
  { id: 1, src: '/images/profile1.png', label: '말곰이' },
  { id: 2, src: '/images/profile2.png', label: '말랑이' },
  { id: 3, src: '/images/profile3.png', label: '말뭉이' },
  { id: 4, src: '/images/profile4.png', label: '말랭이' },
  { id: 5, src: '/images/profile5.png', label: '우주최강자규덕' },
  { id: 6, src: '/images/profile6.png', label: '말펭이' },
];

/**
 * props
 * - value: number
 * - onChange: (id:number) => void
 * - error?: string
 * - pickerOnly?: boolean  // true면 즉시 선택 그리드 표시(내부 모달 X)
 */
function ProfileImageSelect({ value, onChange, error, pickerOnly = false }) {
  const [showModal, setShowModal] = useState(false);

  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 1;
  const selected = PROFILE_IMAGES.find((img) => img.id === numericValue) ?? PROFILE_IMAGES[0];

  const handleSelect = (id) => {
    onChange(id);
    // pickerOnly 모드에서는 부모(외부 모달)에서 닫힘 처리,
    // 기본 모드에서는 내부 모달을 닫아 사용자 플로우 그대로 유지
    if (!pickerOnly) setShowModal(false);
  };

  // ✅ 마이페이지 등: 즉시 그리드 노출 (내부 모달 사용 안 함)
  if (pickerOnly) {
    return (
      <div className="text-center">
        <Row>
          {PROFILE_IMAGES.map((img) => {
            const isActive = numericValue === img.id;
            return (
              <Col key={img.id} xs={6} md={4} className="text-center mb-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(img.id)}
                  onKeyDown={(e) => (e.key === 'Enter' ? handleSelect(img.id) : null)}
                  style={{
                    display: 'inline-block',
                    padding: 6,
                    borderRadius: '50%',
                    border: isActive ? '3px solid #0d6efd' : '2px solid #ccc',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Image
                    src={img.src}
                    alt={img.label}
                    roundedCircle
                    width={90}
                    height={90}
                  />
                </div>
                <div className="small mt-2">{img.label}</div>
                <div className="mt-1">
                  <Button
                    size="sm"
                    variant={isActive ? 'primary' : 'outline-secondary'}
                    onClick={() => handleSelect(img.id)}
                  >
                    {isActive ? '선택됨' : '선택'}
                  </Button>
                </div>
              </Col>
            );
          })}
        </Row>
        {error && <div className="text-danger small mt-2">{error}</div>}
      </div>
    );
  }

  // ✅ 회원가입 등: 기존 동작 유지 (미리보기 + 내부 모달)
  return (
    <Form.Group controlId="profileImageId" className="mb-4 text-center">
      <Form.Label>프로필 캐릭터</Form.Label>
      <div>
        <Image
          src={selected.src}
          alt={selected.label}
          roundedCircle
          width={100}
          height={100}
          style={{ border: '3px solid #007bff', padding: 2 }}
        />
        <div className="mt-2 mb-3">{selected.label}</div>

        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setShowModal(true)}
        >
          캐릭터 이미지 교체하기
        </Button>
      </div>

      {error && <div className="text-danger small mt-2">{error}</div>}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>캐릭터 선택</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {PROFILE_IMAGES.map((img) => {
              const isActive = numericValue === img.id;
              return (
                <Col key={img.id} xs={6} md={4} className="text-center mb-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(img.id)}
                    onKeyDown={(e) => (e.key === 'Enter' ? handleSelect(img.id) : null)}
                    style={{
                      display: 'inline-block',
                      padding: 6,
                      borderRadius: '50%',
                      border: isActive ? '3px solid #0d6efd' : '2px solid #ccc',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Image
                      src={img.src}
                      alt={img.label}
                      roundedCircle
                      width={80}
                      height={80}
                    />
                  </div>
                  <div className="small mt-1">{img.label}</div>
                  <Button
                    variant={isActive ? 'primary' : 'outline-secondary'}
                    size="sm"
                    className="mt-1"
                    onClick={() => handleSelect(img.id)}
                  >
                    {isActive ? '선택됨' : '선택'}
                  </Button>
                </Col>
              );
            })}
          </Row>
        </Modal.Body>
      </Modal>
    </Form.Group>
  );
}

export default ProfileImageSelect;
