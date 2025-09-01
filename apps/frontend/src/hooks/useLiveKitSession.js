import { useCallback, useEffect, useRef, useState } from "react";
import { createLocalTracks, Room, RoomEvent, Track } from "livekit-client";
import api from "../api/axios"; // axios 인스턴스, 기본 baseURL 세팅

//const LIVEKIT_URL = 'wss://www.malmoon.store';

const LIVEKIT_URL = "wss://i13c107.p.ssafy.io:8443";

export function useLiveKitSession(
  user,
  navigate,
  clientId,
  onChatMessageReceived,
  onSentenceReceived,
  onAacSelectionReceived
) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true);
  const [rtcStatus, setRtcStatus] = useState("disconnected");
  const [isLiveKitReady, setIsLiveKitReady] = useState(false);

  const [remoteVideoTrack, setRemoteVideoTrack] = useState(null);
  const [remoteAudioTrack, setRemoteAudioTrack] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const roomRef = useRef(null);

  const [chatRoomId, setChatRoomId] = useState(null);
  const [childId, setChildId] = useState(null);

  const handleRemoteTrackMuted = useCallback((trackPublication) => {
    if (trackPublication.kind === Track.Kind.Video) {
      setIsRemoteVideoOff(true);
    }
  }, []);

  const handleRemoteTrackUnmuted = useCallback((trackPublication) => {
    if (trackPublication.kind === Track.Kind.Video) {
      setIsRemoteVideoOff(false);
    }
  }, []);

  const connectToLiveKit = useCallback(async () => {
    if (!user) return;

    setRtcStatus("connecting");

    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room.on(RoomEvent.Connected, () => {
      // 연결 성공 시 필요시 상태 변경 가능
    });
    room.on(RoomEvent.Disconnected, (reason) => {
      console.log("LiveKit Room Disconnected:", reason);
      setRtcStatus("disconnected");
      setIsLiveKitReady(false);
    });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === "video") {
        setRemoteVideoTrack(track);
        setIsRemoteVideoOff(false);
        participant.on(RoomEvent.TrackMuted, handleRemoteTrackMuted);
        participant.on(RoomEvent.TrackUnmuted, handleRemoteTrackUnmuted);
      } else if (track.kind === "audio") {
        setRemoteAudioTrack(track);
      }
    });

    room.on(RoomEvent.DataReceived, (payload, participant) => {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(payload));
      if (data.type === "chat") {
        onChatMessageReceived?.(participant.identity, data.payload);
      } else if (data.type === "sentence") {
        onSentenceReceived?.({ sentence: data.payload, sentenceId: null });
      } else if (data.type === "aac-selection") {
        onAacSelectionReceived?.({ aacId: data.selectedId });
      }
    });

    try {
      console.log("LiveKit 연결 요청 직전 user 객체:", user);
      console.log("LiveKit 연결 요청 직전 accessToken:", user?.accessToken);

      // 토큰이 상태에 있으니 헤더에 넣어 요청
      const response = await api.post(
        "/sessions/room",
        { clientId: clientId },
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      const { token, chatRoomId: newChatRoomId } = response.data;

      setChatRoomId(newChatRoomId);
      setChildId(clientId); // 전달받은 clientId 사용

      await room.connect(LIVEKIT_URL, token);
      setRtcStatus("connected");

      const localTracks = await createLocalTracks({ audio: true, video: true });
      for (const track of localTracks) {
        if (track.kind === "video" && localVideoRef.current) {
          localVideoRef.current.srcObject = track.mediaStream; // 명시적 srcObject 설정
          track.attach(localVideoRef.current);
          localVideoRef.current.onloadedmetadata = () => {
            setIsLiveKitReady(true);
          };
          await room.localParticipant.publishTrack(track);
        } else if (track.kind === "audio") {
          await room.localParticipant.publishTrack(track);
        }
      }
    } catch (error) {
      console.error("LiveKit 연결 실패:", error);
      setRtcStatus("error");
      alert("LiveKit 연결에 실패했습니다. 콘솔을 확인해주세요.");
    }
  }, [
    user,
    clientId,
    handleRemoteTrackMuted,
    handleRemoteTrackUnmuted,
    onChatMessageReceived,
    onSentenceReceived,
  ]);

  useEffect(() => {
    return () => roomRef.current?.disconnect();
  }, []);

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
  const toggleMute = useCallback(async () => {
    // UI 상태를 먼저 optimistic하게 변경
    setIsMuted((prevIsMuted) => !prevIsMuted);
    const room = roomRef.current;
    if (!room) return;

    try {
      // 실제 LiveKit API 호출
      await room.localParticipant.setMicrophoneEnabled(isMuted, {
        stopMicTrack: false,
      });
    } catch (error) {
      console.error("음소거/음소거 해제 실패:", error); // 실패 시 UI 상태를 원래대로 되돌림 (Rollback)
      setIsMuted(isMuted);
    }
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    setIsVideoOff((prev) => !prev);
  }, []);

  const endSession = useCallback(
    async (storybookTitle, lastPage) => {
      if (window.confirm("정말로 수업을 종료하시겠습니까?")) {
        try {
          // 세션 종료 요청에도 토큰 헤더 포함
          await api.delete("/sessions/room", {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
          });

          // 피드백 API 호출
          console.log(
            "피드백 전송 시도 - storybookTitle:",
            storybookTitle,
            "lastPage:",
            lastPage
          );
          if (storybookTitle && lastPage) {
            try {
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, "0");
              const day = String(today.getDate()).padStart(2, "0");
              const formattedDate = `${year}-${month}-${day}`;

              await api.post(
                "/session-feedback/end",
                {
                  childId: clientId,
                  storybookTitle: storybookTitle,
                  date: formattedDate,
                  lastPage: lastPage,
                },
                {
                  headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                  },
                }
              );
              console.log("피드백이 성공적으로 전송되었습니다.");
              alert("수업 피드백이 성공적으로 전송되었습니다.");
            } catch (feedbackError) {
              console.error("피드백 전송 실패:", feedbackError);
              alert("피드백 전송에 실패했습니다.");
            }
          }

          // 피드백 전송 완료 후 LiveKit 연결 해제 및 페이지 이동
          roomRef.current?.disconnect();
          navigate("/therapist/mypage/schedule");
        } catch (error) {
          console.error("Failed to end session:", error);
          alert("세션 종료에 실패했습니다. 콘솔을 확인해주세요.");
          roomRef.current?.disconnect();
          navigate("/therapist/mypage/schedule");
        }
      }
    },
    [user, navigate, clientId]
  );

  return {
    isMuted,
    setIsMuted,
    isVideoOff,
    setIsVideoOff,
    isRemoteVideoOff,
    setIsRemoteVideoOff,
    rtcStatus,
    setRtcStatus,
    remoteVideoTrack,
    remoteAudioTrack,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    roomRef,
    chatRoomId,
    childId,
    isLiveKitReady,
    connectToLiveKit,
    toggleMute,
    toggleVideo,
    endSession,
  };
}
