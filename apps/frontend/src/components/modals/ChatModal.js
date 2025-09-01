import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../api/axios'; // Assuming axios is configured for API calls
import './ChatModal.css'; // Will create this CSS file later if needed

function ChatModal({ show, handleClose }) {
    const { user } = useAuth();
    const [matchedTherapist, setMatchedTherapist] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatLoading, setChatLoading] = useState(true);
    const [chatError, setChatError] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchMatchedTherapistAndRoom = async () => {
            if (!user || !user.accessToken) {
                setChatError('로그인이 필요합니다.');
                setChatLoading(false);
                return;
            }

            setChatLoading(true);
            setChatError('');
            setMatchedTherapist(null);
            setRoomId(null);
            setMessages([]);

            try {
                // 1. Fetch matched therapist
                const therapistResponse = await axios.get('/schedule/me/therapist/accepted', {
                    headers: { "Authorization": `Bearer ${user.accessToken}` }
                });

                if (therapistResponse.data && therapistResponse.data.length > 0) {
                    const myTherapistSchedule = therapistResponse.data[0]; // This is MyTherapistScheduleRes
                    const therapist = myTherapistSchedule.therapist; // Get the nested therapist object
                    setMatchedTherapist(therapist);

                    // Check if therapistId is null before proceeding
                    if (therapist.therapistId === null || therapist.therapistId === undefined) {
                        setChatError('매칭된 치료사 정보가 불완전합니다 (치료사 ID 없음).');
                        setChatLoading(false);
                        return;
                    }

                    // 2. Create or get chat room
                    const roomResponse = await axios.post('/chat/room', {
                        roomName: `${user.name} and ${therapist.name}'s Chat`,
                        roomType: 'ONE_TO_ONE',
                        participantIds: [user.memberId, therapist.therapistId] // Use therapistId here
                    }, {
                        headers: { "Authorization": `Bearer ${user.accessToken}` }
                    });
                    setRoomId(roomResponse.data.roomId);
                } else {
                    setChatError('매칭된 치료사가 없습니다.');
                }
            } catch (err) {
                setChatError('채팅 정보를 불러오는 데 실패했습니다.');
                console.error('Error fetching chat info:', err);
            } finally {
                setChatLoading(false);
            }
        };

        if (show) {
            fetchMatchedTherapistAndRoom();
        }
    }, [show, user]); // Re-run when modal is shown or user changes

    useEffect(() => {
        const fetchMessages = async () => {
            if (!roomId) return;
            try {
                const response = await axios.get(`/chat/room/${roomId}/messages`, {
                    headers: { "Authorization": `Bearer ${user.accessToken}` }
                });
                setMessages(response.data);
            } catch (err) {
                console.error('Error fetching messages:', err);
            }
        };

        if (show && roomId) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [show, roomId, user]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !roomId) return;

        try {
            await axios.post('/chat/room/message', {
                roomId: roomId,
                senderId: user.memberId,
                content: newMessage,
                messageType: 'TALK',
                sendAt: new Date().toISOString()
            }, {
                headers: { "Authorization": `Bearer ${user.accessToken}` }
            });
            setNewMessage('');
            // Immediately fetch messages after sending
            const response = await axios.get(`/chat/room/${roomId}/messages`, {
                headers: { "Authorization": `Bearer ${user.accessToken}` }
            });
            setMessages(response.data);
        } catch (err) {
            setChatError('메시지 전송에 실패했습니다.');
            console.error('Error sending message:', err);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="md">
            <Modal.Header closeButton>
                <Modal.Title>
                    {matchedTherapist ? `${matchedTherapist.name} 치료사님과의 채팅` : '채팅'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="chat-modal-body">
                {chatLoading ? (
                    <div className="text-center">채팅 정보를 불러오는 중입니다...</div>
                ) : chatError ? (
                    <Alert variant="danger">{chatError}</Alert>
                ) : (
                    <div className="messages-area">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message-bubble ${msg.senderId === user.memberId ? 'sent' : 'received'}`}
                            >
                                <div className="message-content">{msg.content}</div>
                                <div className="message-time">{new Date(msg.sendAt).toLocaleTimeString()}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Form onSubmit={handleSendMessage} className="w-100">
                    <InputGroup>
                        <Form.Control
                            type="text"
                            id="chatMessageInput" // Added id
                            name="message"       // Added name
                            placeholder="메시지를 입력하세요..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={chatLoading || !!chatError || !matchedTherapist}
                        />
                        <Button variant="primary" type="submit" disabled={chatLoading || !!chatError || !matchedTherapist}>
                            전송
                        </Button>
                    </InputGroup>
                </Form>
            </Modal.Footer>
        </Modal>
    );
}

export default ChatModal;