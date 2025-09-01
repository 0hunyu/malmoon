import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

export function useFairyTaleLogic(location, user, childId, selectedSentence, roomRef) {
  const [fairyTaleInfo, setFairyTaleInfo] = useState(null);
  const [fairyTaleContent, setFairyTaleContent] = useState({});
  const [currentFairyTalePage, setCurrentFairyTalePage] = useState(1);
  const [isFetchingSentences, setIsFetchingSentences] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const title = queryParams.get('fairyTaleTitle');
    if (title) {
      setFairyTaleInfo({
        title,
        classification: queryParams.get('fairyTaleClassification'),
        startPage: parseInt(queryParams.get('startPage'), 10),
        endPage: parseInt(queryParams.get('endPage'), 10),
      });
      setCurrentFairyTalePage(parseInt(queryParams.get('startPage'), 10));
    }
  }, [location.search]);

  useEffect(() => {
    if (!fairyTaleInfo || !fairyTaleInfo.title) return;

    const fetchSentences = async (page) => {
      if (fairyTaleContent[page]) return;
      setIsFetchingSentences(true);
      try {
        const response = await api.get('/storybooks/sentences', {
          params: { ...fairyTaleInfo, page },
        });
        setFairyTaleContent(prev => ({ ...prev, [page]: Array.from(new Map(response.data.sentences.map(item => [item.sentenceId, item])).values()) }));
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
      } finally {
        setIsFetchingSentences(false);
      }
    };

    fetchSentences(currentFairyTalePage);
  }, [fairyTaleInfo, currentFairyTalePage]);

  const uploadAudio = useCallback(async (audioBlob) => {
    if (!childId || !selectedSentence) {
      alert('아동 정보 또는 선택된 문장이 없습니다.');
      return;
    }

    const formData = new FormData();
    formData.append('childId', childId);
    formData.append('sentenceId', selectedSentence.sentenceId);
    formData.append('srcTextId', selectedSentence.srcTextId);
    formData.append('page', currentFairyTalePage);
    formData.append('audioFile', audioBlob, 'recording.webm');

    try {
      const response = await api.post('/speech', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.accessToken}`
        }
      });
      console.log('오디오 업로드 성공:', response.data);
      alert('녹음 파일이 성공적으로 업로드되었습니다.');
    } catch (error) {
      console.error('오디오 업로드 실패:', error);
      alert('녹음 파일 업로드에 실패했습니다.');
    }
  }, [childId, selectedSentence, currentFairyTalePage, user]);

  const startRecording = useCallback(async (remoteAudioTrack) => {
    if (!remoteAudioTrack) {
      alert('녹음할 오디오 트랙이 없습니다.');
      return;
    }

    try {
      const stream = new MediaStream([remoteAudioTrack.mediaStreamTrack]);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      console.log('녹음 시작');
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      alert('녹음 시작에 실패했습니다.');
    }
  }, [uploadAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('녹음 중지');
    }
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (fairyTaleInfo && newPage >= fairyTaleInfo.startPage && newPage <= fairyTaleInfo.endPage) {
      setCurrentFairyTalePage(newPage);
    }
  }, [fairyTaleInfo]);

  const sendSentence = useCallback(async () => {
    if (roomRef.current && selectedSentence) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify({ type: 'sentence', payload: selectedSentence.sentence }));
        await roomRef.current.localParticipant.publishData(data, { reliable: true });
        alert('문장을 전송했습니다.');
      } catch (error) {
        console.error('Failed to send sentence:', error);
        alert('문장 전송에 실패했습니다.');
      }
    }
  }, [roomRef, selectedSentence]);

  const clearSentence = useCallback(async () => {
    if (roomRef.current) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({ type: 'clearSentence' }));
            await roomRef.current.localParticipant.publishData(data, { reliable: true });
            console.log('문장 지우기 명령을 전송했습니다.');
        } catch (error) {
            console.error('Failed to send clear command:', error);
            alert('문장 지우기 명령 전송에 실패했습니다.');
        }
    }
  }, [roomRef]);

  return {
    fairyTaleInfo,
    setFairyTaleInfo,
    fairyTaleContent,
    setFairyTaleContent,
    currentFairyTalePage,
    setCurrentFairyTalePage,
    isFetchingSentences,
    isRecording,
    setIsRecording,
    handlePageChange,
    sendSentence,
    startRecording,
    stopRecording,
    clearSentence, // clearSentence 함수를 반환 객체에 추가
  };
}