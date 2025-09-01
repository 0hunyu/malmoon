import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import api from '../../../api/axios';
import { useAuth } from '../../../contexts/AuthContext';
import './TherapistBookingPage.css';

const dayMappingToKor = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목',
  FRIDAY: '금', SATURDAY: '토', SUNDAY: '일'
};

function TherapistBookingPage() {
  const { user } = useAuth();
  const { therapistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 매칭 페이지에서 전달된 '치료사 이름' 우선 사용(닉네임 제외)
  const initialName =
    (location.state?.therapistName ?? location.state?.name ?? '').toString().trim();

  const [therapistName, setTherapistName] = useState(initialName);
  const [availableTimes, setAvailableTimes] = useState({});
  const [selectedDayTimes, setSelectedDayTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAvailableTimes = async () => {
      if (!user || !user.accessToken) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/treatment-time?therapistId=${therapistId}`, {
          headers: { Authorization: `Bearer ${user.accessToken}` }
        });

        setAvailableTimes(res.data?.treatmentTimes || {});

        // 이름이 비어 있을 때만 서버 응답으로 보조 세팅(닉네임 제외)
        if (!therapistName) {
          const nameFromApi =
            (res.data?.therapist?.name ??
             res.data?.therapistName ??
             res.data?.name ??
             '').toString().trim();

          if (nameFromApi) setTherapistName(nameFromApi);
        }
      } catch (err) {
        setError('예약 가능 시간을 불러오는 데 실패했습니다.');
        console.error('시간 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableTimes();
    // therapistName은 내부에서 비어있을 때만 세팅하므로 의존성 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, therapistId]);

  const handleTimeSelect = (day, time) => {
    const isSelected = selectedDayTimes.some(it => it.day === day && it.time === time);
    setSelectedDayTimes(
      isSelected
        ? selectedDayTimes.filter(it => !(it.day === day && it.time === time))
        : [...selectedDayTimes, { day, time }]
    );
  };

  const handleBookingRequest = async () => {
    if (selectedDayTimes.length === 0) {
      alert('상담을 원하는 시간을 하나 이상 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 13); // 2주 범위

    const payload = {
      therapistId: parseInt(therapistId, 10),
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dayTimes: selectedDayTimes
    };

    try {
      await api.post('/schedule', payload, {
        headers: { Authorization: `Bearer ${user.accessToken}` }
      });
      alert('성공적으로 상담을 요청했습니다. 치료사의 수락을 기다려주세요.');
      navigate('/user/mypage/schedule');
    } catch (err) {
      setError(err.response?.data?.message || '상담 요청 중 오류가 발생했습니다.');
      console.error('상담 요청 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <p>정보를 불러오는 중입니다...</p>
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
    <Container className="my-5 main-container therapist-booking-page">
      <h2 className="page-title text-center mb-4">
        <span className="name-accent">{therapistName || '치료사'}</span> 님과 상담 신청
      </h2>

      <Card className="shadow-sm p-4 card-base booking-card">
        <Card.Body>
          <Card.Title className="section-title mb-4">치료사가 가능한 요일 및 시간</Card.Title>

          {Object.keys(availableTimes).length === 0 ? (
            <p className="empty-text">현재 예약 가능한 시간이 없습니다.</p>
          ) : (
            Object.entries(availableTimes).map(([day, times]) =>
              times.length > 0 && (
                <div key={day} className="mb-4 day-block">
                  <h5 className="day-title">
                    <span className="day-badge">{dayMappingToKor[day]}요일</span>
                  </h5>
                  <div className="time-slot-grid">
                    {times.sort((a, b) => a - b).map(time => {
                      const isSelected = selectedDayTimes.some(it => it.day === day && it.time === time);
                      return (
                        <Button
                          key={`${day}-${time}`}
                          variant={isSelected ? 'primary' : 'outline-secondary'}
                          onClick={() => handleTimeSelect(day, time)}
                          className="time-slot-button"
                        >
                          {`${String(time).padStart(2, '0')}:00`}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )
            )
          )}

          <hr className="my-4" />

          <Card.Title className="section-title mb-3">선택한 상담 시간</Card.Title>
          {selectedDayTimes.length === 0 ? (
            <p className="text-muted">원하는 시간을 선택해주세요.</p>
          ) : (
            <ul className="list-unstyled badge-list">
              {selectedDayTimes.map((item, idx) => (
                <li key={idx} className="mb-1">
                  <span className="mm-badge">
                    {dayMappingToKor[item.day]}요일 {`${String(item.time).padStart(2, '0')}:00`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="submit-wrap">
            <Button
              variant="success"
              size="lg"
              className="submit-button"
              onClick={handleBookingRequest}
              disabled={loading || selectedDayTimes.length === 0}
            >
              {loading ? '요청 중...' : '상담 요청하기'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TherapistBookingPage;
