import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import './UserSchedulePage.css';

function UserSchedulePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 날짜+시간 정렬용
  const toSortableTs = (dateStr, hourNum) => {
    try {
      const [y, m, d] = (dateStr || '').split('-').map(Number);
      const dt = new Date(y || 1970, (m || 1) - 1, d || 1, Number(hourNum) || 0, 0, 0, 0);
      return dt.getTime();
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/schedule/me/today', {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const list = (res.data || []).map((s) => {
          const hour = Number(s.time ?? s.hour ?? 0);
          return {
            id: s.therapistId,                    // 임시 id
            date: s.date || today,
            timeHour: isNaN(hour) ? 0 : hour,
            timeText: `${String(hour).padStart(2, '0')}:00`, // 24h 표기
            therapist: s.therapistName,
            status: '예정',
            notes: '',
          };
        });

        list.sort((a, b) => toSortableTs(a.date, a.timeHour) - toSortableTs(b.date, b.timeHour));
        setSchedules(list);
      } catch (err) {
        setError('일정 정보를 불러오는 데 실패했습니다.');
        console.error('Failed to fetch schedules:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.accessToken) fetchSchedules();
    else {
      setLoading(false);
      setError('로그인이 필요합니다.');
    }
  }, [user]);

  const handleStartSession = (scheduleId) => {
    navigate('/user/session', { state: { bookingId: scheduleId } });
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <p>일정 정보를 불러오는 중입니다...</p>
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

  const upcomingCount = schedules.filter((s) => s.status === '예정').length;

  return (
    <Container className="my-5 main-container user-schedule-page">
      <h2 className="page-title text-center mb-2">나의 치료 예약/일정</h2>
      <p className="page-subtitle text-center">
        오늘 예정된 예약 <span className="count-badge">{upcomingCount}</span>건
      </p>

      <Row>
        <Col md={12}>
          <Card className="shadow-sm p-3 card-base schedule-card">
            <Card.Body>
              {schedules.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-emoji">📅</div>
                  <h5>예정된 예약이 없습니다.</h5>
                  <p className="empty-text">매칭 페이지에서 치료사와 상담을 신청해보세요.</p>
                </div>
              ) : (
                <ListGroup variant="flush" className="schedule-list">
                  {schedules.map((s) => (
                    <ListGroup.Item key={s.id} className="schedule-item">
                      {/* 좌: 두 줄, 우: 버튼 */}
                      <div className="left">
                        <div className="row-top">
                          <span className="date-text">{s.date}</span>
                          <span className="time-text">({s.timeText})</span>
                        </div>
                        <div className="row-bottom">
                          <span className="therapist-name">{s.therapist}</span>
                          <span>&nbsp;님과 수업 예정</span>
                          <span className="status-inline">&nbsp;(상태: {s.status})</span>
                        </div>
                      </div>

                      {s.status === '예정' && (
                        <div className="right">
                          <Button
                            variant="success"
                            className="start-btn"
                            onClick={() => handleStartSession(s.id)}
                          >
                            수업 시작
                          </Button>
                        </div>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UserSchedulePage;
