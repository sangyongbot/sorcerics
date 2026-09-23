# 작업 히스토리 — SOL 웹사이트 (sorcerics)

시각은 한국 시간(KST) 기준. 프로덕션: http://158.247.214.3/ · 소스: https://github.com/sangyongbot/sorcerics

---

## 2026-09-11 (목) — 프로젝트 시작: 스크롤 스크럽 랜딩 POC

**요청** 제공한 영상(`.superset/attachments/…3.mp4`, 1280×720 · 24fps · 10초)을 scoutmotors.com처럼 스크롤 방향에 따라 재생/역재생되는 패럴랙스 스크롤 히어로로 만들 것. 영상을 그대로 쓰지 않고 프레임으로 슬라이스해도 됨.

**진행**
- 레포 초기화(`init` 커밋 22:07). scoutmotors.com 구현 방식 분석: GSAP ScrollTrigger + Lenis, `<video>`가 아니라 이미지 시퀀스를 캔버스에 그리는 스크럽.
- 설계 문서 `docs/superpowers/specs/2026-09-11-scroll-scrub-landing-design.md`.
- 영상을 프레임 시퀀스로 슬라이스(`scripts/slice.sh`), `index.html` / `styles.css` / `main.js` 첫 빌드: 프리로더, 스크롤 스크럽 히어로(pin), 진행도에 맞춘 오버레이 카피, 패럴랙스 섹션 2개.
- 같은 날 성능·안정성 개선(스펙 Revision): JPG 240프레임 → WebP 120프레임(1152px) + 모바일용 640px 세트, 점진 로딩(첫 프레임 즉시 표시), 개발 서버 `scripts/serve.mjs`(keep-alive, WebP MIME), CDP 검증 스크립트, iOS 대응(100svh, 툴바 리사이즈 무시), 접근성 보강.
- 사용자 휴대폰 캡처로 모바일 동작 확인.

## 2026-09-16 (화) — 시안 기반 다중 페이지 1차 구성 + Vultr 배포

**요청** 디자이너 시안 `new web ongoing.pdf`(44p, 1366×768pt)를 보고 최대한 비슷하게 다시 구성. 9/11 통화(Impromptu Call) 녹취 공유.

**진행**
- 페이지 추가: `device.html`(FUTURE IS HERE, 회전 스크럽, Think of Next, Be Everywhere, Atmosphere, Craftsmanship), `order.html`(구매 + FAQ + 스펙, Light Grey 1종), `library.html`, `wiki.html`, `careers.html`. 공통 nav(SOL / 세로 메뉴 / sorcerics), 홈에 별·문구가 커지는 스크롤 인트로와 제품 소개·커뮤니티 섹션.
- 제품 이미지 `product/*.webp` 추가. 스카우트식 스크롤 경험 검증이 우선이라 나머지 페이지는 임시 구성.
- **배포** Vultr 접근 권한·비용 확인 후 VPS 배포: `sol-web`(158.247.214.3, Ubuntu, nginx, `/var/www/html`). 이 버전이 9/18 미팅에서 리뷰됨.

## 2026-09-18 (금) — Sorcerics 웹 싱크 미팅 (작업 없음)

피드백 수집: 인트로는 스크롤이 아니라 자동 재생 후 영상으로, 로고 z-index(특히 모바일), 프레임 단위 끊김과 모바일 속도, 세로 스크롤 vs 가로 영상 움직임의 진행 체감, 검정 화면이 커튼처럼 걷히는 리빌, 디바이스 페이지의 시안 반영, 제품 색상 1종, 악세사리 칸, 결제 방식(Shopify/Stripe) 미결, 외주 영상·렌더 일정(10월 초). 정리본은 `26Q3 Web sync.docx`.

## 2026-09-21 (월) — 시안 정렬 재구축과 피드백 반영

**준비(20:00경)** 140MB 시안 PDF 접근 문제 해결(Orca 폴더 권한, `pdftoppm` 렌더) 및 메모리 기록.

**본 작업(21:23 ~ 23:58 커밋)**
- 시안 44p 측정(PyMuPDF: 글자 크기·좌표·이미지 박스·도형) → 시안 1pt = `--u = 100vw/1366` 단위계로 전면 재구축. 시안 서체 Satoshi 셀프호스팅, SOL/sorcerics 워드마크 벡터와 제품 렌더를 PDF에서 직접 추출.
- 홈: 자동 재생 로고 인트로(시안 1–6p) → 화면 중앙 메뉴 → 스크롤 시 상단 고정, 검정 커버가 커튼처럼 걷히고 그 뒤에 이미 자리 잡은 sticky 필름이 스크럽(scoutmotors 구조), 제품 소개, Layers.
- nav를 최상위 z-index 티어(1100)로, `<main>` 격리.
- 디바이스(24–41p) · 오더(15–22p, SOL/ACC, 배송 폼) · 라이브러리(42–44p) · 위키/커리어 재구성.
- 배포: GitHub Pages에 올렸다가 기존 Vultr 서버 확인 후 Vultr로 재배포, `scripts/deploy.sh`(백업 → rsync → 스모크 체크) 추가, GitHub Pages 삭제. 위키/커리어/오더의 여분 스크롤 제거.
- 2차: 시안 11–13p 화살표(제품 소개 3화면 고정, ORDER → DEVICE 순으로 시작점부터 그려짐), DEVICE 1 / DEVICE 2 비교(2 = 고정 스테이지 패럴랙스), 라이브러리 검색 애니메이션(43p, 검은 언더바), 임시 시나리오 문구 취소선, 모바일 라이브러리 재생 오버레이 버그 수정.
- Device 2 구도를 뷰포트 세로 중앙에 배치. 고객 리포트 `docs/report-2026-09-21.md` 작성 후 전/후 비교 형식으로 재작성.
- 3차: 영상 24fps 240프레임 재추출 + 스크럽 스무딩, 인트로 약 3초로 단축, HOME 1 / HOME 2(세로 진행 단서: 영상 상향 드리프트·캡션 슬라이드·우측 진행 트랙), 캡션이 워드마크와 겹치던 문제 수정.

## 2026-09-22 (화) — 캡션 타이밍과 모바일 대응 (09:02 ~ 14:01 커밋)

- HOME 2 캡션을 장면 앞뒤로만 짧게 슬라이드하도록 조정. 커튼이 완전히 걷힌 뒤(진행 25%) 시작하도록 HOME 1/2 모두 조정.
- 터치 기기에서 영상 구간 스크롤 길이 2배(4 → 8화면).
- 모바일 전수조사(360/390/430px, 9개 화면): 원형 사진 크롭 백분율화, 민트 베일이 원 밖으로 번지던 문제, 상단 메뉴가 sorcerics와 겹치던 문제(메뉴 열을 로고 행 아래로), 콘텐츠 상단 여백 확대, 오더 스테이지가 활성 탭에 맞춰 늘어나도록 수정.
- 모바일 사파리에서 툴바가 접힐 때 하단 검은 띠: 고정 미디어는 큰 뷰포트(`100vh`), 페이지 맞춤 섹션과 인트로 중앙 정렬은 작은 뷰포트(`100svh`)로 분리.
- 고객 리포트 최신화.

---

## 현재 상태 (2026-09-23)

- 프로덕션: Vultr `sol-web` http://158.247.214.3/ (배포 `bash scripts/deploy.sh`). 도메인·HTTPS 미연결.
- 비교 대기: HOME 1 / HOME 2, DEVICE 1 / DEVICE 2.
- 미결: 결제 방식(Shopify/Stripe), 임시 문구(취소선) 확정, 외주 메인 영상·디바이스 렌더 수급(10월 초 예정) 후 교체.
- 문서: 고객 리포트 `docs/report-2026-09-21.md`, 설계 노트 `docs/superpowers/specs/`.
- 검증 도구: `scripts/shoot.mjs`, `scripts/shoot2.mjs`(Playwright 스크린샷·콘솔 에러), 모바일 점검 스크립트는 세션 스크래치에서 실행.
