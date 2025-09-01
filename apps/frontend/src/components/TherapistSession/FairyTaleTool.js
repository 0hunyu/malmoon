import React from 'react';
import { Button, Alert, ListGroup } from 'react-bootstrap';

function FairyTaleTool({
  fairyTaleInfo, fairyTaleContent, currentFairyTalePage,
  selectedSentence, setSelectedSentence, handlePageChange,
  sendSentence, isRecording, startRecording, stopRecording,
  handleClearSentence // handleClearSentence 함수를 props로 받습니다.
}) {
  return (
    <div className="p-2">
      <h6 className="text-center mb-3">{fairyTaleInfo.title} (페이지 {currentFairyTalePage}/{fairyTaleInfo.endPage})</h6>
      <ListGroup className="mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {fairyTaleContent[currentFairyTalePage] ? (
          fairyTaleContent[currentFairyTalePage].map((sentence) => (
            <ListGroup.Item
              key={sentence.sentenceId}
              action
              onClick={() => setSelectedSentence(prev => prev && prev.sentenceId === sentence.sentenceId ? null : sentence)}
              active={selectedSentence && selectedSentence.sentenceId === sentence.sentenceId}
              className="fairy-tale-sentence"
            >
              {sentence.sentence}
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item>페이지를 불러오는 중...</ListGroup.Item>
        )}
      </ListGroup>
      <div className="d-flex justify-content-between">
        <Button 
          variant="outline-secondary" 
          onClick={() => handlePageChange(currentFairyTalePage - 1)} 
          disabled={currentFairyTalePage <= fairyTaleInfo.startPage}
        >
          이전 페이지
        </Button>
        <Button 
          variant="outline-secondary" 
          onClick={() => handlePageChange(currentFairyTalePage + 1)} 
          disabled={currentFairyTalePage >= fairyTaleInfo.endPage}
        >
          다음 페이지
        </Button>
      </div>
      {selectedSentence && (
        <div className="mt-3">
          <Alert variant="success" className="text-center">
            선택된 문장: <strong>{selectedSentence.sentence}</strong>
          </Alert>
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={sendSentence}>
              <i className="bi bi-send-fill me-2"></i>선택한 문장 전송
            </Button>
            <Button variant="outline-danger" onClick={handleClearSentence}>
              <i className="bi bi-eraser-fill me-2"></i>문장 지우기
            </Button>
          </div>
          <div className="d-grid mt-2">
            <Button 
              variant={isRecording ? "danger" : "success"} 
              onClick={isRecording ? stopRecording : startRecording}
            >
              <i className={`bi bi-mic${isRecording ? "-mute-fill" : "-fill"} me-2`}></i>
              {isRecording ? '녹음 중지' : '녹음 시작'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FairyTaleTool;
