# 세션 히스토리 — 디자인 PDF 접근 복구

- **날짜:** 2026-09-21 (문서 정리: 2026-09-23)
- **세션 ID:** `db297e28-0ecb-4589-98a1-ef84d2809ad0`
- **시작 시점 저장소 상태:** `main` / `6160c21 init`, 작업 파일 전체가 untracked
- **요청:** "먼저번에 제공한 pdf 파일에 엑세스가 있니?" → "downloads 봐바" → "다시해봐"
- **결과:** 접근 복구 성공. 44페이지 디자인 덱 전체를 읽을 수 있는 상태가 됨
- **저장소 코드 변경:** 없음 (이 세션은 조사·읽기·메모리 기록만 수행)

---

## 1. 타임라인

| # | 내용 | 결과 |
|---|---|---|
| 1 | 이전 대화 컨텍스트 및 프로젝트 내 PDF 검색 | 없음 (새 세션, 프로젝트에 PDF 부재) |
| 2 | `~/Downloads`, `~/Desktop` 확인 | **오답 보고** (아래 2절) |
| 3 | 사용자 재확인 요청 → 디렉터리 직접 조회 | `Operation not permitted` — 권한 문제 판명 |
| 4 | 샌드박스 해제 후 재시도 | 동일 실패 → OS 레벨(TCC) 확정 |
| 5 | 차단 주체 및 접근 가능 경로 진단 | Orca.app 권한 미부여 확인 |
| 6 | 사용자가 권한 부여 → 재시도 | 목록 조회 성공, PDF 발견 |
| 7 | PDF 직접 읽기 | 100MB 한도 초과로 실패 |
| 8 | `pdftoppm` 렌더링 우회 | 성공, 전체 페이지 열람 가능 |
| 9 | 메모리 2건 기록 | 재발 방지 |

---

## 2. 기록해 둘 실수

2단계에서 "Downloads에 PDF가 없다"고 보고했으나 **사실과 달랐다.**

원인은 zsh에서 `ls ~/Downloads/*.pdf` 형태의 글로브가 권한 거부 시 `no matches found`를 반환하는 것으로, 이것이 "파일 없음"과 구분되지 않는다는 점이다.

> **교훈:** 파일 부재를 단정하기 전에 `ls -ld <디렉터리>`로 디렉터리 자체의 접근 가능 여부를 먼저 확인할 것.

---

## 3. 장애물 1 — macOS TCC 폴더 권한

`~/Downloads`는 존재했고(`drwx------+`, 당일 20:05 수정) 내용물도 있었으나 읽기가 차단된 상태였다.

- 차단 주체: **Orca.app** (`TERM_PROGRAM=Orca`)
- 프로세스 체인: `Orca.app` → `Orca Helper` → `login` → `zsh` → `claude`
- Bash 샌드박스를 해제해도 동일 → Claude Code 샌드박스가 아닌 **OS 레벨 차단**
- Read 도구도 `EPERM: operation not permitted`

| 경로 | 당시 상태 |
|---|---|
| `~/Downloads` | 차단 → 권한 부여 후 해제 |
| `~/Documents` | 차단 |
| `~/Desktop` | 차단 |
| `~/Pictures` | 읽기 가능 |
| `/tmp`, 프로젝트 폴더 | 읽기 가능 |

**해결:** 시스템 설정 → 개인정보 보호 및 보안 → 파일 및 폴더(또는 전체 디스크 접근 권한)에서 Orca 허용.

---

## 4. 장애물 2 — 100MB 텍스트 추출 한도

권한 통과 후 발견한 파일들:

| 파일 | 크기 | 수정일 |
|---|---|---|
| `new web ongoing.pdf` | 140,654,596 B (≈140MB) | 2026-09-16 14:48 |
| `재요청_할게.mp4` | 2,677,745 B | 2026-09-16 14:48 |
| `26Q3 Web sync.docx` | 7,277 B | 2026-09-21 20:05 |

PDF 사양: 44페이지, 1366×768, PDF 1.4, 제목 `new web ongoing`.

Read 도구는 `PDF file exceeds maximum allowed size for text extraction (100MB)`로 실패했고, 이는 `pages` 옵션과 무관하게 발생한다.

**사용 가능 도구:** `pdfseparate`, `pdftoppm`, `pdftotext`, `sips`, `python3`(pypdf 미설치)
**미설치:** `qpdf`, `gs`, `mutool`, `pdftk`

### 우회 방법 (검증 완료)

```bash
# 44페이지 → JPEG, 각 ~14KB, 총 1.2MB, 소요 1.89초
pdftoppm -jpeg -jpegopt quality=72 -scale-to-x 1200 -scale-to-y -1 \
  ~/Downloads/"new web ongoing.pdf" pg
```

렌더 산출물은 세션 스크래치패드에 생성되어 **영구 보존되지 않는다.** 필요 시 위 명령을 재실행할 것.

텍스트 레이어는 크기 제한 없이 직접 추출 가능하며, 이미지로 컨텍스트를 소모하지 않는 가장 경제적인 방법이다:

```bash
pdftotext -layout ~/Downloads/"new web ongoing.pdf" -
```

---

## 5. 확인한 덱 내용

**제품:** SOL — "Physical AI Hub for Your Smart Home"
**가격:** $380 프리오더 / **태그라인:** "For a Zero Demand, Ambient Automation" / **브랜드 라인:** "Elevating the Art of Living"

덱 네비게이션이 저장소 파일과 1:1로 일치한다:
`DEVICE` · `LIBRARY` · `WIKI` · `CAREERS` · `ORDER` → `device.html`, `library.html`, `wiki.html`, `careers.html`, `order.html`

육안 확인한 페이지:

- **p.1** — 검은 화면 중앙의 작은 민트색 점 하나 (인트로 애니메이션 시작 프레임)
- **p.20** — ORDER 상세: Full Automation / Remote mode 그리드, 컬러칩 3종(Glow Green·Light Grey·Black), "Glow Green Sold Out → Order Light Grey Instead", 하단 Utility/AI/Design/Spec 탭
- **p.40** — "WHEN TECHNOLOGY MEETS CRAFTSMANSHIP", 듀얼 렌즈 제품 투명 렌더

텍스트 레이어에서 확인된 그 외 구성: FAQ 아코디언(8문항), SHIPPING 폼(US Deliveries Start 2027 → Proceed to Payment), DUAL LENSES(200° 화각 / 25MP), THINK of NEXT, ACC 제품군, LAYERS/채용 섹션.

**플레이스홀더 잔존:** `blah blah blah`, `adfs adfdfs`, `ABCD`

---

## 6. 동반 피드백 문서

`~/Downloads/26Q3 Web sync.docx` (2026-09-18) 내용 — 이 PDF에 대한 리뷰다.

**Feedbacks**
- "Elevating the art of living"은 애니메이션이 있는 한 페이지 전체로 처리한 뒤 실제 페이지로 전환
- Sorcerics 로고 z-depth
- 프레임 단위 애니메이션이 너무 급하게 멈춤
- 모바일 스크롤 시 애니메이션이 너무 빠름
- 수직 이동 컴포넌트 검토

**TODOs**
- 디자이너와 그룹 채팅
- 제공된 PDF가 최종 디자인을 어느 정도 담고 있는지 확인
- Shopify vs Stripe
- 첫 로고 → 비디오 전환 디자인 수정

---

## 7. 기록한 메모리

| 파일 | 내용 |
|---|---|
| `sorcerics-design-deck.md` | 덱 위치, 제품 개요, 저장소 페이지 대응 관계, 피드백 문서 요약 |
| `large-pdf-read-workaround.md` | Orca 권한 문제, 글로브 함정, 100MB 한도, `pdftoppm` 우회 명령 |

`MEMORY.md` 인덱스에 두 항목 추가.

---

## 8. 이 세션 범위 밖의 후속 작업

아래는 **다른 세션(`21a3e8c1-bf38-4ae4-877a-f8116751836c`)의 작업**으로, 이 세션에서 수행한 것이 아니다. 같은 날 이 세션 이후에 진행되었으며, 전체 맥락 파악을 위해 포인터만 남긴다.

- `sorcerics-deck-unit-layout` — 덱 좌표 단위 시스템(`--u = 100vw/1366`), PyMuPDF 실측, 덱에서 추출한 워드마크·제품 렌더
- `sorcerics-feedback-status` — 피드백 1·2차 반영 현황(덱 화살표, DEVICE 1/2 비교 페이지, 라이브러리 검색, 플레이스홀더 취소선). 모바일 스크롤 속도는 의도적 보류, Shopify vs Stripe·프레임 정지·수직 컴포넌트는 미해결
- `sorcerics-deploy-github-pages` — 프로덕션은 Vultr `sol-web` (http://158.247.214.3/, nginx, `/var/www/html`, `scripts/deploy.sh`). GitHub Pages 사본은 2026-09-21의 실수로 같은 날 삭제됨

정확한 현황은 각 메모리 파일과 `git log`를 참조할 것. 후속 세션의 상세 이력(프로젝트 시작일부터의 타임라인 포함)은 [session-2026-09-21-site-rebuild.md](session-2026-09-21-site-rebuild.md)에 있다.
