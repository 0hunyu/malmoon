import React from 'react';
import { Button } from 'react-bootstrap';

function ChatTool({ chatMessages, chatInput, setChatInput, sendChatMessage }) {
  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.sender === '나' ? 'my-message' : 'other-message'}`}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div className="chat-input-area">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="메시지를 입력하세요..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                sendChatMessage();
              }
            }}
          />
          <Button variant="primary" onClick={sendChatMessage}>
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChatTool;
