import React, { useState, useEffect, useCallback } from 'react';
import { RoomEvent } from 'livekit-client';
import api from '../../api/axios'; // API 요청을 위한 axios 인스턴스
import './AacDisplay.css'; // 방금 만든 CSS 파일

function AacDisplay({ roomRef, receivedAacQuestion, onSelect }) {
  const [aacData, setAacData] = useState(null); // { question, imageIds }
  const [aacDetails, setAacDetails] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);

  // AAC 상세 정보 API 호출
  useEffect(() => {
    if (!aacData || aacData.imageIds.length === 0) return;

    const fetchAacDetails = async () => {
      try {
        const requests = aacData.imageIds.map(id => api.get(`/aacs/${id}`));
        const responses = await Promise.all(requests);
        const details = responses.map(res => res.data);
        console.log(details);
        setAacDetails(details);
      } catch (error) {
        console.error("AAC 상세 정보를 불러오는 데 실패했습니다:", error);
        // 에러 처리 (예: 사용자에게 알림)
      }
    };

    fetchAacDetails();
  }, [aacData]);

  // receivedAacQuestion prop이 변경될 때 데이터 처리
  useEffect(() => {
    if (receivedAacQuestion) {
      console.log('AacDisplay: Received AAC question data via prop:', receivedAacQuestion);
      setAacData({ question: receivedAacQuestion.question, imageIds: receivedAacQuestion.imageIds });
      setAacDetails([]); // 새 질문이 오면 기존 상세 정보 초기화
      setSelectedCardId(null); // 선택 상태 초기화
      // 부모 컴포넌트에서 receivedAacQuestion 상태를 null로 재설정하는 로직이 필요할 수 있습니다.
      // 그렇지 않으면 동일한 데이터가 다시 전달될 때 이 useEffect가 다시 실행되지 않습니다.
    }
  }, [receivedAacQuestion]);

  // 카드 클릭 처리
  const handleCardClick = async (id) => {
    if (selectedCardId) return; // 이미 선택했다면 다시 선택 불가

    setSelectedCardId(id);
    
    const selectedItem = aacDetails.find(item => item.id === id);
    if (onSelect && selectedItem) {
      onSelect(selectedItem);
    }
    // 선택 결과를 치료사에게 전송
    const room = roomRef.current;
    if (room && room.localParticipant) {
      const payload = JSON.stringify({ type: 'aac-selection', selectedId: id });
      try {
        await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        console.log('AAC 선택 전송 성공:', payload);
      } catch (error) {
        console.error('AAC 선택 전송 실패:', error);
        // Optionally, alert the user or handle the error visually
      }
    } else {
      console.warn('LiveKit room 또는 localParticipant가 준비되지 않아 AAC 선택을 보낼 수 없습니다.');
      // Optionally, alert the user
    }

    // 애니메이션 시간(1.5초) 후 컴포넌트 숨기기
    setTimeout(() => {
      setAacData(null);
      setAacDetails([]);
      setSelectedCardId(null);
    }, 1500);
  };

  // 렌더링 조건: aacDetails가 있어야 화면에 표시
  if (!aacData || aacDetails.length === 0) {
    return null;
  }

  return (
    <div className="aac-display-container">
      <h2 className="aac-question">{aacData.question}</h2>
      <div className="aac-card-grid">
        {aacDetails.map(item => (
          <div 
            key={item.id} 
            className={`aac-card ${selectedCardId ? (item.id === selectedCardId ? 'selected' : 'hidden') : ''}`}
            onClick={() => handleCardClick(item.id)}
          >
            <div className="aac-card-inner">
              <div className="aac-card-front">
                <img src={item.fileUrl} alt={item.name} className="aac-card-image" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AacDisplay;
