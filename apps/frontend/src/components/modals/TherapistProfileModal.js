import React from 'react';
import { Modal, ListGroup, Card, Image } from 'react-bootstrap';
import './TherapistProfileModal.css';
import defaultImage from '../../assets/therapist.png';

/* ✅ 캐릭터 이미지: 프로젝트 경로에 맞게 필요시 수정 */
import penguinImg from '../../logoimage/penguin.png';
import bearImg    from '../../logoimage/bear.png';
import duckImg    from '../../logoimage/duck.png';
import wolfImg    from '../../logoimage/wolf.png';
import puppyImg   from '../../logoimage/puppy.png';
import parrotImg  from '../../logoimage/parrot.png';

const CHARACTER_IMAGES = {
  6: penguinImg, // 말펭이
  1: bearImg,    // 말곰이
  5: duckImg,    // 규덕
  2: wolfImg,    // 말랑이
  3: puppyImg,   // 말뭉이
  4: parrotImg,  // 말랭이
};

// 매칭 페이지와 동일: 0-based/1-based 모두 보정
const getProfileId = (t) => {
  const raw =
    t?.profile ??
    t?.profileImageId ??
    t?.profile_image_id ??
    t?.profileCharacterId;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (n >= 1 && n <= 6) return n;     // 1~6 그대로
  return 0;                           // 파일 PK 등 매핑 불가
};

// 날짜 포맷 (YYYY-MM-DD → YYYY년 M월 D일)
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return ''; // 잘못된 날짜 방어
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

function TherapistProfileModal({ show, handleClose, therapistProfile }) {
  if (!therapistProfile) return null;

  // ✅ URL 우선 → 매핑 이미지 → 폴백(이니셜/기본 이미지)
  const id = getProfileId(therapistProfile);
  const resolvedImg =
    therapistProfile?.profileImageUrl || CHARACTER_IMAGES[id] || null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered className="therapist-profile-modal">
      <Modal.Header closeButton>
        <Modal.Title>치료사 상세 프로필</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="profile-container">
          {resolvedImg ? (
            <Image
              src={resolvedImg}
              className="profile-image"
              alt={`${therapistProfile.name || '치료사'}님의 프로필 사진`}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultImage; }}
            />
          ) : (
            <>
              <Image
                src={defaultImage}
                className="profile-image"
                alt="기본 프로필"
              />
            </>
          )}

          <div className="profile-info">
            <h4>{therapistProfile.name}</h4>
            <p>{therapistProfile.email}</p>
            <p>{therapistProfile.telephone}</p>
          </div>
        </div>

        {/* ✅ 경력 정보만 표시 */}
        <Card>
          <Card.Header as="h5">경력 정보</Card.Header>
          <ListGroup variant="flush">
            {Array.isArray(therapistProfile.careers) && therapistProfile.careers.length > 0 ? (
              therapistProfile.careers.map((career, index) => (
                <ListGroup.Item key={index} className="career-item">
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{career.company}</h6>
                    <small>
                      {formatDate(career.startDate)} ~ {formatDate(career.endDate)}
                    </small>
                  </div>
                  <p className="mb-1">{career.position}</p>
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>경력 정보가 없습니다.</ListGroup.Item>
            )}
          </ListGroup>
        </Card>
      </Modal.Body>

      <Modal.Footer>
        {/* ✅ 커스텀 닫기 버튼 */}
        <button type="button" className="tm-btn tm-btn-primary" onClick={handleClose}>
          닫기
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export default TherapistProfileModal;
