import React, { useState, useEffect, useCallback } from 'react';
import { RoomEvent } from 'livekit-client';
import { Button, Form, ListGroup } from 'react-bootstrap';
import './AacTool.css';

function AacTool({ roomRef, availableAacs }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [question, setQuestion] = useState('이럴 땐 어떻게 말할까요?');
  const [userSelection, setUserSelection] = useState(null); // { selectedId, aacName }

  // 환자의 선택을 수신하는 리스너
  const handleDataReceived = useCallback((payload) => {
    const data = JSON.parse(new TextDecoder().decode(payload));
    if (data.type === 'aac-selection') {
      const selectedAac = availableAacs.find(aac => aac.id === data.selectedId);
      setUserSelection({
        selectedId: data.selectedId,
        aacName: selectedAac ? selectedAac.name : '알 수 없는 선택'
      });
      // 3초 후에 피드백 메시지 사라지게 하기
      setTimeout(() => setUserSelection(null), 3000);
    }
  }, [availableAacs]);

  useEffect(() => {
    const room = roomRef.current;
    if (room) {
      room.on(RoomEvent.DataReceived, handleDataReceived);
      return () => {
        room.off(RoomEvent.DataReceived, handleDataReceived);
      };
    }
  }, [roomRef, handleDataReceived]);

  const handleSelectionChange = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSendClick = async () => {
    if (selectedIds.size === 0) {
      alert('보낼 AAC를 하나 이상 선택하세요.');
      return;
    }
    if (!question.trim()) {
      alert('질문을 입력하세요.');
      return;
    }

    const room = roomRef.current;
    if (room && room.localParticipant) {
      const payload = JSON.stringify({
        type: 'aac-question',
        question: question,
        imageIds: Array.from(selectedIds)
      });
      try {
        await room.localParticipant.publishData(new TextEncoder().encode(payload), { reliable: true });
        console.log('AAC 질문 전송 성공:', payload);
        setSelectedIds(new Set()); // 전송 후 선택 해제
      } catch (error) {
        console.error('AAC 질문 전송 실패:', error);
        alert('AAC 질문 전송에 실패했습니다.');
      }
    } else {
      console.warn('LiveKit room 또는 localParticipant가 준비되지 않아 AAC 질문을 보낼 수 없습니다.');
      alert('세션 연결 상태를 확인해주세요. AAC 질문을 보낼 수 없습니다.');
    }
  };

  return (
    <div className="aac-tool-container">
      <h5>AAC 교육 도구</h5>
      <ul className="aac-list">
        {availableAacs.map(aac => (
          <li 
            key={aac.id} 
            className={`aac-list-item ${selectedIds.has(aac.id) ? 'selected' : ''}`}
            onClick={() => handleSelectionChange(aac.id)}
          >
            <img src={aac.imageUrl} alt={aac.name} />
            <span>{aac.name}</span>
          </li>
        ))}
      </ul>
      <Form.Group className="question-input">
        <Form.Label>질문 보내기</Form.Label>
        <Form.Control 
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 이럴 땐 어떻게 말할까요?"
        />
      </Form.Group>
      <Button onClick={handleSendClick} disabled={selectedIds.size === 0}>
        선택한 AAC 보내기
      </Button>

      {userSelection && (
        <div className="user-selection-feedback">
          대상자가 '{userSelection.aacName}'을(를) 선택했습니다.
        </div>
      )}
    </div>
  );
}

export default AacTool;