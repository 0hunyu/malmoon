// aac-api-ramping.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

/* ===================== 환경 변수 ===================== */
const BASE_URL   = __ENV.BASE_URL || 'http://localhost:8080';
const RUN_ID     = __ENV.RUN_ID || `local-${Date.now()}`;
const TOKEN_MODE = (__ENV.TOKEN_MODE || 'reuse').toLowerCase(); // 'reuse' | 'distinct'
const SMALL      = Number(__ENV.USER_POOL_SMALL || 5);
const LARGE      = Number(__ENV.USER_POOL_LARGE || 50);

/* ---- 부하 모드 스위치 ---- */
const TEST_SHAPE = (__ENV.TEST_SHAPE || 'rate_ramp').toLowerCase(); // rate_ramp | users_ramp

// rate_ramp: 기존처럼 도착률(RPS) 램핑
const STAGES_RAW = (__ENV.STAGES || '5:1m,50:1m,200:3m,350:3m,500:4m')
  .split(',').map(s => s.trim()).filter(Boolean);

// users_ramp: 총 RPS 고정, 사용자 수(VU)만 구간별 증가
const USER_SEGMENTS_RAW = (__ENV.USER_SEGMENTS || '20:1m,100:3m,200:3m,350:3m,500:4m')
  .split(',').map(s => s.trim()).filter(Boolean);
// users_ramp에서 구간별로 유지할 총 RPS(전체)
const RATE = Number(__ENV.RATE || 200); // 초당 요청 수

/* ===================== 파서/공통 ===================== */
function parseStages(pairs) {
  return pairs.map(pair => {
    const [n, d] = pair.split(':');
    const num = Number(n);
    const duration = d;
    if (!Number.isFinite(num) || !duration) throw new Error(`형식 오류: "${pair}" (예: "200:3m")`);
    return { num, duration };
  });
}
const ST = parseStages(STAGES_RAW);          // RPS용
const SEG = parseStages(USER_SEGMENTS_RAW);  // VU용

/* ===================== 테스트 데이터 ===================== */
const situations = ['감정', '달력', '동작', '사람', '상태', '식사', '신체', '장소', '질문'];
const actions  = ['(미사용)'];
const emotions = ['(미사용)'];

/* ===================== 유틸 ===================== */
function users(n) {
  return Array.from({ length: n }, (_, i) => ({ email: `therapist${i + 1}@test.com`, password: 'qwer1234' }));
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
  if (Array.isArray(body?.data)) return body.data; // data 자체가 배열인 경우
  const keys = body && typeof body === 'object' ? Object.keys(body) : [];
  console.warn(`⚠️ 목록 응답에서 content 배열을 찾지 못함. top-level keys=${keys.join(',')}`);
  return [];
}
function extractId(item){ return item?.aacId ?? item?.id ?? item?.aac_id ?? null; }

/* ===================== 토큰 파서 & 로그인 ===================== */
function pickTokenFrom(body) {
  const b = jsonParseSafe(body, {});
  return b?.accessToken ?? b?.token ?? b?.data?.accessToken ?? b?.data?.token ?? b?.result?.accessToken ?? b?.result?.token ?? null;
}

function loginAll(list) {
  return list.map(u => {
    const r = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify(u), {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      responseType: 'text', // 바디 보존
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
      responseType: 'text', // 바디 보존
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

/* ===================== RPS 산정 & VU 캡 (rate_ramp용) ===================== */
// 50명 기준: 목록 60 rps, 상세 40 rps, CRUD 10 rps
const BASE_RATES = { list: 60, detail: 40, crud: 10 };
const toRate = (users, base) => Math.max(1, Math.floor((users / 50) * base));

const listStages   = ST.map(s => ({ target: toRate(s.num, BASE_RATES.list),   duration: s.duration }));
const detailStages = ST.map(s => ({ target: toRate(s.num, BASE_RATES.detail), duration: s.duration }));
const crudStages   = ST.map(s => ({ target: toRate(s.num, BASE_RATES.crud),   duration: s.duration }));

function cap(stages) {
  const peak = stages.reduce((m, s) => Math.max(m, s.target), 0);
  const pre = Math.ceil(peak * 1.2);
  const max = Math.ceil(peak * 1.6);
  return { pre, max, startRate: stages[0]?.target || 1 };
}
const capList   = cap(listStages);
const capDetail = cap(detailStages);
const capCrud   = cap(crudStages);

/* ===================== 옵션 빌더 ===================== */
function buildOptions_rateRamp() {
  return {
    discardResponseBodies: true, // 필요 요청은 개별 responseType으로 보존
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
    tags: { run_id: RUN_ID, env: (__ENV.ENV || 'local') },
    scenarios: {
      aacs_list:   { executor: 'ramping-arrival-rate', timeUnit: '1s', preAllocatedVUs: capList.pre,   maxVUs: capList.max,   startRate: capList.startRate,   stages: listStages,   exec: 'listAacs',   gracefulStop: '30s' },
      aacs_detail: { executor: 'ramping-arrival-rate', timeUnit: '1s', preAllocatedVUs: capDetail.pre, maxVUs: capDetail.max, startRate: capDetail.startRate, stages: detailStages, exec: 'getAacDetail', gracefulStop: '30s' },
      aac_set_crud:{ executor: 'ramping-arrival-rate', timeUnit: '1s', preAllocatedVUs: capCrud.pre,   maxVUs: capCrud.max,   startRate: capCrud.startRate,   stages: crudStages,   exec: 'setCrud',    gracefulStop: '30s' },
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
}

function buildOptions_usersRampConstantRate() {
  const scenarios = {};
  let accStart = 0; // 누적 시작시간(초)

  function durToSec(s) {
    if (s.endsWith('ms')) return Math.ceil(parseInt(s));
    if (s.endsWith('s'))  return parseInt(s);
    if (s.endsWith('m'))  return parseInt(s) * 60;
    if (s.endsWith('h'))  return parseInt(s) * 3600;
    throw new Error(`지원하지 않는 duration: ${s}`);
  }

  // 비율(목록/상세/CRUD) 가중치
  const W_LIST = 0.6, W_DETAIL = 0.3, W_CRUD = 0.1;

  SEG.forEach((seg, idx) => {
    const startTimeStr = `${accStart}s`;
    const pre = Math.max(seg.num, 1);
    const max = Math.ceil(seg.num * 1.3);

    scenarios[`list_seg${idx+1}`] = {
      executor: 'constant-arrival-rate',
      timeUnit: '1s',
      rate: Math.max(1, Math.floor(RATE * W_LIST)),
      duration: seg.duration,
      startTime: startTimeStr,
      preAllocatedVUs: pre,
      maxVUs: max,
      exec: 'listAacs',
      gracefulStop: '30s',
    };
    scenarios[`detail_seg${idx+1}`] = {
      executor: 'constant-arrival-rate',
      timeUnit: '1s',
      rate: Math.max(1, Math.floor(RATE * W_DETAIL)),
      duration: seg.duration,
      startTime: startTimeStr,
      preAllocatedVUs: pre,
      maxVUs: max,
      exec: 'getAacDetail',
      gracefulStop: '30s',
    };
    scenarios[`crud_seg${idx+1}`] = {
      executor: 'constant-arrival-rate',
      timeUnit: '1s',
      rate: Math.max(1, Math.floor(RATE * W_CRUD)),
      duration: seg.duration,
      startTime: startTimeStr,
      preAllocatedVUs: Math.max(2, Math.floor(pre * 0.2)),
      maxVUs: Math.max(4, Math.floor(max * 0.2)),
      exec: 'setCrud',
      gracefulStop: '30s',
    };

    accStart += durToSec(seg.duration);
  });

  return {
    discardResponseBodies: true,
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)'],
    tags: { run_id: RUN_ID, env: (__ENV.ENV || 'local') },
    scenarios,
    thresholds: {
      'http_req_duration{endpoint:aacs_list}': ['p(95)<800'],
      'http_req_duration{endpoint:aacs_detail}': ['p(95)<800'],
      'http_req_duration{endpoint:aac_set_crud_create}': ['p(95)<1200'],
      'http_req_duration{endpoint:aac_set_crud_update}': ['p(95)<1200'],
      'http_req_duration{endpoint:aac_set_crud_delete}': ['p(95)<1200'],
      'http_req_failed': ['rate<0.5'],
    },
  };
}

/* ===================== 최종 options 선택 ===================== */
export const options = (TEST_SHAPE === 'users_ramp')
  ? buildOptions_usersRampConstantRate()
  : buildOptions_rateRamp();

/* ===================== setup ===================== */
export function setup() {
  console.log(`BASE_URL=${BASE_URL}, TOKEN_MODE=${TOKEN_MODE}, RUN_ID=${RUN_ID}`);
  console.log(`TEST_SHAPE=${TEST_SHAPE}`);
  if (TEST_SHAPE === 'rate_ramp') console.log(`STAGES=${STAGES_RAW.join(', ')}`);
  if (TEST_SHAPE === 'users_ramp') console.log(`USER_SEGMENTS=${USER_SEGMENTS_RAW.join(', ')} RATE=${RATE}`);

  let tokens = [];
  if (TOKEN_MODE === 'distinct') {
    const peakUsers = (TEST_SHAPE === 'rate_ramp')
      ? ST.reduce((m, s) => Math.max(m, s.num), 0)
      : SEG.reduce((m, s) => Math.max(m, s.num), 0);
    tokens = loginAll(users(peakUsers));
    console.log(`👥 TOKEN_MODE=distinct / 사용자 ${peakUsers}명 토큰 확보`);
  } else {
    tokens = loginAll(users(SMALL));
    console.log(`👥 TOKEN_MODE=reuse / 실제 로그인 ${SMALL}명으로 램핑 트래픽 대표`);
  }

  const bootstrapToken = tokens[0];
  let ids = fetchSomeAacIds(bootstrapToken, 200);

  if (ids.length < 3) {
    const FIXED_IDS = (__ENV.FIXED_IDS || '').split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite);
    const FALLBACK_ID_RANGE = (__ENV.FALLBACK_ID_RANGE || '1-50').split('-').map(s => parseInt(s.trim(), 10));
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

  const useFilter = Math.random() < 0.7;
  const situation = encodeURIComponent(randOf(situations));
  const page = Math.floor(Math.random() * 5);

  const base = `?page=${page}&size=10`;
  const query = useFilter ? `${base}&situation=${situation}` : base;

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

/* ========== 생성 응답에서 setId 추출(바디 또는 Location 헤더) ========== */
function pickSetIdFrom(res) {
  const body = jsonParseSafe(res.body, null);
  const cand = body?.aacSetId ?? body?.setId ?? body?.id ?? body?.data?.aacSetId ?? body?.data?.setId ?? body?.data?.id ?? null;
  if (cand != null) return cand;
  const loc = res.headers?.Location || res.headers?.location;
  if (loc) {
    const m = String(loc).match(/\/(\d+)(?:\D*)?$/);
    if (m) return Number(m[1]);
  }
  return null;
}

/* ========== Fallback: 목록에서 이름으로 setId 역검색 ========== */
function findSetIdByName(token, name) {
  const endpoints = [
    `${BASE_URL}/api/v1/aacs/sets/my?page=0&size=20`,
    `${BASE_URL}/api/v1/aacs/sets?page=0&size=20&mine=true`,
    `${BASE_URL}/api/v1/aacs/sets?page=0&size=20`,
  ];

  for (const url of endpoints) {
    const r = http.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text',
      tags: { endpoint: 'aac_set_list_fallback' },
    });
    if (r.status !== 200) continue;
    const list = extractContentArray(jsonParseSafe(r.body, {}));
    for (const it of list) {
      if (it?.name === name) {
        const id = extractId(it);
        if (id != null) return id;
      }
    }
  }
  return null;
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
    const setName = `k6-set-${Date.now()}-${attempt}`;
    const createReq = { name: setName, description: 'k6 load test set', aacIds: initialIds };

    created = http.post(`${BASE_URL}/api/v1/aacs/sets/create`, JSON.stringify(createReq), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      tags: { endpoint: 'aac_set_crud_create' },
      responseType: 'text', // 바디 보존
    });

    if (created.status === 200 || created.status === 201) {
      setId = pickSetIdFrom(created);
      if (!setId) {
        // 최후 수단: 방금 만든 name으로 목록에서 역검색
        setId = findSetIdByName(token, setName);
      }
      if (setId) break;
    }
    if (created.status !== 400) break; // 400만 재시도, 그 외는 중단
  }

  logIfFail('set create', created, [200, 201]);
  check(created, { 'set create 200/201': (r) => r.status === 200 || r.status === 201 });

  if (!setId) {
    console.warn(`⚠️ setId 추출 실패. status=${created?.status} body=${created?.body} location=${created?.headers?.Location || created?.headers?.location}`);
    return;
  }

  sleep(0.2);
  const detail = http.get(`${BASE_URL}/api/v1/aacs/sets/my/${setId}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { endpoint: 'aac_set_crud_detail' },
    responseType: 'text',
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
    aacItemIds: updateIds, // 스펙 A
    aacIds: updateIds,     // 스펙 B
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
