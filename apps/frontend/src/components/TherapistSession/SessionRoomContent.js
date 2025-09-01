import React from "react";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import VideoCallArea from "./VideoCallArea";
import SessionControlPanel from "./SessionControlPanel";
import ToolPanel from "./ToolPanel";

function SessionRoomContent({
  rtcStatus,
  connectToLiveKit,
  setRtcStatus,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  isRemoteVideoOff,
  isVideoOff,
  remoteAudioTrack,
  selectedSentence,
  isMuted,
  toggleMute,
  toggleVideo,
  activeToolTab,
  toggleToolPanel,
  fairyTaleInfo,
  endSession,
  showToolPanel,
  setShowToolPanel,
  chatMessages,
  chatInput,
  setChatInput,
  sendChatMessage,
  fairyTaleContent,
  currentFairyTalePage,
  setSelectedSentence,
  handlePageChange,
  sendSentence,
  isRecording,
  startRecording,
  stopRecording,
  backgroundImages,
  selectedBackgroundImage,
  isFilterActive,
  applyBackgroundFilter,
  removeBackgroundFilter,
  applyLensById,
  outputCanvasRef,
  outputCKCanvasRef,
  containerRef,
  initialSelectedAacIds,
  initialSelectedFilterIds,
  allAacs,
  allFilters,
  onSendAac,
  finalChosenAacByClient,
  roomRef,
  availableAacs,
  handleClearSentence,
}) {
  const navigate = useNavigate();
  switch (rtcStatus) {
    case "disconnected":
      return (
        <div className="join-container">
          <div className="button-container">
            <Button
              size="lg"
              onClick={connectToLiveKit}
              className="join-button"
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>수업 입장하기
            </Button>
            <Button
              size="lg"
              className="back-button" // 클래스 추가
              variant="secondary" // 부트스트랩 버튼 색상 변경
              onClick={() => navigate("/therapist/mypage/schedule")} 
            >
              <i className="bi bi-arrow-left me-2"></i>돌아가기
            </Button>
          </div>
        </div>
      );
    case "connecting":
      return (
        <div className="join-container">
          <h2 className="mb-4">수업 세션에 연결 중입니다...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
      );
    case "error":
      return (
        <div className="join-container">
          <Alert variant="danger">
            <Alert.Heading>연결 오류</Alert.Heading>
            <p>
              세션에 연결하지 못했습니다. 네트워크 상태를 확인하시거나 잠시 후
              다시 시도해주세요.
            </p>
          </Alert>
          <Button
            variant="primary"
            onClick={() => setRtcStatus("disconnected")}
          >
            다시 시도
          </Button>
        </div>
      );
    case "connected":
      return (
        <>
          <Row className="h-100 flex-nowrap">
            <Col
              className={`session-main-content ${
                showToolPanel ? "col-md-9" : "col-md-12"
              } p-0`}
            >
              <VideoCallArea
                localVideoRef={localVideoRef}
                remoteVideoRef={remoteVideoRef}
                remoteAudioRef={remoteAudioRef}
                isRemoteVideoOff={isRemoteVideoOff}
                isVideoOff={isVideoOff}
                remoteAudioTrack={remoteAudioTrack}
                outputCanvasRef={outputCanvasRef}
                outputCKCanvasRef={outputCKCanvasRef}
                containerRef={containerRef}
              />

              {selectedSentence && (
                <div className="selected-sentence-display text-center p-2 mb-3">
                  {selectedSentence.sentence}
                </div>
              )}

              {/* 중앙에 최종 선택된 AAC 표시 */}
              {finalChosenAacByClient && (
                <div className="final-chosen-aac-display">
                  <img
                    src={finalChosenAacByClient.imageUrl}
                    alt={finalChosenAacByClient.name}
                    className="final-aac-image"
                  />
                  <p className="final-aac-text">
                    {finalChosenAacByClient.name}
                  </p>
                </div>
              )}

              <SessionControlPanel
                isMuted={isMuted}
                toggleMute={toggleMute}
                isVideoOff={isVideoOff}
                toggleVideo={toggleVideo}
                activeToolTab={activeToolTab}
                toggleToolPanel={toggleToolPanel}
                fairyTaleInfo={fairyTaleInfo}
                endSession={endSession}
              />
            </Col>

            {showToolPanel && (
              <Col md={3} className="tool-panel p-0">
                <ToolPanel
                  activeToolTab={activeToolTab}
                  setShowToolPanel={setShowToolPanel}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  sendChatMessage={sendChatMessage}
                  fairyTaleInfo={fairyTaleInfo}
                  fairyTaleContent={fairyTaleContent}
                  currentFairyTalePage={currentFairyTalePage}
                  selectedSentence={selectedSentence}
                  setSelectedSentence={setSelectedSentence}
                  handlePageChange={handlePageChange}
                  sendSentence={sendSentence}
                  isRecording={isRecording}
                  startRecording={startRecording}
                  stopRecording={stopRecording}
                  backgroundImages={backgroundImages}
                  selectedBackgroundImage={selectedBackgroundImage}
                  isFilterActive={isFilterActive}
                  applyBackgroundFilter={applyBackgroundFilter}
                  removeBackgroundFilter={removeBackgroundFilter}
                  applyLensById={applyLensById}
                  initialSelectedAacIds={initialSelectedAacIds}
                  initialSelectedFilterIds={initialSelectedFilterIds}
                  allAacs={allAacs}
                  allFilters={allFilters}
                  onSendAac={onSendAac}
                  roomRef={roomRef}
                  availableAacs={availableAacs} // availableAacs를 ToolPanel로 전달
                  handleClearSentence={handleClearSentence}
                />
              </Col>
            )}
          </Row>
        </>
      );
    default:
      return null;
  }
}

export default SessionRoomContent;
