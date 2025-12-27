# Video Speed Controller Chrome Extension Information Architecture (IA)

## 1. Site Map (사이트맵)

```
Chrome Extension Root
├── Content Script Layer (콘텐츠 스크립트 계층)
│   ├── 키보드 단축키 리스너
│   ├── 비디오 속도 제어 로직
│   ├── 속도 표시 오버레이
│   └── 온보딩 툴팁 모달
├── Popup Interface (팝업 인터페이스)
│   ├── 메인 설정 화면
│   ├── 고급 옵션 (아코디언)
│   └── 튜토리얼 링크
├── Tutorial Page (튜토리얼 페이지)
│   ├── 단축키 가이드
│   ├── 사용법 설명
│   └── 완료 버튼
└── Background Service (백그라운드 서비스)
    ├── 스토리지 관리
    └── 전역 상태 관리
```

## 2. User Flow (사용자 흐름)

### 주요 작업 1: 확장 프로그램 설치 및 초기 설정
1. 사용자가 Chrome 확장 프로그램을 설치합니다.
2. 첫 번째 비디오 페이지 방문 시 온보딩 툴팁이 표시됩니다.
3. 툴팁에서 기본 단축키 안내를 확인합니다.
4. "시작하기" 버튼을 클릭하여 툴팁을 닫습니다.
5. 확장 프로그램 아이콘을 클릭하여 팝업을 엽니다.
6. 선호 속도를 2.0배속으로 변경합니다.
7. 설정이 자동 저장됩니다.

### 주요 작업 2: 비디오 시청 중 속도 조절
1. 온라인 강의 비디오를 재생합니다.
2. "r" 키를 눌러 1.0배속에서 2.0배속으로 변경합니다.
3. 화면 우상단에 "2.0×" 오버레이가 1.2초간 표시됩니다.
4. 어려운 구간에서 "," 키를 3번 눌러 1.7배속으로 감속합니다.
5. 각 키 입력마다 오버레이가 업데이트됩니다.
6. "r" 키를 다시 눌러 1.0배속으로 복귀합니다.

### 주요 작업 3: 고급 설정 변경
1. 확장 프로그램 아이콘을 클릭합니다.
2. "고급 옵션" 아코디언을 펼칩니다.
3. "배지 표시 활성화" 체크박스를 선택합니다.
4. 설정이 자동 저장되고 팝업을 닫습니다.

## 3. Navigation Structure (네비게이션 구조)

### 주 네비게이션
- **확장 프로그램 아이콘**: 팝업 인터페이스 접근점
- **키보드 단축키**: 직접적인 기능 실행 (네비게이션 불필요)

### 팝업 내부 네비게이션
- **메인 설정 영역**: 선호 속도 입력 필드
- **고급 옵션**: 아코디언 방식으로 접기/펼치기
- **튜토리얼 링크**: 새 탭에서 도움말 페이지 열기

### 모달 네비게이션
- **온보딩 툴팁**: 첫 실행 시 자동 표시, 닫기 버튼으로 해제
- **속도 오버레이**: 자동 표시/숨김, 사용자 조작 불가

## 4. Page Hierarchy (페이지 계층 구조)

```
/ (Extension Root - Depth 0)
├── /content-scripts (Depth 1)
│   ├── /video-controller.js (Depth 2)
│   ├── /overlay-injector.js (Depth 2)
│   └── /onboarding-tooltip.js (Depth 2)
├── /popup (Depth 1)
│   ├── /popup.html (Depth 2)
│   ├── /popup.js (Depth 2)
│   └── /popup.css (Depth 2)
├── /tutorial (Depth 1)
│   ├── /tutorial.html (Depth 2)
│   ├── /tutorial.js (Depth 2)
│   └── /tutorial.css (Depth 2)
├── /background (Depth 1)
│   └── /background.js (Depth 2)
└── /assets (Depth 1)
    ├── /icons (Depth 2)
    └── /styles (Depth 2)
```

## 5. Content Organization (콘텐츠 구성)

| 컴포넌트 | 주요 콘텐츠 요소 |
|---|---|
| 팝업 메인 화면 | 제목 "선호 속도", 숫자 입력 필드, 저장 버튼 |
| 고급 옵션 | 아코디언 헤더, 배지 활성화 체크박스, 설명 텍스트 |
| 속도 오버레이 | 현재 속도 표시 (예: "1.8×"), 반투명 배경 |
| 온보딩 툴팁 | 환영 메시지, 단축키 목록, 시작하기 버튼 |
| 튜토리얼 페이지 | 단축키 표, 사용법 설명, 예시 시나리오, 완료 버튼 |

## 6. Interaction Patterns (인터랙션 패턴)

### 키보드 우선 인터랙션
- **속도 증가**: "." 키로 0.1배속씩 증가
- **속도 감소**: "," 키로 0.1배속씩 감소
- **토글**: "r" 키로 현재 속도와 선호 속도 간 전환

### 시각적 피드백 패턴
- **즉시 피드백**: 키 입력 시 오버레이 즉시 표시
- **자동 숨김**: 1.2초 후 오버레이 자동 페이드아웃
- **부드러운 전환**: 150ms ease-out 애니메이션

### 설정 저장 패턴
- **자동 저장**: 입력 필드 변경 시 즉시 chrome.storage.local에 저장
- **실시간 반영**: 저장된 설정이 모든 탭의 비디오에 즉시 적용

### 모달 및 툴팁 패턴
- **첫 실행 온보딩**: 설치 후 첫 비디오 페이지 방문 시 자동 표시
- **아코디언 확장**: 고급 옵션을 기본적으로 숨김, 클릭 시 확장

## 7. URL Structure (URL 구조)

### 확장 프로그램 내부 리소스
- **팝업**: `chrome-extension://[extension-id]/popup/popup.html`
- **튜토리얼**: `chrome-extension://[extension-id]/tutorial/tutorial.html`
- **아이콘**: `chrome-extension://[extension-id]/assets/icons/[size].png`

### 콘텐츠 스크립트 주입 대상
- **모든 HTTP/HTTPS 페이지**: `*://*/*`
- **비디오 요소 감지**: HTML5 `<video>` 태그가 있는 페이지

## 8. Component Hierarchy (컴포넌트 계층 구조)

### 전역 컴포넌트 (Global Components)
- **SpeedOverlay**: 모든 비디오 페이지에서 사용되는 속도 표시 오버레이
- **KeyboardListener**: 전역 키보드 이벤트 처리기
- **StorageManager**: chrome.storage.local 접근 관리자

### 팝업 컴포넌트 (Popup Components)
- **PopupContainer**: 팝업의 최상위 컨테이너 (240×160px)
- **PreferredSpeedInput**: 선호 속도 설정 숫자 입력 필드
- **AdvancedOptionsAccordion**: 고급 설정 접기/펼치기 영역
- **SaveButton**: 설정 저장 버튼 (자동 저장으로 향후 제거 예정)
- **TutorialLink**: 도움말 페이지 연결 링크

### 온보딩 컴포넌트 (Onboarding Components)
- **OnboardingTooltip**: 첫 실행 시 표시되는 안내 모달
- **ShortcutGuide**: 키보드 단축키 안내 테이블
- **WelcomeMessage**: 환영 메시지 및 기본 설명

### 튜토리얼 컴포넌트 (Tutorial Components)
- **TutorialContainer**: 튜토리얼 페이지 레이아웃 컨테이너
- **ShortcutTable**: 단축키와 기능 설명 표
- **UsageExample**: 실제 사용 시나리오 예시
- **CompletionButton**: 튜토리얼 완료 버튼

### 상태 관리 컴포넌트 (State Management Components)
- **PreferredSpeedStore**: 선호 속도 값 저장 및 관리
- **VideoElementTracker**: 현재 페이지의 비디오 요소 추적
- **SpeedHistoryManager**: 이전 속도 기록 관리 (토글 기능용)

### 접근성 컴포넌트 (Accessibility Components)
- **FocusManager**: 키보드 네비게이션 순서 관리
- **ScreenReaderAnnouncer**: 스크린 리더를 위한 상태 변경 알림
- **HighContrastSupport**: 고대비 모드 지원