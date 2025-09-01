// aac-api-ramping.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

/* ===================== 환경 변수 ===================== */
const BASE_URL   = __ENV.BASE_URL || 'http://localhost:8080';
const RUN_ID     = __ENV.RUN_ID || `local-${Date.now()}`;
const TOKEN_MODE = (__ENV.TOKEN_MODE || 'reuse').toLowerCase(); // 'reuse' | 'distinct'
const SMALL      = Number(__ENV.USER_POOL_SMALL || 5);    // reuse 모드에서 로그인할 실제 계정 수
const LARGE      = Number(__ENV.USER_POOL_LARGE || 50);   // 필요 시 사용

// 램핑 단계(STAGES): "users:duration,users:duration,..."
const STAGES_RAW = (__ENV.STAGES || '5:1m,50:1m,200:3m,350:3m,500:4m')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const STAGES = STAGES_RAW.map(pair => {
  const [u, d] = pair.split(':');
  const users = Number(u);
  const duration = d;
  if (!Number.isFinite(users) || !duration) {
    throw new Error(`STAGES 형식 오류: "${pair}" (예: "200:3m")`);
  }
  return { users, duration };
});

/* ===================== 테스트 데이터 ===================== */
const situations = ['첫 만남', '목마를 때', '수업 시작 전', '피곤할 때', '수업 후', '조용한 시간'];
const actions    = ['인사하기', '물 달라', '앉기', '쉬기', '게임 하자', '책 읽기'];
const emotions   = ['기쁨', '간절함', '차분함', '피곤함', '흥분', '평온'];

/* ===================== 유틸 ===================== */
function users(n) {
  return Array.from({ length: n }, (_, i) => ({
    email: `therapist${i + 1}@example.com`,
    password: 'qwer1234',
  }));
}
function jsonParseSafe(str, fallback = null) { try { return JSON.parse(str); } catch { return fallback; } }
function logIfFail(label, res, ok = [200, 204]) { if (!ok.includes(res.status)) console.error(`❌ ${label} 실패: status=${res.status} body=${res.body}`); }
function randOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rangeInclusive(a,b){const lo=Math.min(a,b),hi=Math.max(a,b);return Array.from({length:hi-lo+1},(_,i)=>lo+i);}
function extractContentArray(body){
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body?.data?.content)) return body.data.content;
  if (Array.isArray(body?.page?.content)) return body.page.content;
  const keys = body && typeof body === 'object' ? Object.keys(body) : [];
  console.warn(`⚠️ 목록 응답에서 content 배열을 찾지 못함. top-level keys=${keys.join(',')}`);
  return [];
}
function extractId(item){ return item?.aacId ?? item?.id ?? item?.aac_id ?? null; }

/* ===================== 토큰 파서 & 로그인 ===================== */
function pickTokenFrom(body) {
  const b = jsonParseSafe(body, {});
  return b?.accessToken
    ?? b?.token
    ?? b?.data?.accessToken
    ?? b?.data?.token
    ?? b?.result?.accessToken
    ?? b?.result?.token
    ?? null;
}

function loginAll(list) {
  return list.map(u => {
    const r = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(u), {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      responseType: 'text'
    });

    if (r.status < 200 || r.status >= 300) {
      console.error(`❌ 로그인 HTTP 실패: ${u.email} status=${r.status} body=${r.body}`);
      throw new Error('로그인 실패(HTTP)');
    }
    const token = pickTokenFrom(r.body);
    if (!token) {
      console.error(`❌ 로그인 토큰 추출 실패: ${u.email} status=${r.status} body=${r.body}`);
      throw new Error('accessToken 없음');
    }
    return token;
  });
}

/* ===================== 부트스트랩: 목록으로 샘플 ID 확보 ===================== */
function fetchSomeAacIds(token, want = 200) {
  const out = [];
  for (let page = 0; page < 10 && out.length < want; page++) {
    const r = http.get(`${BASE_URL}/api/v1/aacs?page=${page}&size=20`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { endpoint: 'aacs_list_bootstrap' },
    });
    if (r.status !== 200) { console.warn(`⚠️ 부트스트랩 목록 status=${r.status} page=${page}`); break; }
    const content = extractContentArray(jsonParseSafe(r.body, {}));
    if (!content.length) break;
    for (const it of content) {
      const id = extractId(it);
      if (id != null) out.push(id);
    }
  }
  return out;
}

/* ===================== RPS 산정 & VU 캡 ===================== */
// 50명 기준: 목록 60 rps, 상세 40 rps, CRUD 10 rps
const BASE_RATES = { list: 60, detail: 40, crud: 10 };
const toRate = (users, base) => Math.max(1, Math.floor((users / 50) * base));

// 각 시나리오별 스테이지를 RPS로 변환
const listStages   = STAGES.map(s => ({ target: toRate(s.users, BASE_RATES.list),   duration: s.duration }));
const detailStages = STAGES.map(s => ({ target: toRate(s.users, BASE_RATES.detail), duration: s.duration }));
const crudStages   = STAGES.map(s => ({ target: toRate(s.users, BASE_RATES.crud),   duration: s.duration }));

function cap(stages) {
  const peak = stages.reduce((m, s) => Math.max(m, s.target), 0);
  const pre = Math.ceil(peak * 1.2);
  const max = Math.ceil(peak * 1.6);
  return { pre, max, startRate: stages[0]?.target || 1 };
}
const capList   = cap(listStages);
const capDetail = cap(detailStages);
const capCrud   = cap(crudStages);

/* ===================== k6 옵션 ===================== */
export const options = {
  discardResponseBodies: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
  tags: { run_id: RUN_ID, env: (__ENV.ENV || 'local') },
  scenarios: {
    aacs_list: {
      executor: 'ramping-arrival-rate',
      timeUnit: '1s',
      preAllocatedVUs: capList.pre,
      maxVUs: capList.max,
      startRate: capList.startRate,
      stages: listStages,
      exec: 'listAacs',
      gracefulStop: '30s',
    },
    aacs_detail: {
      executor: 'ramping-arrival-rate',
      timeUnit: '1s',
      preAllocatedVUs: capDetail.pre,
      maxVUs: capDetail.max,
      startRate: capDetail.startRate,
      stages: detailStages,
      exec: 'getAacDetail',
      gracefulStop: '30s',
    },
    aac_set_crud: {
      executor: 'ramping-arrival-rate',
      timeUnit: '1s',
      preAllocatedVUs: capCrud.pre,
      maxVUs: capCrud.max,
      startRate: capCrud.startRate,
      stages: crudStages,
      exec: 'setCrud',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    'http_req_duration{endpoint:aacs_list}': ['p(95)<800'],
    'http_req_duration{endpoint:aacs_detail}': ['p(95)<800'],
    'http_req_duration{endpoint:aac_set_crud_create}': ['p(95)<1200'],
    'http_req_duration{endpoint:aac_set_crud_update}': ['p(95)<1200'],
    'http_req_duration{endpoint:aac_set_crud_delete}': ['p(95)<1200'],
    'http_req_failed': ['rate<0.5'],
  },
};

/* ===================== setup ===================== */
export function setup() {
  console.log(`BASE_URL=${BASE_URL}, TOKEN_MODE=${TOKEN_MODE}, RUN_ID=${RUN_ID}`);
  console.log(`STAGES=${STAGES_RAW.join(', ')}`);

  let tokens = [];
  if (TOKEN_MODE === 'distinct') {
    const peakUsers = STAGES.reduce((m, s) => Math.max(m, s.users), 0);
    tokens = loginAll(users(peakUsers));
    console.log(`👥 TOKEN_MODE=distinct / 사용자 ${peakUsers}명 토큰 확보`);
  } else {
    tokens = loginAll(users(SMALL));
    console.log(`👥 TOKEN_MODE=reuse / 실제 로그인 ${SMALL}명으로 램핑 트래픽 대표`);
  }

  // 목록에서 샘플 ID 확보
  const bootstrapToken = tokens[0];
  let ids = fetchSomeAacIds(bootstrapToken, 200);

  if (ids.length < 3) {
    const FIXED_IDS = (__ENV.FIXED_IDS || '')
      .split(',').map(s => parseInt(s.trim(), 10)).filter(n => Number.isFinite(n));
    const FALLBACK_ID_RANGE = (__ENV.FALLBACK_ID_RANGE || '1-50')
      .split('-').map(s => parseInt(s.trim(), 10));

    if (FIXED_IDS.length >= 3) { console.warn('⚠️ sampleIds 부족 → FIXED_IDS 사용'); ids = FIXED_IDS; }
    else if (FALLBACK_ID_RANGE.length === 2 && Number.isFinite(FALLBACK_ID_RANGE[0]) && Number.isFinite(FALLBACK_ID_RANGE[1])) {
      console.warn('⚠️ sampleIds 부족 → FALLBACK_ID_RANGE 사용'); ids = rangeInclusive(FALLBACK_ID_RANGE[0], FALLBACK_ID_RANGE[1]);
    }
  }

  if (ids.length < 3) console.warn(`⚠️ 여전히 AAC ID < 3 (현재 ${ids.length}) → set CRUD는 일부 스킵될 수 있음`);
  else console.log(`✅ 부트스트랩된 AAC ID 수: ${ids.length}`);

  return { tokens, sampleIds: ids };
}

function pickToken(data) {
  const pool = data.tokens || [];
  if (!pool.length) return null;
  return pool[(exec.vu.idInTest - 1) % pool.length]; // 라운드로빈
}

/* ===================== 1) 목록 조회 ===================== */
export function listAacs(data) {
  const token = pickToken(data);
  if (!token) return;

  const noFilter = Math.random() < 0.3;
  const situation = encodeURIComponent(randOf(situations));
  const action    = encodeURIComponent(randOf(actions));
  const emotion   = encodeURIComponent(randOf(emotions));
  const page = Math.floor(Math.random() * 5);

  const query = noFilter ? `?page=${page}&size=10`
    : `?page=${page}&size=10&situation=${situation}&action=${action}&emotion=${emotion}`;

  const res = http.get(`${BASE_URL}/api/v1/aacs${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'aacs_list' },
  });
  logIfFail('aacs list', res, [200]);
  check(res, { 'aacs list 200': r => r.status === 200 });
}

/* ===================== 2) 상세 조회 ===================== */
export function getAacDetail(data) {
  const token = pickToken(data);
  if (!token) return;

  const ids = data.sampleIds || [];
  const id = ids.length ? ids[Math.floor(Math.random() * ids.length)] : 1;

  const res = http.get(`${BASE_URL}/api/v1/aacs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'aacs_detail' },
  });
  logIfFail('aacs detail', res, [200]);
  check(res, { 'aacs detail 200': r => r.status === 200 });
}

/* ===================== 3) 세트 CRUD ===================== */
export function setCrud(data) {
  const token = pickToken(data);
  if (!token) return;

  const ids = data.sampleIds || [];
  if (ids.length < 1) { console.warn('⚠️ 사용 가능한 AAC ID가 없음 → set CRUD 스킵'); return; }

  const uniq = Array.from(new Set(ids));
  if (uniq.length < 1) { console.warn('⚠️ 고유 AAC ID 없음 → set CRUD 스킵'); return; }

  function pick3Unique(seed) {
    if (seed.length <= 3) return seed.slice();
    const a = seed.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, 3);
  }

  let created, setId = null;
  for (let attempt = 0; attempt < 2 && !setId; attempt++) {
    const initialIds = pick3Unique(uniq);
    const createReq = { name: `k6-set-${Date.now()}-${attempt}`, description: 'k6 load test set', aacIds: initialIds };

    created = http.post(`${BASE_URL}/api/v1/aacs/sets/create`, JSON.stringify(createReq), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      tags: { endpoint: 'aac_set_crud_create' },
    });

    if (created.status === 200) {
      const createdBody = jsonParseSafe(created.body, {});
      setId = createdBody?.aacSetId ?? createdBody?.setId ?? createdBody?.id ?? null;
      break;
    }
    if (created.status !== 400) break;
  }

  logIfFail('set create', created, [200]);
  check(created, { 'set create 200': (r) => r.status === 200 });
  if (!setId) { console.warn('⚠️ setId 추출 실패 → update/delete 스킵'); return; }

  sleep(0.2);
  const detail = http.get(`${BASE_URL}/api/v1/aacs/sets/my/${setId}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'aac_set_crud_detail' },
  });
  logIfFail('set detail', detail, [200]);
  check(detail, { 'set detail 200': r => r.status === 200 });

  const currentItems = jsonParseSafe(detail.body, []);
  const currentIds = Array.isArray(currentItems)
    ? currentItems.map(it => it?.aacId ?? it?.id ?? it?.aac_id ?? null).filter(v => v != null)
    : [];

  const merged = Array.from(new Set([...currentIds, ...uniq]));
  const updateIds = merged.length >= 3 ? merged.slice(0, 3) : (merged.length ? merged : uniq);

  const updateReq = {
    name: `k6-set-upd-${Date.now()}`,
    description: 'k6 load test set updated',
    aacItemIds: updateIds,
  };

  const upd = http.patch(`${BASE_URL}/api/v1/aacs/sets/${setId}`, JSON.stringify(updateReq), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    tags: { endpoint: 'aac_set_crud_update' },
  });
  logIfFail('set update', upd, [200]);
  check(upd, { 'set update 200': r => r.status === 200 });

  const del = http.del(`${BASE_URL}/api/v1/aacs/sets/${setId}`, null, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'aac_set_crud_delete' },
  });
  logIfFail('set delete', del, [204]);
  check(del, { 'set delete 204': r => r.status === 204 });
}
