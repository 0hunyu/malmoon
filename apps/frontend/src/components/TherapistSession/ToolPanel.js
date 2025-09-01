import React from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import ChatTool from './ChatTool';
import FairyTaleTool from './FairyTaleTool';
import FilterTool from './FilterTool';
import AacTool from './AacTool'; // Add this import

function ToolPanel({
  activeToolTab, setShowToolPanel,
  chatMessages, chatInput, setChatInput, sendChatMessage,
  fairyTaleInfo, fairyTaleContent, currentFairyTalePage,
  selectedSentence, setSelectedSentence, handlePageChange,
  sendSentence, isRecording, startRecording, stopRecording,
  backgroundImages, selectedBackgroundImage, isFilterActive,
  applyBackgroundFilter, removeBackgroundFilter, applyLensById,
  initialSelectedAacIds, initialSelectedFilterIds,
  allAacs, allFilters, onSendAac, roomRef, availableAacs, handleClearSentence
}) {
  return (
    <Card className="h-100 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          {activeToolTab === 'aac' ? 'AAC 도구' :
           activeToolTab === 'filter' ? '필터 도구' :
           activeToolTab === 'chat' ? '채팅' : '동화 도구'}
        </h5>
        <Button variant="light" size="sm" onClick={() => setShowToolPanel(false)}>&times;</Button>
      </Card.Header>
      <Card.Body className="p-2">
        {activeToolTab === 'aac' && (
          <AacTool
            initialSelectedAacIds={initialSelectedAacIds}
            allAacs={allAacs}
            onSendAac={onSendAac}
            roomRef={roomRef}
            availableAacs={availableAacs} // availableAacs를 AacTool로 전달
          />
        )}
        {activeToolTab === 'chat' && (
          <ChatTool
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChatMessage={sendChatMessage}
          />)}
        {activeToolTab === 'fairyTale' && fairyTaleInfo && (
          <FairyTaleTool
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
            handleClearSentence={handleClearSentence}
          />
        )}
        {activeToolTab === 'filter' && (
          <FilterTool
            backgroundImages={backgroundImages}
            selectedBackgroundImage={selectedBackgroundImage}
            isFilterActive={isFilterActive}
            applyBackgroundFilter={applyBackgroundFilter}
            removeBackgroundFilter={removeBackgroundFilter}
            applyLensById={applyLensById}
            initialSelectedFilterIds={initialSelectedFilterIds}
            allFilters={allFilters}
          />
        )}
      </Card.Body>
    </Card>
  );
}

export default ToolPanel;
