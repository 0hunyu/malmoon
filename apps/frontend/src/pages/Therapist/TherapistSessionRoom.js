import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container } from 'react-bootstrap';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './TherapistSessionRoom.css';
import { useAuth } from '../../contexts/AuthContext';
import { bootstrapCameraKit } from "@snap/camera-kit";
import { LocalVideoTrack, createLocalVideoTrack, RoomEvent } from 'livekit-client';
import api from '../../api/axios';

import SessionRoomContent from '../../components/TherapistSession/SessionRoomContent';
import CentralAacDisplay from '../../components/common/CentralAacDisplay'
import { useLiveKitSession } from '../../hooks/useLiveKitSession';
import { useFairyTaleLogic } from '../../hooks/useFairyTaleLogic';
import { useChatLogic } from '../../hooks/useChatLogic';

function TherapistSessionRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // URL 쿼리 파라미터에서 clientId 추출 및 숫자로 변환
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const clientId = parseInt(queryParams.get('clientId'), 10);

  const [showToolPanel, setShowToolPanel] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState(null);
  const [sessionTools, setSessionTools] = useState([]);
  const [resolvedAacIds, setResolvedAacIds] = useState([]); // Resolved individual AAC IDs
  const [resolvedFilterIds, setResolvedFilterIds] = useState([]); // Resolved individual Filter IDs
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [sentAacs, setSentAacs] = useState([]); // 방금 유저에게 보낸 AAC 목록을 저장할 상태

  // 필터 관련 상태 및 Ref
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [useCameraKit, setUseCameraKit] = useState(false);
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [selectedBackgroundImage, setSelectedBackgroundImage] = useState(null);

  const selfieSegmentationRef = useRef(null);
  const animationFrameRef = useRef(null);
  const cameraKitRef = useRef(null);
  const cameraKitSessionRef = useRef(null);
  const containerRef = useRef(null);

  const isFilterActiveRef = useRef(isFilterActive);
  const selectedBackgroundImageRef = useRef(selectedBackgroundImage);

  useEffect(() => {
    isFilterActiveRef.current = isFilterActive;
    selectedBackgroundImageRef.current = selectedBackgroundImage;
  }, [isFilterActive, selectedBackgroundImage]);

  const [allToolBundles, setAllToolBundles] = useState([]); // 모든 도구 묶음 저장
  const [allAacs, setAllAacs] = useState([]); // 모든 개별 AAC 저장
  const [allFilters, setAllFilters] = useState([]); // 모든 개별 필터 저장
  const [centralImageUrl, setCentralImageUrl] = useState(null);
  useEffect(() => {
    const fetchAndResolveTools = async () => {
      if (!user || !user.accessToken) return;

      const tools = queryParams.get('tools');
      if (!tools) return;

      try {
        // Fetch tool bundle
        const toolBundlesResponse = await api.get(`/tool-bundles/${tools}`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        const toolBundle = toolBundlesResponse.data;
        setAllToolBundles(toolBundle ? [toolBundle] : []);

        console.log(toolBundle);
        let aacs = [];
        if (toolBundle && toolBundle.aacSetId) {
            const aacSetContentResponse = await api.get(`/aacs/sets/my/${toolBundle.aacSetId}`, {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            });
            const aacSet = aacSetContentResponse.data || [];
            const aacIds = aacSet.map(item => item.id);

            const aacPromises = aacIds.map(id =>
              api.get(`/aacs/${id}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` },
              })
            );
            const aacResponses = await Promise.all(aacPromises);
            aacs = aacResponses.map(response => response.data);
        }
        


        setAllAacs(aacs.map(item => ({ ...item, imageUrl: item.fileUrl })));

        let filters = [];
        if (toolBundle && toolBundle.filterSetId) {
          const filterSetContentResponse = await api.get(`/filters/sets/my/${toolBundle.filterSetId}`, {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            });
            const filterSet = filterSetContentResponse.data || [];
            const filterIds = filterSet.map(item => item.filterId);

            console.log(filterSet);
            console.log(filterIds);

            const params = new URLSearchParams();
            filterIds.forEach(id => params.append('ids', id));

            console.log(params.toString());

            const filterResponse = await api.get(`/filters/by-ids?${params.toString()}`, {
              headers: { Authorization: `Bearer ${user.accessToken}` },
            });

            const allFilters = filterResponse.data.filters.map(item => ({ ...item, imageUrl: item.fileUrl })) || [];

            filters = allFilters;
        }

        setAllFilters(filters);

        // Parse and resolve selected tools
        const toolsParam = queryParams.get('tools');
        const selectedToolIds = toolsParam ? toolsParam.split(',').map(id => id.trim()) : [];

        let initialAacIds = [];
        let initialFilterIds = [];

        for (const toolId of selectedToolIds) {
          const bundle = (toolBundle && String(toolBundle.toolBundleId) === toolId) ? toolBundle : null;
          if (bundle) {
            if (bundle.aacSetId) {
              const aacSetContentResponse = await api.get(`/aacs/sets/my/${bundle.aacSetId}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` },
              });
              const aacsInSet = aacSetContentResponse.data;
              initialAacIds = [...new Set([...initialAacIds, ...aacsInSet.map(item => String(item.id))])];
            }

            if (bundle.filterSetId) {
              const filterSetContentResponse = await api.get(`/filters/sets/my/${bundle.filterSetId}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` },
              });
              const filtersInSet = filterSetContentResponse.data;
              initialFilterIds = [...new Set([...initialFilterIds, ...filtersInSet.map(item => String(item.filterId))])];
            }
          } else {
            // This part is for individual tools, not bundles
            if (aacs.some(aac => String(aac.id) === toolId)) {
              initialAacIds.push(toolId);
            }
            else if (allFilters.some(filter => String(filter.filterId) === toolId)) {
              initialFilterIds.push(toolId);
            }
          }
        }
        setResolvedAacIds(initialAacIds);
        setResolvedFilterIds(initialFilterIds);

      } catch (error) {
        console.error('Error fetching and resolving tool data:', error);
        setResolvedAacIds([]);
        setResolvedFilterIds([]);
      }
    };

    fetchAndResolveTools();
  }, [user, location.search, queryParams]);

  const {
    isMuted, setIsMuted, isVideoOff, setIsVideoOff, isRemoteVideoOff, setIsRemoteVideoOff,
    rtcStatus, setRtcStatus, remoteVideoTrack, remoteAudioTrack,
    localVideoRef, remoteVideoRef, remoteAudioRef, roomRef,
    chatRoomId,
    isLiveKitReady,
    connectToLiveKit, toggleMute, endSession,
    toggleVideo: liveKitToggleVideo,
    finalChosenAacByClient
  } = useLiveKitSession(user, navigate, clientId,
    (sender, message) => setChatMessages(prevMessages => [...prevMessages, { sender, message }]),
    (sentence) => setSelectedSentence(sentence),
    (aacId) => handleAacSelection(aacId)
  );
  

  // 사용자가 선택한 AAC를 수신하여 화면 중앙에 표시하는 로직
  const handleAacSelection = (aacId) => {
    // 전체 AAC 목록에서 사용자가 선택한 ID를 기반으로 AAC 정보를 찾음
    const chosenAac = allAacs.find(aac => aac.id === aacId.aacId);
    console.log(chosenAac);
    if (chosenAac && chosenAac.imageUrl) {
        // 중앙에 이미지 표시
        setTimeout(() => {
        setCentralImageUrl(chosenAac.imageUrl);
        // 3초 후에 이미지 숨김
        setTimeout(() => {
          setCentralImageUrl(null);
        }, 3000);
      speak(chosenAac.name)
      },
       1500);
    }
  };
  const handleSendAacToLiveKit = useCallback(async (aacs) => {
    if (!roomRef.current || !roomRef.current.localParticipant) {
      console.warn("LiveKit room not ready to send AAC data.");
      return;
    }
    try {
      const payload = JSON.stringify({
        type: 'AAC_OPTIONS',
        data: aacs.map(aac => ({ id: aac.id, name: aac.name, imageUrl: aac.imageUrl }))
      });
      await roomRef.current.localParticipant.publishData(new TextEncoder().encode(payload), {
        reliable: true,
        topic: 'aac-options'
      });
      console.log("AAC options sent via LiveKit data channel:", aacs);
    } catch (error) {
      console.error("Failed to send AAC options via LiveKit:", error);
    }
  }, [roomRef]);

  const outputCanvasRef = useRef(null);
  const outputCKCanvasRef = useRef(null);

  const stopCameraKit = useCallback(async () => {
    if (cameraKitSessionRef.current) {
      await cameraKitSessionRef.current.destroy();
      cameraKitSessionRef.current = null;
    }
    if (selfieSegmentationRef.current) {
      selfieSegmentationRef.current.close();
      selfieSegmentationRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const initializeCameraKit = useCallback(async () => {
    await stopCameraKit();
    if (!cameraKitRef.current) {
        cameraKitRef.current = await bootstrapCameraKit({ apiToken: CAMERA_KIT_API_TOKEN });
    }

    if (outputCKCanvasRef.current) {
      if (containerRef.current && outputCKCanvasRef.current && containerRef.current.contains(outputCKCanvasRef.current)) {
        containerRef.current.removeChild(outputCKCanvasRef.current);
      }
    }

    const newCanvas = document.createElement('canvas');
    outputCKCanvasRef.current = newCanvas;
    if (containerRef.current) {
      containerRef.current.appendChild(newCanvas);
    }

    const session = await cameraKitRef.current.createSession({ liveRenderTarget: newCanvas });
    cameraKitSessionRef.current = session;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    await session.setSource(stream);
    await session.play();

    const canvasStream = newCanvas.captureStream(25);
    const videoTrack = new LocalVideoTrack(canvasStream.getVideoTracks()[0], { name: 'camera-kit' });
    await roomRef.current.localParticipant.publishTrack(videoTrack);

    if (localVideoRef.current) localVideoRef.current.style.visibility = 'hidden';
    if (outputCanvasRef.current) outputCanvasRef.current.style.visibility = 'hidden';
    if (outputCKCanvasRef.current) outputCKCanvasRef.current.style.visibility = 'visible';

  }, [stopCameraKit, roomRef]);

  const removeBackgroundFilter = useCallback(() => {
    if (cameraKitSessionRef.current) {
        cameraKitSessionRef.current.pause();
    }
    setUseCameraKit(false);
    setIsFilterActive(false);
    setSelectedBackgroundImage(null);
  }, []);

  const applyLensById = useCallback(async (lensId) => {
    setUseCameraKit(true);
    setIsFilterActive(false);
    await initializeCameraKit();
    const lens = await cameraKitRef.current.lensRepository.loadLens(lensId, '1d348e19-0526-44d6-b5fb-cdc9f664b6bc');
    await cameraKitSessionRef.current.applyLens(lens);
  }, [initializeCameraKit]);

  const applyBackgroundFilter = useCallback((imageUrl) => {
    if (cameraKitSessionRef.current) {
        cameraKitSessionRef.current.pause();
    }
    if (!imageUrl) {
      removeBackgroundFilter();
      return;
    }
    setUseCameraKit(false);
    setIsFilterActive(true);
    setSelectedBackgroundImage(imageUrl);
  }, [removeBackgroundFilter]);

  const toggleVideo = useCallback(() => {
    const newVideoOffState = !isVideoOff;
    if (newVideoOffState) {
      stopCameraKit();
    }
    liveKitToggleVideo();
  }, [isVideoOff, stopCameraKit, liveKitToggleVideo]);

  const {
    fairyTaleInfo, fairyTaleContent, currentFairyTalePage,
    isRecording, setIsRecording,
    handlePageChange, sendSentence, startRecording, stopRecording
  } = useFairyTaleLogic(location, user, clientId, selectedSentence, roomRef);

  const {
    chatInput, setChatInput, sendChatMessage
  } = useChatLogic(roomRef, user, chatRoomId, setChatMessages);
  function speak(name) {
  const utterance = new SpeechSynthesisUtterance(name);
  utterance.lang = 'ko-KR';
  speechSynthesis.speak(utterance);
}

  // --- START: 최종 수정된 필터 로직 ---
  useEffect(() => {
    let isCleaningUp = false;
    // createObjectURL로 생성된 임시 URL을 관리하기 위한 변수
    let objectUrl = null;

    const unpublishAndHide = async (trackNamesToUnpublish, visibleVideo, hiddenCanvas1, hiddenCanvas2) => {
      if (!roomRef.current || !roomRef.current.localParticipant) return;
      const unpublishPromises = [];
      roomRef.current.localParticipant.videoTrackPublications.forEach((publication) => {
        if (publication.track && trackNamesToUnpublish.includes(publication.track.name)) {
          unpublishPromises.push(roomRef.current.localParticipant.unpublishTrack(publication.track, true));
        }
      });
      await Promise.all(unpublishPromises);

      if (visibleVideo) visibleVideo.style.visibility = 'visible';
      if (hiddenCanvas1) hiddenCanvas1.style.visibility = 'hidden';
      if (hiddenCanvas2) hiddenCanvas2.style.visibility = 'hidden';
    };

    const manageTracks = async () => {
      if (isCleaningUp || !isLiveKitReady || !roomRef.current || !roomRef.current.localParticipant) {
        await stopCameraKit();
        return;
      }

      if (useCameraKit) {
        await unpublishAndHide(['canvas'], null, localVideoRef.current, outputCanvasRef.current);
        if (outputCKCanvasRef.current) outputCKCanvasRef.current.style.visibility = 'visible';
        return;
      }

      if (isFilterActive && selectedBackgroundImage) {
        await unpublishAndHide(['camera-kit'], null, localVideoRef.current, null);
        const videoElement = localVideoRef.current;
        const canvasElement = outputCanvasRef.current;
        if (!videoElement || !canvasElement) return;

        const canvasCtx = canvasElement.getContext('2d');
        
        // fetch를 사용하여 URL 변경 없이 캐시를 무시하고 이미지를 로드하는 함수
        const loadImageWithFetch = (url) => {
          return new Promise(async (resolve, reject) => {
            try {
              // cache: 'reload' 옵션으로 브라우저 캐시를 무시하고 새로 요청
              const response = await fetch(url, { cache: 'reload' });
              if (!response.ok) {
                // response.status와 함께 에러를 던져서 원인을 명확히 함
                throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
              }
              const blob = await response.blob();
              
              // 메모리 누수 방지를 위해 이전 objectUrl 해제
              if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
              }
              // blob으로부터 새로운 임시 URL 생성
              objectUrl = URL.createObjectURL(blob);

              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = (err) => reject(err);
              img.src = objectUrl;

            } catch (error) {
              reject(error);
            }
          });
        };

        try {
          const backgroundImage = await loadImageWithFetch(selectedBackgroundImageRef.current);

          if (!selfieSegmentationRef.current) {
            const selfieSegmentation = new window.SelfieSegmentation({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}` });
            selfieSegmentation.setOptions({ modelSelection: 1, selfieMode: false });
            selfieSegmentationRef.current = selfieSegmentation;

            selfieSegmentation.onResults((results) => {
              if (isCleaningUp || !isFilterActiveRef.current) return;
              canvasElement.width = videoElement.videoWidth;
              canvasElement.height = videoElement.videoHeight;
              canvasCtx.save();
              canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
              canvasCtx.drawImage(results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);
              canvasCtx.globalCompositeOperation = 'source-out';
              canvasCtx.drawImage(backgroundImage, 0, 0, canvasElement.width, canvasElement.height);
              canvasCtx.globalCompositeOperation = 'destination-atop';
              canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
              canvasCtx.restore();
            });
          }

          const animate = async () => {
            if (isCleaningUp || !isFilterActiveRef.current) {
              if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
              return;
            }
            if (videoElement.readyState >= 4) {
              await selfieSegmentationRef.current.send({ image: videoElement });
            }
            animationFrameRef.current = requestAnimationFrame(animate);
          };
          animate();

          const canvasStream = canvasElement.captureStream(25);
          const canvasVideoTrack = new LocalVideoTrack(canvasStream.getVideoTracks()[0], { name: 'canvas' });
          await roomRef.current.localParticipant.publishTrack(canvasVideoTrack);

          if (outputCanvasRef.current) outputCanvasRef.current.style.visibility = 'visible';
          if (outputCKCanvasRef.current) outputCKCanvasRef.current.style.visibility = 'hidden';

        } catch (error) {
          console.error("배경 이미지 로드에 실패하여 필터를 중단합니다.", error);
          setIsFilterActive(false);
          setSelectedBackgroundImage(null);
          await unpublishAndHide(['canvas', 'camera-kit'], localVideoRef.current, outputCanvasRef.current, outputCKCanvasRef.current);
        }
      } else {
        // 필터 제거 로직: 모든 비디오 트랙을 정리하고 원본 카메라 트랙을 새로 게시합니다.
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        if (selfieSegmentationRef.current) {
            selfieSegmentationRef.current.close();
            selfieSegmentationRef.current = null;
        }

        if (roomRef.current && roomRef.current.localParticipant) {
          // 모든 기존 비디오 트랙(필터 및 원본) 발행 중단
          const publications = Array.from(roomRef.current.localParticipant.videoTrackPublications.values());
          const unpublishPromises = publications.map(pub => roomRef.current.localParticipant.unpublishTrack(pub.track, true).catch(e => console.error("Failed to unpublish track", e)));
          await Promise.all(unpublishPromises);

          // 비디오가 꺼져있지 않은 경우에만 새 트랙 생성 및 게시
          if (!isVideoOff) {
            try {
              // 원본 비디오 트랙을 새로 생성
              const newVideoTrack = await createLocalVideoTrack();
              
              // 로컬 비디오 요소에 연결
              if (localVideoRef.current) {
                // 이전 트랙이 있다면 분리
                const oldTracks = localVideoRef.current.srcObject?.getVideoTracks();
                if (oldTracks) {
                  oldTracks.forEach(t => t.stop());
                }
                newVideoTrack.attach(localVideoRef.current);
              }
              
              // 새 트랙을 게시
              await roomRef.current.localParticipant.publishTrack(newVideoTrack);

            } catch (error) {
              console.error("필터 제거 후 새 비디오 트랙 생성에 실패했습니다:", error);
              // 실패 시 비디오를 끈 것으로 상태 업데이트
              setIsVideoOff(true);
            }
          }
        }
        // 캔버스 숨기고 비디오 보이기
        if (localVideoRef.current) localVideoRef.current.style.visibility = 'visible';
        if (outputCanvasRef.current) outputCanvasRef.current.style.visibility = 'hidden';
        if (outputCKCanvasRef.current) outputCKCanvasRef.current.style.visibility = 'hidden';
      }
    };

    manageTracks();

    return () => {
      isCleaningUp = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      // stopCameraKit() 호출을 useEffect 메인 로직으로 이동하여 레이스 컨디션 방지
      if (selfieSegmentationRef.current) {
          selfieSegmentationRef.current.close();
          selfieSegmentationRef.current = null;
      }
      // 컴포넌트가 사라질 때 메모리 누수 방지
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [rtcStatus, useCameraKit, isVideoOff, stopCameraKit, isFilterActive, selectedBackgroundImage, isLiveKitReady]);
  // --- END: 최종 수정된 필터 로직 ---


  useEffect(() => {
    const fetchBackgroundImages = async () => {
      setBackgroundImages(allFilters.map(filter => ({
        id: filter.filterId,
        name: filter.name,
        url: filter.imageUrl && !filter.imageUrl.startsWith('http') ? `${filter.imageUrl}` : filter.imageUrl,
      })));
    };
    if (rtcStatus === 'connected' && allFilters.length > 0) fetchBackgroundImages();
  }, [rtcStatus, allFilters]);

  const toggleToolPanel = (toolType) => {
    setShowToolPanel(prev => prev && activeToolTab === toolType ? false : true);
    setActiveToolTab(toolType);
  };

  const filteredAacs = useMemo(() => {
    return allAacs.filter(aac => resolvedAacIds.includes(String(aac.id)));
  }, [allAacs, resolvedAacIds]);

  const filteredFilters = useMemo(() => {
    return allFilters.filter(filter => resolvedFilterIds.includes(String(filter.filterId)));
  }, [allFilters, resolvedFilterIds]);

  return (
    <Container fluid className="session-room-container">
      <SessionRoomContent
        rtcStatus={rtcStatus}
        connectToLiveKit={connectToLiveKit}
        setRtcStatus={setRtcStatus}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        remoteAudioRef={remoteAudioRef}
        isRemoteVideoOff={isRemoteVideoOff}
        isVideoOff={isVideoOff}
        remoteAudioTrack={remoteAudioTrack}
        selectedSentence={selectedSentence}
        isMuted={isMuted}
        toggleMute={toggleMute}
        toggleVideo={toggleVideo}
        activeToolTab={activeToolTab}
        toggleToolPanel={toggleToolPanel}
        fairyTaleInfo={fairyTaleInfo}
        endSession={() => endSession(fairyTaleInfo?.title, currentFairyTalePage)}
        showToolPanel={showToolPanel}
        setShowToolPanel={setShowToolPanel}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        sendChatMessage={sendChatMessage}
        fairyTaleContent={fairyTaleContent}
        currentFairyTalePage={currentFairyTalePage}
        setSelectedSentence={setSelectedSentence}
        handlePageChange={handlePageChange}
        sendSentence={sendSentence}
        isRecording={isRecording}
        startRecording={() => startRecording(remoteAudioTrack)}
        stopRecording={stopRecording}
        backgroundImages={backgroundImages}
        selectedBackgroundImage={selectedBackgroundImage}
        isFilterActive={isFilterActive}
        applyBackgroundFilter={applyBackgroundFilter}
        removeBackgroundFilter={removeBackgroundFilter}
        applyLensById={applyLensById}
        outputCanvasRef={outputCanvasRef}
        outputCKCanvasRef={outputCKCanvasRef}
        containerRef={containerRef}
        // --- FIX START ---
        // '조회'된 AAC 목록은 allAacs prop으로 전달하고,
        // '초기 선택'은 빈 배열로 설정하여 아무것도 선택되지 않은 상태로 시작합니다.
        initialSelectedAacIds={[]}
        // --- FIX END ---
        initialSelectedFilterIds={resolvedFilterIds}
        allAacs={filteredAacs}
        allFilters={filteredFilters}
        availableAacs={allAacs} // 전체 AAC 목록을 전달
        onSendAac={handleSendAacToLiveKit}
        finalChosenAacByClient={finalChosenAacByClient}
        roomRef={roomRef}
      />
      <CentralAacDisplay imageUrl={centralImageUrl} />
    </Container>
  );
}

export default TherapistSessionRoom;