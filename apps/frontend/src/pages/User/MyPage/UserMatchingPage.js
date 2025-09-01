import React, { useState, useEffect, useMemo } from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';
import TherapistProfileModal from '../../../components/modals/TherapistProfileModal';
import './UserMatchingPage.css';

/* 캐릭터 이미지 경로는 프로젝트 구조에 맞춰 수정하세요 */
import penguinImg from '../../../logoimage/penguin.png';
import bearImg    from '../../../logoimage/bear.png';
import duckImg    from '../../../logoimage/duck.png';
import wolfImg    from '../../../logoimage/wolf.png';
import puppyImg   from '../../../logoimage/puppy.png';
import parrotImg  from '../../../logoimage/parrot.png';

function UserMatchingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState(null);

  // 검색/정렬/필터
  const [search, setSearch] = useState('');
  const [minYears, setMinYears] = useState(0);
  const [sortKey, setSortKey] = useState('career-desc'); // 'career-desc' | 'name-asc'

  // 페이지네이션 (4칸 × 2줄)
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // 캐릭터 id -> 이미지 매핑
  const characterImages = {
    6: penguinImg, // 말펭이
    1: bearImg,    // 말곰이
    5: duckImg,    // 규덕
    2: wolfImg,    // 말랑이
    3: puppyImg,   // 말뭉이
    4: parrotImg,  // 말랭이
  };

  const getProfileId = (t) => {
    const any = t?.profile ?? t?.profileImageId ?? t?.profile_image_id ?? t?.profileCharacterId;
    const n = Number(any);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  useEffect(() => {
    const fetchTherapists = async () => {
      if (!user || !user.accessToken) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/schedule/therapist', {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        setTherapists(response.data || []);
      } catch (err) {
        console.error('치료사 목록 불러오기 오류:', err);
        setError('치료사 목록을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchTherapists();
  }, [user]);

  const filteredTherapists = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = therapists.filter(t => {
      const name = (t?.name || '').toLowerCase();
      const email = (t?.email || '').toLowerCase();
      const years = Number(t?.careerYears || 0);
      const matchText = !q || name.includes(q) || email.includes(q);
      const matchYears = years >= Number(minYears);
      return matchText && matchYears;
    });

    if (sortKey === 'career-desc') {
      list = list.sort((a, b) => Number(b?.careerYears || 0) - Number(a?.careerYears || 0));
    } else if (sortKey === 'name-asc') {
      list = list.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
    }
    return list;
  }, [therapists, search, minYears, sortKey]);

  // 필터 변경 시 페이지 1로
  useEffect(() => {
    setCurrentPage(1);
  }, [search, minYears, sortKey, therapists]);

  const totalPages = Math.max(1, Math.ceil(filteredTherapists.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredTherapists.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleShowProfileModal = (therapist) => {
    setSelectedTherapist(therapist);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedTherapist(null);
  };

  // 상담 신청하기: '정식 이름'을 state로 함께 전달
  const handleApply = (itemOrId) => {
    const therapistObj = typeof itemOrId === 'object' ? itemOrId : null;
    const id = therapistObj
      ? (therapistObj?.therapistId ?? therapistObj?.id ?? therapistObj?.therapist?.therapistId)
      : itemOrId;

    if (!id) {
      alert('치료사 ID를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
      console.error('No therapistId in item:', itemOrId);
      return;
    }

    const realName = (therapistObj?.name ?? therapistObj?.therapist?.name ?? '').toString().trim();

    navigate(`/user/booking/${id}`, {
      state: { therapistName: realName || undefined }, // 닉네임/ID 말고 '이름'만 전달
    });
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const skeletonCount = ITEMS_PER_PAGE;

  return (
    <div className="user-matching-page">
      <Container className="user-matching-container">
        {/* 헤더 */}
        <header className="page-header">
          <h2 className="title">
            <span className="brand-m">말</span><span className="brand-b">문</span> 치료사 매칭
          </h2>
          <p className="subtitle">원하는 치료사를 빠르게 찾아 상담을 신청하세요.</p>
        </header>

        {/* 검색/정렬/필터 */}
        <section className="toolbar" aria-label="검색 및 정렬">
          <div className="toolbar-left">
            <div className="input-wrap">
              <label className="label">검색</label>
              <input
                type="text"
                className="search-input"
                placeholder="치료사 이름 또는 이메일 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="toolbar-right">
            <div className="range-wrap">
              <label className="label">최소 경력(년)</label>
              <input
                type="number"
                min={0}
                max={50}
                className="years-input"
                value={minYears}
                onChange={(e) => setMinYears(e.target.value)}
              />
            </div>
            <div className="select-wrap">
              <label className="label">정렬</label>
              <select
                className="select"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="career-desc">경력 많은 순</option>
                <option value="name-asc">이름 오름차순</option>
              </select>
            </div>
          </div>
        </section>

        {/* 오류 */}
        {!!error && (
          <div className="alert-wrap">
            <Alert variant="danger" className="mm-alert">{error}</Alert>
          </div>
        )}

        {/* 4열 고정 그리드 (페이지당 8개) */}
        <section className="therapist-grid">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, idx) => (
                <article className="therapist-card skeleton" key={`s-${idx}`}>
                  <div className="avatar skeleton-box" />
                  <div className="info">
                    <div className="name skeleton-line" />
                    <div className="meta skeleton-line short" />
                    <div className="meta skeleton-line shorter" />
                  </div>
                  <div className="actions">
                    <button className="mm-btn secondary" disabled>프로필 보기</button>
                    <button className="mm-btn primary" disabled>상담 신청하기</button>
                  </div>
                </article>
              ))
            : filteredTherapists.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-emoji">🔎</div>
                  <h3>조건에 맞는 치료사가 없어요</h3>
                  <p>검색어를 바꾸거나 필터를 초기화해보세요.</p>
                  {(search || Number(minYears) > 0) && (
                    <button
                      className="mm-btn ghost"
                      onClick={() => { setSearch(''); setMinYears(0); setSortKey('career-desc'); }}
                    >
                      필터 초기화
                    </button>
                  )}
                </div>
              ) : (
                pageItems.map((t) => (
                  <article className="therapist-card" key={t?.therapistId ?? t?.id}>
                    <div className="avatar">
                      {(() => {
                        const id = getProfileId(t);
                        const imgSrc = t?.profileImageUrl || characterImages[id];
                        if (imgSrc) {
                          return <img className="avatar-img" src={imgSrc} alt="프로필 캐릭터" />;
                        }
                        return <span className="initial">{(t?.name && t.name[0]) ? t.name[0] : '치'}</span>;
                      })()}
                    </div>
                    <div className="info">
                      <div className="name-row">
                        <h3 className="name">{t?.name}</h3>
                        <span className="mm-badge">{Number(t?.careerYears || 0)}년 경력</span>
                      </div>
                      <p className="meta">이메일: {t?.email || '-'}</p>
                      <p className="meta">연락처: {t?.telephone || '-'}</p>
                    </div>
                    <div className="actions">
                      <button
                        className="mm-btn secondary"
                        onClick={() => handleShowProfileModal(t)}
                      >
                        프로필 보기
                      </button>
                      <button
                        className="mm-btn primary"
                        onClick={() => handleApply(t)}
                      >
                        상담 신청하기
                      </button>
                    </div>
                  </article>
                ))
              )
          }
        </section>

        {/* 페이지네이션 */}
        {!loading && filteredTherapists.length > 0 && totalPages > 1 && (
          <nav className="pagination-wrap" aria-label="페이지 탐색">
            <button
              className="page-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              aria-label="첫 페이지"
            >
              «
            </button>
            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="이전 페이지"
            >
              ‹
            </button>

            {pages.map(p => (
              <button
                key={p}
                className={`page-btn ${p === currentPage ? 'active' : ''}`}
                onClick={() => handlePageChange(p)}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p}
              </button>
            ))}

            <button
              className="page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="다음 페이지"
            >
              ›
            </button>
            <button
              className="page-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="마지막 페이지"
            >
              »
            </button>
          </nav>
        )}
      </Container>

      <TherapistProfileModal
        show={showProfileModal}
        handleClose={handleCloseProfileModal}
        therapistProfile={selectedTherapist}
      />
    </div>
  );
}

export default UserMatchingPage;
