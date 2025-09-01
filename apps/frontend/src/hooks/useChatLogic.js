import { useState, useCallback } from 'react';
import api from '../api/axios';

export function useChatLogic(roomRef, user, chatRoomId, setChatMessages) {
  const [chatInput, setChatInput] = useState('');

  const sendChatMessage = useCallback(async () => {
    if (roomRef.current && chatInput.trim() !== '' && chatRoomId) {
      const messageContent = chatInput;
      setChatInput('');

      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'chat', payload: messageContent }));
        await roomRef.current.localParticipant.publishData(data, { reliable: true });
        setChatMessages(prev => [...prev, { sender: '나', message: messageContent }]);
      } catch (error) {
        console.error('Failed to send chat message via LiveKit:', error);
        alert('채팅 메시지 실시간 전송에 실패했습니다.');
      }

      try {
        await api.post('/chat/session/message', {
          sessionId: roomRef.current.name,
          roomId: chatRoomId,
          senderId: user.memberId,
          content: messageContent,
          messageType: 'TALK'
        }, {
          headers: { "Authorization": `Bearer ${user.accessToken}` }
        });
      } catch (error) {
        console.error('Failed to save chat message to backend:', error);
      }
    }
  }, [roomRef, chatInput, chatRoomId, user, setChatMessages]);

  return {
    chatInput, setChatInput, sendChatMessage
  };
}