# Video Speed Controller Chrome Extension Design Guide

## 1. Overall Mood (전체적인 무드)

온라인 학습자들을 위한 신뢰할 수 있고 전문적인 도구로서의 무드를 추구합니다. 학습에 방해되지 않는 미니멀하고 깔끔한 디자인을 통해 사용자가 콘텐츠에 집중할 수 있도록 지원합니다. 쿨톤 계열의 차분한 색상과 중간 정도의 채도를 사용하여 안정감과 신뢰성을 전달하며, 불필요한 시각적 요소를 배제한 기능 중심의 인터페이스를 제공합니다.

## 2. Reference Service (참조 서비스)

- **Name**: Notion
- **Description**: 올인원 워크스페이스 및 노트 작성 도구
- **Design Mood**: 깔끔하고 미니멀한 디자인, 넉넉한 여백과 단순한 구분선을 활용한 차분한 인터페이스
- **Primary Color**: #1F6FEB
- **Secondary Color**: #1E3A5F

## 3. Color & Gradient (색상 & 그라데이션)

- **Primary Color**: #1F6FEB (딥 블루) - 버튼, 하이라이트, 액티브 상태
- **Secondary Color**: #1E3A5F (네이비) - 배경, 호버 상태
- **Accent Color**: #FFD64D (소프트 옐로우) - 성공 상태, 포커스 링
- **Background Light**: #F5F7FA - 팝업 배경
- **Text Dark**: #1A1A1A - 주요 텍스트
- **Text Gray**: #8A8F98 - 비활성 아이콘, 보조 텍스트
- **Divider**: #E3E6EA - 구분선
- **Overlay Background**: #1E3A5F (80% 투명도) - 오버레이 배경
- **Mood**: 쿨톤, 중간 채도
- **Color Usage**: Primary는 가장 중요한 액션 버튼과 활성 상태에, Secondary는 배경과 보조 요소에, Accent는 포커스와 성공 피드백에 사용

## 4. Typography & Font (타이포그래피 & 폰트)

- **Font Family**: Inter, system fallback (San Francisco, Segoe UI)
- **Heading 1 (Title)**: Inter, 16px, Weight 600
- **Body**: Inter, 14px, Weight 400
- **Caption**: Inter, 12px, Weight 400
- **Button Text**: Inter, 14px, Weight 500
- **Overlay Text**: Inter, 14px, Weight 700 (Bold)
- **Letter Spacing**: 기본값 사용
- **Line Height**: 1.4 (제목), 1.5 (본문)

## 5. Layout & Structure (레이아웃 & 구조)

- **Grid System**: 8px 기준 그리드 시스템 사용
- **Popup Dimensions**: 240×160px (기본), 최대 280px (고해상도 디스플레이)
- **Spacing**: 16px (large), 12px (medium), 8px (small), 4px (tight)
- **Border Radius**: 4px (컨테이너), 6px (버튼)
- **Shadow**: 0 2px 8px rgba(0, 0, 0, 0.1) (팝업)
- **Overlay Position**: 화면 우상단, 16px margin
- **Padding**: 16px (팝업 내부), 12px (버튼), 8px (인풋 필드)

## 6. Visual Style (비주얼 스타일)

- **Icon Style**: Feather 또는 Heroicons Solid 스타일의 라인 아이콘
- **Icon Stroke Width**: 2px
- **Icon Colors**: #1F6FEB (활성), #8A8F98 (비활성)
- **Icon Sizes**: 16×16px (인터페이스), 128×128px (Chrome 스토어)
- **Image Treatment**: SVG 형식 우선 사용
- **Illustration Style**: 미니멀하고 기하학적인 형태
- **Asset Variants**: 16×16, 32×32, 48×48, 128×128px

## 7. UX Guide (UX 가이드)

- **Target Users**: 전문가와 초보자 모두 고려
- **Expert Users**: 즉시 사용 가능한 키보드 단축키 제공
- **Beginner Users**: 첫 실행 시 툴팁과 튜토리얼 링크 제공
- **Information Architecture**: 고급 옵션은 기본적으로 숨김 처리
- **Interaction Pattern**: 키보드 우선, 마우스 보조
- **Feedback Strategy**: 시각적 오버레이로 즉각적인 피드백 제공
- **Error Prevention**: 명확한 레이블과 안내 메시지
- **Accessibility**: 키보드 네비게이션 완전 지원, 스크린 리더 호환

## 8. UI Component Guide (UI 컴포넌트 가이드)

### 8.1 팝업 카드 (Popup Card)
- **Size**: 240×160px
- **Background**: #F5F7FA
- **Border Radius**: 8px
- **Shadow**: 0 4px 12px rgba(0, 0, 0, 0.15)
- **Padding**: 16px
- **Title**: "선호 속도" (16px, Weight 600, #1A1A1A)

### 8.2 숫자 입력 필드 (Numeric Input)
- **Width**: 120px
- **Height**: 36px
- **Border**: 1px solid #E3E6EA
- **Border Radius**: 4px
- **Focus State**: 2px outline #FFD64D
- **Step**: 0.1
- **Font**: 14px, Weight 400

### 8.3 버튼 (Buttons)
- **Primary Button**:
  - Background: #1F6FEB
  - Color: #FFFFFF
  - Height: 36px
  - Padding: 12px 16px
  - Border Radius: 6px
  - Hover: #1557C7
- **Secondary Button**:
  - Background: transparent
  - Border: 1px solid #E3E6EA
  - Color: #1A1A1A
  - Hover: #F5F7FA

### 8.4 오버레이 배지 (Overlay Badge)
- **Background**: #1E3A5F (80% 투명도)
- **Color**: #FFFFFF
- **Font**: 14px, Weight 700
- **Padding**: 8px 12px
- **Border Radius**: 4px
- **Animation**: 150ms ease-out fade
- **Duration**: 1.2초 후 자동 숨김

### 8.5 아코디언 (Accordion)
- **Header**: 14px, Weight 500, #1A1A1A
- **Icon**: 16×16px 화살표
- **Padding**: 12px 0
- **Border**: 1px solid #E3E6EA (하단)
- **Animation**: 200ms ease-in-out

### 8.6 툴팁 (Tooltip)
- **Size**: 300×200px
- **Background**: #FFFFFF
- **Border**: 1px solid #E3E6EA
- **Border Radius**: 8px
- **Shadow**: 0 8px 24px rgba(0, 0, 0, 0.12)
- **Arrow**: 8px triangle pointing to target

### 8.7 포커스 링 (Focus Ring)
- **Color**: #FFD64D
- **Width**: 2px
- **Style**: solid outline
- **Offset**: 2px

### 8.8 상태 표시 (Status Indicators)
- **Success**: #22C55E
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Info**: #3B82F6

### 8.9 모션 및 전환 (Motion & Transitions)
- **Overlay Fade**: 150ms ease-out
- **Button Hover**: 100ms ease-in-out
- **Focus Transition**: 100ms ease-in-out
- **Accordion Expand**: 200ms ease-in-out

### 8.10 반응형 규칙 (Responsive Rules)
- **High DPI**: 최대 너비 280px
- **Device Pixel Ratio**: 오버레이 크기 자동 조정
- **Minimum Touch Target**: 44×44px (모바일 고려)