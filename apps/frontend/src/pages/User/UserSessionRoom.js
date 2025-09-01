import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Col, Container, Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import "./UserSessionRoom.css";
import axios from "axios";
import { createLocalTracks, Room, RoomEvent, Track } from "livekit-client";
import { useAuth } from "../../contexts/AuthContext";
import AacDisplay from "../../pages/User/AacDisplay"; // ADDED: AacDisplay import
import CentralAacDisplay from "../../components/common/CentralAacDisplay";
//const LIVEKIT_URL = 'wss://www.malmoon.store';

const LIVEKIT_URL = "wss://i13c107.p.ssafy.io:8443";


function UserSessionRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthReady } = useAuth();
  const { bookingId } = location.state || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true);
  const [rtcStatus, setRtcStatus] = useState("disconnected");
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [receivedSentence, setReceivedSentence] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [receivedAacQuestion, setReceivedAacQuestion] = useState(null); // ADDED: State for AAC question
  const [centralImageUrl, setCentralImageUrl] = useState(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const roomRef = useRef(null);

  const handleRemoteTrackMuted = (trackPublication, participant) => {
    if (trackPublication.kind === Track.Kind.Video) {
      setIsRemoteVideoOff(true);
    }
  };

  const handleRemoteTrackUnmuted = (trackPublication, participant) => {
    if (trackPublication.kind === Track.Kind.Video) {
      setIsRemoteVideoOff(false);
    }
  };

  const connectToLiveKit = useCallback(async () => {
    if (!user || !user.accessToken) {
      alert(
        "로그인이 필요하거나 세션 연결에 필요한 정보가 부족합니다. 예약 페이지로 돌아갑니다."
      );
      navigate("/user/mypage/schedule");
      return;
    }

    setRtcStatus("connecting");

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });

    roomRef.current = room;

    const handleParticipantConnected = (participant) => {
      participant.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "video") {
          setRemoteVideoTrack(track);
          setIsRemoteVideoOff(false);
        } else if (track.kind === "audio") {
          setRemoteAudioTrack(track);
        }
      });

      participant.on(RoomEvent.IsSpeakingChanged, setIsRemoteSpeaking);

      participant.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === "video" && remoteVideoTrack?.sid === track.sid) {
          setRemoteVideoTrack(null);
          setIsRemoteVideoOff(true);
        } else if (track.kind === "audio") {
          setRemoteAudioTrack(null);
        }
      });
    };

    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);

    room.on(RoomEvent.Connected, () => {
      setRtcStatus("connected");
      room.remoteParticipants.forEach(handleParticipantConnected);
    });

    room.on(RoomEvent.Disconnected, () => setRtcStatus("disconnected"));

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      // This event is now handled within the handleParticipantConnected logic
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      // This event is now handled within the handleParticipantConnected logic
    });

    // MODIFIED: DataReceived listener to handle AAC questions and add debug logs
    room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
      console.log("UserSessionRoom: DataReceived listener triggered!");
      console.log("UserSessionRoom: Raw payload received:", payload);
      console.log("UserSessionRoom: Participant:", participant);
      console.log("UserSessionRoom: Kind:", kind);
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        console.log("UserSessionRoom: Parsed data:", data);

        if (data.type === "sentence") {
          setReceivedSentence(data.payload);
        } else if (data.type === "chat") {
          setChatMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: participant.identity,
              message: data.payload,
            },
          ]);
        } else if (data.type === "aac-question") {
          setReceivedAacQuestion(data);
        } else if (data.type === "clearSentence") {
          // ✨ 이 부분을 추가해야 합니다.
          setReceivedSentence(""); // 문장 상태를 초기화하여 화면에서 지웁니다.
        }
      } catch (error) {
        console.error(
          "UserSessionRoom: Error parsing received data:",
          error,
          "Raw payload:",
          payload
        );
      }
    });
    console.log("UserSessionRoom: DataReceived listener attached."); // DEBUG LOG

    try {
      const response = await axios.post(
        "/api/v1/sessions/join",
        { bookingId },
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const { token: livekitToken, chatRoomId: newChatRoomId } = response.data;
      setChatRoomId(newChatRoomId);

      await room.connect(LIVEKIT_URL, livekitToken);

      const localTracks = await createLocalTracks({ audio: true, video: true });
      for (const track of localTracks) {
        if (track.kind === "video" && localVideoRef.current) {
          track.attach(localVideoRef.current);
        }
        await room.localParticipant.publishTrack(track);
      }
    } catch (error) {
      console.error("LiveKit 연결 실패:", error);
      setRtcStatus("error");
      alert(
        "세션에 연결할 수 없습니다. 치료사가 아직 세션을 시작하지 않았거나, 오류가 발생했습니다. 콘솔을 확인해주세요."
      );
      navigate(-1);
    }
  }, [user, bookingId, navigate]);
  function speak(name) {
  const utterance = new SpeechSynthesisUtterance(name);
  utterance.lang = 'ko-KR';
  speechSynthesis.speak(utterance);
  }
  useEffect(() => {
    if (isAuthReady && (!user || !user.accessToken)) {
      alert("로그인이 필요합니다. 예약 페이지로 돌아갑니다.");
      navigate("/user/mypage/schedule");
    }
    return () => {
      roomRef.current?.disconnect();
    };
  }, [isAuthReady, user, navigate]);

  useEffect(() => {
    if (remoteVideoTrack && remoteVideoRef.current) {
      remoteVideoTrack.attach(remoteVideoRef.current);
    }
    return () => {
      if (remoteVideoTrack) {
        remoteVideoTrack.detach();
      }
    };
  }, [remoteVideoTrack]);

  useEffect(() => {
    if (remoteAudioTrack && remoteAudioRef.current) {
      remoteAudioTrack.attach(remoteAudioRef.current);
    }
    return () => {
      if (remoteAudioTrack) {
        remoteAudioTrack.detach();
      }
    };
  }, [remoteAudioTrack]);
  const handleAacSelectionForDisplay = (aacItem) => {
    if (aacItem && aacItem.fileUrl) {
      // 2초 뒤에 이미지를 표시합니다.
      setTimeout(() => {
        setCentralImageUrl(aacItem.fileUrl);

        // 이미지가 표시된 후 3초 뒤에 이미지를 숨깁니다.
        setTimeout(() => {
          setCentralImageUrl(null);
        }, 3000);
        speak(aacItem.name)
      }, 1500);

    }
  };

  const toggleMute = async () => {
    if (roomRef.current?.localParticipant) {
      const newMutedState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(
        !newMutedState
      );
      setIsMuted(newMutedState);
    }
  };

  const toggleVideo = async () => {
    if (roomRef.current?.localParticipant) {
      const newVideoOffState = !isVideoOff;
      await roomRef.current.localParticipant.setCameraEnabled(
        !newVideoOffState
      );
      setIsVideoOff(newVideoOffState);
    }
  };

  const endSession = () => {
    if (window.confirm("정말로 세션을 종료하시겠습니까?")) {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      navigate("/user/mypage/schedule");
    }
  };

  const sendChatMessage = async () => {
    if (roomRef.current && chatInput.trim() !== "" && chatRoomId) {
      const messageContent = chatInput;
      setChatInput("");

      // 1. 실시간 전송을 위해 LiveKit으로 데이터 전송
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(
          JSON.stringify({ type: "chat", payload: messageContent })
        );
        await roomRef.current.localParticipant.publishData(data, {
          reliable: true,
        });
        setChatMessages((prev) => [
          ...prev,
          { sender: "나", message: messageContent },
        ]);
      } catch (error) {
        console.error("Failed to send chat message via LiveKit:", error);
        alert("채팅 메시지 실시간 전송에 실패했습니다.");
      }

      // 2. DB 저장을 위해 백엔드 API로 전송
      try {
        await axios.post(
          "/api/v1/chat/session/message",
          {
            sessionId: roomRef.current.name,
            roomId: chatRoomId,
            senderId: user.memberId,
            content: messageContent,
            messageType: "TALK",
          },
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          }
        );
      } catch (error) {
        console.error("Failed to save chat message to backend:", error);
      }
    }
  };

  const renderContent = () => {
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
                onClick={() => navigate("/")}
              >
                <i className="bi bi-arrow-left me-2"></i>돌아가기
              </Button>
            </div>
          </div>
        );
      case "connecting":
        return (
          <div className="join-container">
            <h2 className="mb-4">세션에 연결 중입니다...</h2>
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
            {remoteAudioTrack && <audio ref={remoteAudioRef} autoPlay />}
            <div className="main-video-area">
              <div
                className={`main-video-container ${
                  isRemoteSpeaking ? "speaking" : ""
                }`}
              >
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="remote-video"
                />
                {isRemoteVideoOff && (
                  <div className="video-overlay-text">
                    <i
                      className="bi bi-camera-video-off-fill"
                      style={{ fontSize: "3em" }}
                    ></i>
                    <p>치료사 카메라 꺼짐</p>
                  </div>
                )}
              </div>

              <div className="pip-video-container">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="local-video"
                />
                {isVideoOff && (
                  <div className="text-center video-overlay-text">
                    <i
                      className="bi bi-camera-video-off-fill"
                      style={{ fontSize: "1.5em" }}
                    ></i>
                    <p>내 비디오 꺼짐</p>
                  </div>
                )}
              </div>
            </div>

            {receivedSentence && (
              <div className="received-sentence-display">
                {receivedSentence}
              </div>
            )}

            {/* Add AacDisplay here */}
            <AacDisplay
              roomRef={roomRef}
              receivedAacQuestion={receivedAacQuestion}
              onSelect={handleAacSelectionForDisplay}
            />
            <CentralAacDisplay imageUrl={centralImageUrl} />
            <div className="control-panel">
              <div className="d-flex align-items-center justify-content-center h-100">
                <Button
                  variant={isMuted ? "danger" : "light"}
                  className="control-button me-3"
                  onClick={toggleMute}
                >
                  <i
                    className={`bi bi-mic${isMuted ? "-mute-fill" : "-fill"}`}
                  ></i>
                  <span>음소거</span>
                </Button>
                <Button
                  variant={isVideoOff ? "danger" : "light"}
                  className="control-button me-3"
                  onClick={toggleVideo}
                >
                  <i
                    className={`bi bi-camera-video${
                      isVideoOff ? "-off-fill" : "-fill"
                    }`}
                  ></i>
                  <span>캠 끄기</span>
                </Button>
                <Button
                  variant="light"
                  className="control-button me-3"
                  onClick={() => setShowChatPanel((prev) => !prev)}
                >
                  <i className="bi bi-chat-right-text-fill"></i>
                  <span>채팅</span>
                </Button>
                <Button
                  variant="danger"
                  className="control-button ms-auto"
                  onClick={endSession}
                >
                  <i
                    className="bi bi-x-circle-fill"
                    style={{ fontSize: "1.5em" }}
                  ></i>
                  <span>나가기</span>
                </Button>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container fluid className="session-room-container">
      <Row className="h-100 flex-nowrap">
        <Col
          className={`session-main-content ${
            showChatPanel ? "col-md-9" : "col-md-12"
          } p-0`}
        >
          {renderContent()}
        </Col>
        {showChatPanel && (
          <Col md={3} className="tool-panel p-0">
            <div className="chat-panel d-flex flex-column h-100">
              <div className="chat-messages flex-grow-1 overflow-auto p-2">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${
                      msg.sender === "나" ? "my-message" : "other-message"
                    }`}
                  >
                    <strong>{msg.sender}:</strong> {msg.message}
                  </div>
                ))}
              </div>
              <div className="chat-input-area p-2 border-top">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="메시지를 입력하세요..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
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
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default UserSessionRoom;
