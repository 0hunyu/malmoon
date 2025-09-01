import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/axios';
import './TherapistRegisterSchedulePage.css';

const dayMapping = {
    '월': 'MONDAY', '화': 'TUESDAY', '수': 'WEDNESDAY', '목': 'THURSDAY',
    '금': 'FRIDAY', '토': 'SATURDAY', '일': 'SUNDAY'
};
const reverseDayMapping = {
    'MONDAY': '월', 'TUESDAY': '화', 'WEDNESDAY': '수', 'THURSDAY': '목',
    'FRIDAY': '금', 'SATURDAY': '토', 'SUNDAY': '일'
};

const daysOfWeek = Object.keys(dayMapping);
const timeSlots = Array.from({ length: 10 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`);

function TherapistRegisterSchedulePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedDay, setSelectedDay] = useState('월');
    const [selectedTimes, setSelectedTimes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        const fetchTreatmentTimes = async () => {
            if (!user?.accessToken || !user?.memberId) {
                setError('로그인 정보가 없습니다.');
                setInitialLoad(false);
                return;
            }
            setIsLoading(true);
            try {
                const response = await api.get(`/treatment-time?therapistId=${user.memberId}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
                const fetchedTimes = response.data.treatmentTimes || {};
                const mappedTimes = {};
                for (const dayType in fetchedTimes) {
                    const korDay = reverseDayMapping[dayType];
                    if (korDay) {
                        mappedTimes[korDay] = fetchedTimes[dayType].map(time => `${String(time).padStart(2, '0')}:00`);
                    }
                }
                setSelectedTimes(mappedTimes);
            } catch (err) {
                console.error('기존 치료 시간 불러오기 실패:', err);
                setError(err.response?.data?.message || '기존 치료 시간을 불러오는 데 실패했습니다.');
            } finally {
                setIsLoading(false);
                setInitialLoad(false);
            }
        };
        fetchTreatmentTimes();
    }, [user]);

    const handleTimeSlotClick = (time) => {
        const currentDayTimes = selectedTimes[selectedDay] || [];
        const newDayTimes = currentDayTimes.includes(time)
            ? currentDayTimes.filter(t => t !== time)
            : [...currentDayTimes, time];
        setSelectedTimes({ ...selectedTimes, [selectedDay]: newDayTimes });
    };

    const handleRegister = async () => {
        if (!user?.accessToken) {
            setError('로그인이 필요합니다.');
            return;
        }
        setIsLoading(true);
        setError('');

        const treatmentTimesPayload = {};
        Object.values(dayMapping).forEach(dayEng => { treatmentTimesPayload[dayEng] = []; });

        for (const [dayKor, times] of Object.entries(selectedTimes)) {
            const dayEng = dayMapping[dayKor];
            if (dayEng && times.length > 0) {
                treatmentTimesPayload[dayEng] = times.map(t => parseInt(t.split(':')[0])).sort((a, b) => a - b);
            }
        }

        try {
            await api.patch('/treatment-time', { treatmentTimes: treatmentTimesPayload }, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            alert('치료 가능 시간이 성공적으로 업데이트되었습니다.');
            navigate('/therapist/mypage/schedule');
        } catch (err) {
            console.error('시간 업데이트 실패:', err);
            setError(err.response?.data?.message || '시간 업데이트 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    if (initialLoad) {
        return (
            <div className="trs-page">
                <div className="trs-container">
                    <div className="loading-overlay">로딩 중...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="trs-page">
            <div className="trs-container">
                <header className="page-header">
                    <h2 className="title">치료 가능 시간 등록</h2>
                    <p className="subtitle">요일별로 가능한 시간대를 선택하여 일정을 관리하세요.</p>
                </header>

                <div className="content-card">
                    {error && <div className="mm-alert">{error}</div>}
                    
                    <h3 className="section-title">1. 요일 선택</h3>
                    <div className="day-selection-group">
                        {daysOfWeek.map(day => (
                            <button
                                key={day}
                                className={`mm-btn day ${selectedDay === day ? 'active' : ''}`}
                                onClick={() => setSelectedDay(day)}
                            >
                                {day}
                            </button>
                        ))}
                    </div>

                    <h3 className="section-title">2. 시간 선택 ({selectedDay}요일)</h3>
                    <div className="time-slot-grid">
                        {timeSlots.map(time => {
                            const isSelected = (selectedTimes[selectedDay] || []).includes(time);
                            return (
                                <button
                                    key={time}
                                    className={`mm-btn time ${isSelected ? 'active' : ''}`}
                                    onClick={() => handleTimeSlotClick(time)}
                                >
                                    {time}
                                </button>
                            );
                        })}
                    </div>

                    <hr style={{ margin: '28px 0', border: '0', borderTop: '1px solid var(--line)' }} />

                    <h3 className="section-title">선택된 시간 확인</h3>
                    <div className="selected-times-summary">
                        {Object.values(selectedTimes).every(t => t.length === 0) ? (
                            <p style={{ margin: 0, color: 'var(--muted)' }}>선택된 시간이 없습니다.</p>
                        ) : (
                            Object.entries(selectedTimes).map(([day, times]) =>
                                times.length > 0 && (
                                    <div key={day} className="selected-day-block">
                                        <div className="selected-day-title">{day}요일</div>
                                        <div className="selected-time-chips">
                                            {times.sort().map(time => (
                                                <div key={time} className="selected-time-chip">{time}</div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )
                        )}
                    </div>

                    <div className="submit-area">
                        <button 
                            className="mm-btn submit"
                            onClick={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? '업데이트 중...' : '시간 업데이트'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TherapistRegisterSchedulePage;