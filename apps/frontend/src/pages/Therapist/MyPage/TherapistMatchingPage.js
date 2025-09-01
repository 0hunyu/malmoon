import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import UserProfileModal from '../../../components/modals/UserProfileModal';

/* === 캐릭터 이미지 (색상 테마 X) === */
import penguinImg from '../../../logoimage/penguin.png';
import bearImg    from '../../../logoimage/bear.png';
import duckImg    from '../../../logoimage/duck.png';
import wolfImg    from '../../../logoimage/wolf.png';
import puppyImg   from '../../../logoimage/puppy.png';
import parrotImg  from '../../../logoimage/parrot.png';
import defaultAvatar from '../../../assets/therapist.png'; // 없으면 기본

const CHARACTER_IMAGES = {
  1: bearImg,    // 말곰이
  2: wolfImg,    // 말랑이
  3: puppyImg,   // 말뭉이
  4: parrotImg,  // 말랭이
  5: duckImg,    // 규덕
  6: penguinImg, // 말펭이
};

/* ---------- 유틸: 안전한 값 탐색/보정 ---------- */
const readFrom = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

// 요청 아이템에서 client 식별자 추출 (가능한 모든 후보를 시도)
const extractClientId = (obj) => {
  const direct = readFrom(obj, ['clientId', 'childId', 'memberId', 'userId', 'id']);
  if (direct !== undefined) return direct;

  const nests = [obj?.client, obj?.child, obj?.member, obj?.user, obj?.requester];
  for (const nest of nests) {
    const nid = readFrom(nest ?? {}, ['clientId', 'childId', 'memberId', 'userId', 'id']);
    if (nid !== undefined) return nid;
  }
  return undefined;
};

// 프로필 ID (0/1-베이스 + 문자열 명칭까지 보정)
const resolveProfileId = (obj) => {
  let raw = readFrom(obj, [
    'profile', 'profileId', 'profile_id',
    'profileImageId', 'profile_image_id', 'profile_image',
    'characterId', 'character_id',
    'childProfile', 'child_profile', 'childProfileId',
    'avatarIndex',
  ]);

  if (raw === undefined) {
    const nests = [obj?.member, obj?.client, obj?.child, obj?.user, obj?.requester];
    for (const nest of nests) {
      raw = readFrom(nest ?? {}, [
        'profile', 'profileId', 'profile_id',
        'profileImageId', 'profile_image_id', 'profile_image',
        'characterId', 'character_id',
        'childProfile', 'child_profile', 'childProfileId',
        'avatarIndex',
      ]);
      if (raw !== undefined) break;
    }
  }

  // 문자열에서 숫자/명칭 추출
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    const m = lower.match(/\d+/);
    if (m) {
      const num = Number(m[0]);
      if (Number.isFinite(num)) {
        if (num >= 1 && num <= 6) return num;
        if (num >= 0 && num <= 5) return num + 1;
      }
    }
    if (lower.includes('bear')) return 1;
    if (lower.includes('wolf')) return 2;
    if (lower.includes('puppy') || lower.includes('dog')) return 3;
    if (lower.includes('parrot')) return 4;
    if (lower.includes('duck')) return 5;
    if (lower.includes('penguin')) return 6;
  }

  const n = Number(raw);
  if (Number.isFinite(n)) {
    if (n >= 1 && n <= 6) return n;     // 1~6
    if (n >= 0 && n <= 5) return n + 1; // 0~5 → 1~6
  }
  return 1; // 기본값: 곰
};

const getCharImg = (obj) => CHARACTER_IMAGES[resolveProfileId(obj)] || defaultAvatar;

// 연락처/이메일 필드 후보를 넓게 커버
const extractPhone = (...objs) => {
  const keys = ['tel1', 'tel', 'telephone', 'phone', 'phoneNumber', 'contact'];
  for (const o of objs) {
    const v = readFrom(o, keys);
    if (v) return v;
  }
  return '-';
};
const extractEmail = (...objs) => {
  const keys = ['email', 'userEmail', 'contactEmail'];
  for (const o of objs) {
    const v = readFrom(o, keys);
    if (v) return v;
  }
  return '-';
};

function TherapistMatchingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [detailMap, setDetailMap] = useState({}); // { clientId: detail }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const BACK_FALLBACK = '/therapist/mypage'; // 히스토리 없을 때 이동할 기본 경로

  const handleBack = () => {
    if (window.history && window.history.length > 1) navigate(-1);
    else navigate(BACK_FALLBACK);
  };

  const fetchPendingRequests = async () => {
    if (!user || !user.accessToken) {
      setError('로그인이 필요합니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/schedule/pending', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      const list = response.data || [];
      setPendingRequests(list);

      // 리스트에서 client 식별자를 뽑아 상세정보 병렬 로드 (있을 때만)
      const ids = Array.from(
        new Set(
          list
            .map((r) => extractClientId(r))
            .filter((v) => v !== undefined && v !== null)
        )
      );

      if (ids.length) {
        const tempMap = {};
        const tasks = ids.map((cid) =>
          api
            .get(`/schedule/therapist/client/detail?clientId=${cid}`, {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            })
            .then((res) => { tempMap[cid] = res.data || {}; })
            .catch(() => {}) // 실패 시 무시
        );
        await Promise.allSettled(tasks);
        setDetailMap(tempMap);
      } else {
        setDetailMap({});
      }
    } catch (err) {
      setError('상담 요청 목록을 불러오는 데 실패했습니다.');
      console.error('상담 요청 목록 불러오기 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 리스트 렌더링 전 아바타/연락처/이메일 소스 구성
  const enrichedRequests = useMemo(() => {
    return (pendingRequests || []).map((req) => {
      const cid = extractClientId(req);
      const detail = cid ? detailMap[cid] : undefined;
      const nested = req.requester || req.client || req.child || req.member || req.user || {};
      const avatarSource = detail || nested || req;

      const phone = extractPhone(detail, nested, req);
      const email = extractEmail(detail, nested, req);

      return { raw: req, avatarSource, phone, email };
    });
  }, [pendingRequests, detailMap]);

  const handleStatusUpdate = async (scheduleId, status) => {
    try {
      await api.patch(
        '/schedule',
        { scheduleId, status },
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );
      setPendingRequests((prev) => prev.filter((req) => req.scheduleId !== scheduleId));
      alert(`요청을 성공적으로 ${status === 'ACCEPTED' ? '수락' : '거절'}했습니다.`);
    } catch (err) {
      alert('요청 처리에 실패했습니다.');
      console.error('상태 업데이트 오류:', err);
    }
  };

  const handleShowProfileModal = (client) => {
    setSelectedClient(client);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <p>요청 목록을 불러오는 중입니다...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-5 main-container">
      <div className="page-inner">
        <div className="page-header">
          <h2 className="page-title">수신된 상담 요청</h2>
          <div className="page-header-actions">
            <Button
              variant="light"
              size="sm"
              className="btn-soft-danger no-hover-btn page-header-btn"
              onClick={handleBack}
            >
              <i className="bi bi-arrow-left me-1" /> 뒤로가기
            </Button>
          </div>
        </div>

        <Row>
          <Col md={12}>
            <Card className="shadow-sm p-3 card-base no-lift">
              <Card.Body>
                {enrichedRequests.length === 0 ? (
                  <Alert variant="info">현재 수신된 상담 요청이 없습니다.</Alert>
                ) : (
                  <div>
                    {enrichedRequests.map(({ raw, avatarSource, phone, email }) => (
                      <div
                        key={raw.scheduleId}
                        className="mb-3 card-base matching-client-item no-lift request-item"
                      >
                        <Row className="align-items-center w-100">
                          <Col md={7} className="matching-client-info">
                            <div className="client-row">
                              <img
                                src={getCharImg(avatarSource)}
                                alt="요청자 캐릭터"
                                className="avatar"
                                draggable={false}
                              />
                              <div className="client-text">
                                <h5>{raw.name}님의 상담 요청</h5>
                                <p className="mb-1">이메일: {email}</p>
                                <p className="mb-1">연락처: {phone}</p>
                              </div>
                            </div>
                          </Col>

                          <Col md={5} className="matching-client-actions">
                            {/* 1행: 정보 보기 (짧게) */}
                            <Button
                              variant="light"
                              className="btn-soft-primary no-hover-btn info-btn"
                              onClick={() => handleShowProfileModal(raw)}
                            >
                              요청자 정보 보기
                            </Button>
                            {/* 2행: 수락 / 거절 (간격 확보) */}
                            <div className="action-row">
                              <Button
                                variant="light"
                                className="btn-soft-success no-hover-btn"
                                onClick={() => handleStatusUpdate(raw.scheduleId, 'ACCEPTED')}
                              >
                                수락
                              </Button>
                              <Button
                                variant="light"
                                className="btn-soft-danger no-hover-btn"
                                onClick={() => handleStatusUpdate(raw.scheduleId, 'REJECTED')}
                              >
                                거절
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {selectedClient && (
        <UserProfileModal
          show={showProfileModal}
          handleClose={handleCloseProfileModal}
          userProfile={selectedClient}
        />
      )}
    </Container>
  );
}

export default TherapistMatchingPage;
