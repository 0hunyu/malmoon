import React from 'react';
import { Button } from 'react-bootstrap';

function SessionControlPanel({
  isMuted, toggleMute, isVideoOff, toggleVideo,
  activeToolTab, toggleToolPanel, fairyTaleInfo, endSession
}) {
  return (
    <div className="control-panel">
      <div className="d-flex align-items-center justify-content-center h-100">
        <Button variant={isMuted ? "danger" : "light"} className="control-button me-3" onClick={toggleMute}>
          <i className={`bi bi-mic${isMuted ? "-mute-fill" : "-fill"}`}></i>
          <span>음소거</span>
        </Button>
        <Button variant={isVideoOff ? "danger" : "light"} className="control-button me-3" onClick={toggleVideo}>
          <i className={`bi bi-camera-video${isVideoOff ? "-off-fill" : "-fill"}`}></i>
          <span>캠 끄기</span>
        </Button>
        <Button variant={activeToolTab === 'aac' ? "primary" : "light"} className="control-button me-3" onClick={() => toggleToolPanel('aac')}>
          <i className="bi bi-chat-dots-fill"></i>
          <span>AAC</span>
        </Button>
        <Button variant={activeToolTab === 'filter' ? "success" : "light"} className="control-button me-3" onClick={() => toggleToolPanel('filter')}>
          <i className="bi bi-stars"></i>
          <span>필터</span>
        </Button>
        {fairyTaleInfo && (
          <Button variant={activeToolTab === 'fairyTale' ? "info" : "light"} className="control-button me-3" onClick={() => toggleToolPanel('fairyTale')}>
            <i className="bi bi-book-fill"></i>
            <span>동화</span>
          </Button>
        )}
        <Button variant={activeToolTab === 'chat' ? "warning" : "light"} className="control-button me-3" onClick={() => toggleToolPanel('chat')}>
          <i className="bi bi-chat-right-text-fill"></i>
          <span>채팅</span>
        </Button>
        <Button variant="danger" className="control-button ms-auto" onClick={endSession}>
          <i className="bi bi-x-circle-fill" style={{ fontSize: '1.5em' }}></i>
          <span>수업 종료</span>
        </Button>
      </div>
    </div>
  );
}

export default SessionControlPanel;
