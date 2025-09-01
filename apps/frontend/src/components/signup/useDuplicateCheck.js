// useDuplicateCheck.js
import { useState } from 'react';
import api from '../../api/axios';

export function useDuplicateCheck() {
  const [checking, setChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(null);
  const [message, setMessage] = useState('');

  const checkEmail = async (email) => {
    setChecking(true);
    try {
            const res = await api.get('/members/email', {
        params: { email }, 
      });
      const result =
        typeof res.data === 'boolean'
          ? res.data
          : res.data.duplicate ?? res.data.exists;

      setIsDuplicate(result);
      setMessage(result ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.');
    } catch (err) {
      console.error('중복 확인 에러:', err);
      setIsDuplicate(null);
      setMessage('서버 오류로 중복 확인에 실패했습니다.');
    } finally {
      setChecking(false);
    }
  };


  return {
    checkEmail,
    checking,
    isDuplicate,
    setIsDuplicate,
    message,
    setMessage,
  };
}
