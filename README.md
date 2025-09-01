# 🗣️ 말문 (Malmoon) - WebRTC 기반 언어치료 플랫폼

#### SSAFY 13기 2학기 광주 1반 communE.T (25.07.07 ~ 25.08.18)

![](/README_img/메인페이지.png)

---

## 📑 목차

- [프로젝트 개요](#overview)
  - [팀원 소개](#team)
  - [기획 배경](#background)
- [서비스 소개](#service)
  - [시연 영상](#demo)
  - [서비스 화면 및 기능](#screens)
- [개발 환경](#env)
- [프로젝트 구조](#structure)
- [협업 환경](#collab)
- [프로젝트 산출물](#deliverables)
  - [API 명세서](#api)
  - [ERD](#erd)
  - [아키텍처](#architecture)

---

## 📌 프로젝트 개요 <a id="overview"></a>

### 1️⃣ 팀원 소개 <a id="team"></a>

| 정수형 | 임덕규 | 황성헌 |
|:-:|:-:|:-:|
| ![](README_img/profile6.png) | ![](README_img/profile5.png) | ![](README_img/profile4.png) |
| Leader, BackEnd, Deployment | AI, BackEnd | Security, BackEnd |
| 윤지훈 | 유영훈 | 정형진 |
| ![](README_img/profile2.png) | ![](README_img/profile1.png) | ![](README_img/profile3.png) |
| FrontEnd | FrontEnd | FrontEnd |


### 2️⃣ 기획 배경 <a id="background"></a>

***언어지연 및 학습 부진 아동의 치료 기회를 넓히기 위해서는 많은 장벽을 넘어야 합니다.***

>
* 가까운 곳에 언어재활센터가 없어요.
* 치료비가 너무 비싸요.
* 대기 시간 동안 치료의 골든타임을 놓치고 있어요.
...

현재, 많은 아이들이 언어치료가 필요하지만
지역 간 인프라 격차와 높은 치료비용,
그리고 이를 보조할 공적 제도의 부재로 인해 치료를 받기 어려운 상황입니다.

malmoon은 이러한 구조적 문제를 해결하고자 만들어졌습니다. </br> </br>
**"누구든, 언제 어디서든 말의 꽃을 피울 수 있도록"** </br> </br>
언어치료를 **언제, 어디서나** 받을 수 있도록 WebRTC 기반 **실시간 비대면 언어치료** 서비스를 제공하며,  
**AI**와 **디지털 교구**를 통해 치료의 효율성을 높입니다.


저희는 이 서비스를 통해
누구든, 어디서든, 말의 꽃을 피울 수 있도록
아이들의 치료 기회를 확장하고자 합니다.

---

## 🖥️ 서비스 소개 <a id="service"></a>

### 1️⃣ 영상 포트폴리오 <a id="demo"></a>

[🔗 영상 포트폴리오 바로가기](https://www.youtube.com/watch?v=MPnJdHV2HJ8)

### 2️⃣ 서비스 화면 및 기능 <a id="screens"></a>

#### 1) 사이트 소개

|                  메인 페이지 & 회원가입                  |
|:-----------------------------------------------:|
| ![메인 페이지 & 회원가입](/README_img/1.mainAndJoin.gif) |

* 메인 페이지에서는 서비스의 전반적인 소개와 주요 기능을 확인할 수 있습니다. </br>
* 회원가입 시 재활사 회원과 치료 대상자 회원으로 구분하여 가입할 수 있습니다. </br>
* 재활사는 자격증 번호와 경력 사항을 입력해 전문성을 검증할 수 있고, 대상자는 기본 정보를 입력해 맞춤형 서비스를 받을 수 있습니다.

***

#### 2) 간이언어평가 & 결과확인
|                     간이언어평가 & 결과확인                    |
|:----------------------------------------------------:|
| ![간이언어평가 & 결과확인](/README_img/2.evaluationOfLanguage.gif) |

* 대상자는 간단한 문항 기반 간이언어평가를 통해 현재 언어 능력을 진단받을 수 있습니다. </br>
* 평가 결과는 즉시 확인할 수 있으며 매칭 신청 시 재활사에게 진단 평가 정보가 제공됩니다.

#### 3) 치료 매칭
|            치료 매칭            |
|:------------------------------------:|
| ![치료 매칭](/README_img/3.matching.gif) |

* 대상자는 치료사의 경력을 확인할 수 있으며 본인이 원하는 재활사의 치료 가능 시간대를 확인 후 치료 요청을 신청할 수 있습니다.

***

#### 4) 로그인 및 스케줄 관리

|                     로그인 & 스케줄 관리                     |
|:----------------------------------------------------:|
| ![로그인 및 스케줄 관리](/README_img/4.loginAndSchedule.gif) |

* 재활사 로그인 시 바로 치료 일정 관리 화면으로 이동하며, 원하는 시간대에 치료 일정을 등록할 수 있습니다. </br> 
* 대상자는 재활사가 등록한 스케줄을 바탕으로 예약을 진행할 수 있어 원활한 일정 조율이 가능합니다.

#### 5) 치료 매칭 관리

|                           치료 매칭 관리                            |
|:-------------------------------------------------------------:|
| ![치료 매칭 관리](/README_img/5.managingTreatmentMatching.gif) |

* 재활사는 본인이 진행 중인 치료 대상자 관리, 상담 신청, 치료 신청 등을 관리 할 수 있습니다.
* 상담, 치료를 신청한 대상자의 기본 정보와 초기 진단 내역이 있다면 확인 할 수 있습니다.

#### 6) 수업 도구 관리
|                           수업 도구 관리                            |
|:-------------------------------------------------------------:|
| ![수업 도구 관리](/README_img/6.toolsManagementAACAIImageGenerationAndFilterManagement.gif) |

* 수업에 필요한 AAC 카드, AI 이미지 생성, 필터 관리 등의 기능을 제공합니다. 
* 재활사는 직접 자료를 생성하거나 관리할 수 있어 치료에 필요한 교구를 손쉽게 준비할 수 있습니다.

***

#### 7) 수업 화면
|                                          수업 화면                                          |
|:---------------------------------------------------------------------------------------:|
|                             ![수업 화면](/README_img/7.treatment.gif)                              |

* WebRTC 기반의 실시간 치료 화면에서 재활사와 대상자가 화상으로 상호작용합니다. 
* 교구 활용, AAC 지원 등 다양한 기능이 통합되어 실제 언어치료 환경과 유사한 온라인 수업을 제공합니다.

#### 8) AAC 사용
|                   AAC 사용                   |
|:------------------------------------------:|
| ![AAC 사용](/README_img/8.useAAC.gif) |

* 대상자는 상황, 감정, 행동을 표현할 수 있는 AAC(보완대체의사소통) 카드를 활용할 수 있습니다. 
* 직관적인 카드 UI를 통해 발화를 돕고, 의사소통 능력을 확장할 수 있습니다.

#### 9) 동화 STT 녹음
|                         동화 STT 녹음                         |
|:---------------------------------------------------------:|
| ![동화 STT 녹음](/README_img/9.FairyTaleSTTRecording.gif) |

* 치료 대상자가 동화를 읽고 재활사가 음성을 녹음(STT 변환)하면, 시스템이 발화 내용을 분석하여 정확도 및 유창성을 평가합니다. 

#### 10) 필터 적용
|                      필터 적용                       |
|:------------------------------------------------:|
| ![필터 적용](/README_img/10.applyFilter.gif) |

* 재활사가 업로드하거나 선택한 집중력 필터(예: 모자, 동물 캐릭터 등)를 수업 화면에 적용할 수 있습니다. 
* 시각적 재미 요소를 통해 대상자의 몰입도를 높이고, 치료 참여도를 향상시킵니다.

---

## 🛠️ 개발 환경 <a id="env"></a>

| **BackEnd** | ![Java](https://img.shields.io/badge/Java-17-orange) ![Spring Boot](https://img.shields.io/badge/SpringBoot-3.5.4-green) ![Spring Security](https://img.shields.io/badge/Security-SpringSecurity-brightgreen) ![JWT](https://img.shields.io/badge/Auth-JWT-blue) ![REST API](https://img.shields.io/badge/API-REST-blueviolet) ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-316192) ![JPA](https://img.shields.io/badge/Persistence-JPA-red) ![Gradle](https://img.shields.io/badge/Build-Gradle-02303A) |
|:-|:-|
| **FrontEnd** | ![React](https://img.shields.io/badge/Frontend-React-61DAFB) ![React Router](https://img.shields.io/badge/Router-ReactRouter-CA4245) ![Axios](https://img.shields.io/badge/HTTP-Axios-5A29E4) ![Context API](https://img.shields.io/badge/State-ContextAPI-FFCA28) |
| **AI** | ![Python](https://img.shields.io/badge/Python-3.10-3776AB) ![FastAPI](https://img.shields.io/badge/API-FastAPI-009688) ![Uvicorn](https://img.shields.io/badge/Server-Uvicorn-FFCA28) ![Gemini](https://img.shields.io/badge/AI-Gemini-4285F4) ![ChatGPT](https://img.shields.io/badge/AI-ChatGPT-10A37F) ![Whisper](https://img.shields.io/badge/STT-Whisper-FF6F00) |
| **Infra** | ![Docker](https://img.shields.io/badge/Container-Docker-2496ED) ![Nginx](https://img.shields.io/badge/Proxy-Nginx-009639) ![AWS EC2](https://img.shields.io/badge/Cloud-AWS_EC2-FF9900) ![AWS S3](https://img.shields.io/badge/Storage-AWS_S3-569A31) ![Redis](https://img.shields.io/badge/Cache-Redis-DC382D) ![Let's Encrypt](https://img.shields.io/badge/SSL-Let'sEncrypt-003A70) |
| **RTC** | ![LiveKit](https://img.shields.io/badge/WebRTC-LiveKit-FF4088) ![OpenVidu](https://img.shields.io/badge/WebRTC-OpenVidu-1D7EB7) |
| **Test** | ![JUnit5](https://img.shields.io/badge/Test-JUnit5-25A162) ![Mockito](https://img.shields.io/badge/Mock-Mockito-4B8BBE) ![k6](https://img.shields.io/badge/Load-k6-7D64FF) ![JMeter](https://img.shields.io/badge/Load-JMeter-D22128) ![Grafana](https://img.shields.io/badge/Monitor-Grafana-F46800) |


---


## 🗂️ 프로젝트 구조 <a id="structure"></a>

#### 🗂️  Back

```plaintext
├──📁aac
│   ├──📁controller    # AAC(보완대체의사소통) API 엔드포인트
│   ├──📁domain        # AAC 도메인 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁exception     # AAC 전용 예외 정의
│   ├──📁repository    # AAC 데이터 접근 계층
│   └──📁service       # AAC 비즈니스 로직
│
├──📁bundle
│   ├──📁controller    # AAC 묶음(bundle) 관리 API
│   ├──📁domain        # 묶음 관련 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁repository    # 데이터 접근 계층
│   └──📁service       # 묶음 관리 비즈니스 로직
│
├──📁chat
│   ├──📁controller    # 채팅방/메시지 API
│   ├──📁domain        # 채팅 관련 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁exception     # 채팅 기능 예외 처리
│   ├──📁repository    # 채팅 데이터 접근 계층
│   └──📁service       # 채팅 비즈니스 로직
│
├──📁common
│   ├──📁auth          # 인증/인가 관련 유틸리티
│   ├──📁config        # 글로벌 설정 클래스
│   ├──📁entity        # 공통 엔티티
│   ├──📁exception     # 공통 예외 처리
│   └──📁redis         # Redis 설정 및 유틸
│
├──📁diagnostic
│   ├──📁client        # 외부 진단 서비스 연동 클라이언트
│   ├──📁controller    # 간편 진단 API
│   ├──📁domain        # 진단 관련 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁exception     # 진단 기능 예외 처리
│   ├──📁infra         # 진단 인프라 모듈
│   ├──📁repository    # 데이터 접근 계층
│   └──📁service       # 진단 비즈니스 로직
│
├──📁external
│   └──📁fastapi       # FastAPI 서버 연동 모듈
│
├──📁file
│   ├──📁controller    # 파일 업로드/다운로드 API
│   ├──📁domain        # 파일 관련 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁infra         # AWS S3 등 외부 스토리지 연동
│   ├──📁repository    # 파일 데이터 접근 계층
│   └──📁service       # 파일 관리 비즈니스 로직
│
├──📁filter
│   ├──📁controller    # 실시간 필터 관리 API
│   ├──📁domain        # 필터 관련 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁exception     # 필터 기능 예외 처리
│   ├──📁repository    # 데이터 접근 계층
│   └──📁service       # 필터 비즈니스 로직
│
├──📁matching
│   ├──📁controller    # 치료사-아동 매칭 API
│   ├──📁domain        # 매칭 관련 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁repository    # 데이터 접근 계층
│   └──📁service       # 매칭 비즈니스 로직
│
├──📁member
│   ├──📁controller    # 회원 가입/조회/수정 API
│   ├──📁domain        # 회원 엔티티
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁exception     # 회원 기능 예외 처리
│   ├──📁jwt           # JWT 인증 모듈
│   ├──📁repository    # 회원 데이터 접근 계층
│   └──📁service       # 회원 비즈니스 로직
│
├──📁session
│   ├──📁config        # WebRTC 세션 설정
│   ├──📁controller    # 세션 생성/종료 API
│   ├──📁dto           # 요청/응답 DTO
│   │   ├──📁request
│   │   └──📁response
│   ├──📁exception     # 세션 예외 처리
│   └──📁service       # 세션 관리 로직
│       └──📁retry     # 세션 재시도 로직
│
└──📁storybook
    ├──📁controller    # 동화 기반 학습 API
    ├──📁domain        # 동화 관련 엔티티
    ├──📁dto           # 요청/응답 DTO
    │   ├──📁request
    │   └──📁response
    ├──📁repository    # 데이터 접근 계층
    └──📁service       # 동화 학습 비즈니스 로직

```

* BackEnd는 **도메인 중심 설계(Domain-Driven Design, DDD)** 를 기반으로 기능별 패키지로 구분되어 있습니다.<br/>
* 각 기능은 controller → service → repository → domain의 계층 구조를 따르며, 요청·응답 DTO, 예외 처리, 외부 연동 모듈 등을 포함합니다.<br/>
* 이를 통해 유지보수성 향상, 확장성 보장, 가독성 및 역할 명확화, 테스트 용이성, 비즈니스 로직 집중 등 다양한 장점을 확보하였습니다.<br/>

#### 🗂️ Front

```plaintext
├──📁api               # 백엔드와 통신하는 API 모듈
├──📁assets            # 정적 자원(이미지, 아이콘 등)
│   └──📁icons         # UI에 사용하는 아이콘 모음
├──📁components        # 재사용 가능한 UI 컴포넌트
│   ├──📁common        # 버튼, 입력창 등 공용 컴포넌트
│   ├──📁modals        # 모달 창 컴포넌트
│   ├──📁navigation    # 네비게이션 바, 메뉴 등
│   ├──📁signup        # 회원가입 전용 UI
│   ├──📁TherapistSession  # 치료사 세션 관련 UI
│   └──📁TherapistToolTap  # 치료사 툴 관련 UI
├──📁contexts          # React Context API 상태 관리
├──📁hooks             # 커스텀 훅 모음
├──📁logoimage         # 서비스 로고 이미지
└──📁pages             # 페이지 단위 컴포넌트
    ├──📁Auth          # 로그인/회원가입 등 인증 페이지
    ├──📁signup        # 회원가입 관련 페이지
    ├──📁Therapist     # 치료사 전용 페이지
    │    └──📁MyPage   # 치료사 마이페이지
    └──📁User          # 일반 사용자 페이지
        ├──📁Booking   # 예약 관련 페이지
        └──📁MyPage    # 사용자 마이페이지

```

* Front는 기능별 디렉토리 분리를 통해 컴포넌트 관리를 용이하게 하였으며,공용 UI와 페이지 전용 UI를 분리하여 재사용성을 확보했습니다.<br/>
* 또한 React Context API와 커스텀 훅을 활용해 상태 관리와 로직 재사용성을 높였고, API 호출 모듈화로 백엔드·AI 서버와의 통신 로직 일관성을 유지하였습니다.<br/>

#### 🗂️  AI

```plaintext
├──📁api/v1
│   ├──📁aac         # AAC(보완대체의사소통) 이미지·데이터 생성 및 관리 API
│   ├──📁feedback    # 치료사 피드백 생성/분석 API
│   └──📁stt         # 음성 → 텍스트 변환(STT) API  
│ 
└──📁static
    └──📁temp        # 임시 파일 저장 디렉토리 (생성된 이미지·오디오·중간 결과물 보관)

```

* AI는 버전별 API 디렉토리 구조를 사용하여 기능별 모듈을 분리함으로써 유지보수성과 확장성을 확보했습니다.<br/>
* 또한, AI 처리 과정에서 생성되는 임시 파일을 별도의 디렉토리에 저장하고 주기적으로 정리하여 저장소 용량을 효율적으로 관리합니다.<br/>
* FastAPI의 라우팅 구조를 그대로 반영해 프론트엔드와 백엔드 간 API 명세의 일관성을 유지하였습니다.<br/>

---
## 🗃️ 협업 환경 <a id="collab"></a>

#### 1) GitLab

| ![](/README_img/협업도구_GitLab.png) |
|:-:|

* GitLab 단일 레포지토리 구조를 사용하며, apps 폴더 내에서 백엔드(backend), 프론트엔드(frontend), AI 서비스(ai)를 함께 관리합니다.<br/>
* 이 방식으로 서비스별 코드를 한 저장소에서 통합 관리하여 버전 동기화, 브랜치 전략 일원화가 용이합니다.<br/>


| ![](/README_img/협업도구_GitLab_브랜치전략.png) |
|:-:|

* GitLab 브랜치 전략을 통해 각 기능·수정 사항별로 브랜치를 생성하여 개발을 진행합니다.<br/>
* develop 브랜치를 중심으로, UI 수정(style/*), 기능 개발(feature/*), 버그 수정(fix/*) 등 목적에 맞는 브랜치를 생성하고 작업 완료 후 Merge Request를 통해 코드 리뷰와 병합을 진행했습니다.<br/>


|![](/README_img/협업도구_GitLab_MR양식.png)|
|:-:|

* 또한, 커밋 메시지 규칙과 Merge Request(MR) 작성 양식을 사전에 정의하여 관리하였습니다.<br/>
* 이를 통해 코드 변경 사항의 의도와 범위를 명확히 기록하고, 리뷰어가 변경 내용을 빠르게 이해할 수 있도록 하였습니다.<br/>

#### 2) Jira

|![](/README_img/협업도구_Jira.png)|
|:-:|

* 프로젝트 전반의 작업 계획, 진행 상황, 완료 현황을 Jira를 통해 관리하였습니다.<br/>
* 스프린트 단위로 업무를 계획하고, 할 일(To Do) → 진행 중(In Progress) → 완료(Done) 단계로 작업 상태를 관리했습니다.<br/>
* 에픽(Epic)과 스토리(Story) 단위로 이슈를 세분화하여, 백엔드(BE), 프론트엔드(FE), AI 각 파트의 진행 상황을 한눈에 파악할 수 있도록 구성하였습니다.<br/>

#### 3) Notion

|![](/README_img/협업도구_Notion.png)|
|:-:|

* 프로젝트 전반의 문서화와 정보 공유를 위해 Notion을 사용하였습니다.<br/>
* 프로젝트 개요, 요구사항, 시스템 설계, API 명세 등 개발에 필요한 모든 문서를 구조적으로 정리하였고, 운영 산출물(브랜치 전략, 테스트 계획, 발표 자료, 회고)도 함께 관리하여 팀원 간 정보 접근성과 협업 효율성을 높였습니다.<br/>

---

## 🧾 프로젝트 산출물 <a id="deliverables"></a>

### 1️⃣ API 명세서 <a id="api"></a>

| [🔗 API 명세서 바로가기](https://www.notion.so/2395fc0176ea801c8f95de3e566d2ba8?v=2395fc0176ea808ca5d6000c59cda89b&source=copy_link) |

***

### 2️⃣ ERD <a id="erd"></a>

| ![](/README_img/malmoonERD.png) |
|:-----------------:|

### 3️⃣ 아키텍처 <a id="architecture"></a>

| ![](/README_img/architecture.png) |
|:-----------------:|