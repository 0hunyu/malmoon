import http from 'k6/http';
import {check} from 'k6';
import exec from 'k6/execution';

// ===== 실행 옵션 =====
export const options = {
    vus: 10,
    duration: '10s',
    thresholds: {
        // 조회 API만 대상으로 임계치 설정 (태그 필터)
        'http_req_duration{endpoint:aacs_list}': ['p(95)<800'],
        'http_req_failed{endpoint:aacs_list}': ['rate<0.01'],
    },
};

// 환경별 베이스 URL (k6 -e BASE_URL=https://api.example.com 처럼 주입 가능)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// ===== 테스트 계정 목록 =====
// 필요한 수만큼 계정을 추가해두면 각 VU에 고르게 분배됨.
// 계정 수 < VU 수 여도 모듈로 분배되므로 동작은 함.
const USERS = [
    {email: 'test@test.com', password: 'qwer1234'},
    // { email: 'user2@test.com', password: 'qwer1234' },
    // { email: 'user3@test.com', password: 'qwer1234' },
];

// ===== 사전 준비: 로그인해서 토큰 풀 생성 =====
export function setup() {
    const tokens = USERS.map((u) => {
        const res = http.post(
            `${BASE_URL}/api/v1/auth/login`,
            JSON.stringify({email: u.email, password: u.password}),
            {headers: {'Content-Type': 'application/json'}},
        );
        check(res, {'login 200': (r) => r.status === 200});
        const body = JSON.parse(res.body);
        return body.accessToken;
    });
    return {tokens};
}

// ===== 본 테스트: 조회 API만 호출 =====
export default function (data) {
    // 각 VU가 자기 index로 토큰 선택 (계정 수가 부족하면 순환)
    const token = data.tokens[(exec.vu.idInTest - 1) % data.tokens.length];

    const situation = encodeURIComponent('학교');
    const action = encodeURIComponent('먹다');
    const query = `?page=0&size=10&situation=${situation}&action=${action}`;

    const res = http.get(`${BASE_URL}/api/v1/aacs${query}`, {
        headers: {Authorization: `Bearer ${token}`},
        tags: {endpoint: 'aacs_list'}, // ← 임계치/대시보드 필터용
    });

    check(res, {'AAC 목록 200 응답': (r) => r.status === 200});
}
