# 팡뮤제&짙은 채용 설문

900개 원문 질문을 사용하는 모바일 대응 채용 설문 앱입니다.

## 구성
- Vercel Node.js Function: 화면, 동일 출처 API, HttpOnly 관리자 세션
- Supabase Edge Function: 원문 기반 서버 검증, Supabase Auth 관리자 확인
- Supabase PostgreSQL: 지원서와 확인 기록 영속 저장
- 관리자 이메일: `dolmong@yview.co.kr`

## 실행과 검증
Node.js 22 이상에서 `npm run build`, `npm test`를 실행합니다. 패키지 의존성은 없습니다.
Vercel 환경 변수 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`를 설정합니다. 공개용 키만 사용하며 서비스 역할 키는 저장소와 Vercel에 넣지 않습니다. 서비스 역할 키는 Supabase Edge 런타임이 제공합니다.

## 최초 관리자 설정
Supabase 대시보드 → Authentication → Users → Add user → Create new user에서 `dolmong@yview.co.kr` 계정을 생성합니다. 본인이 비밀번호를 입력하고 이메일 확인 상태를 설정합니다. 앱 `/admin`에서 그 이메일과 비밀번호로 로그인합니다. GitHub/Supabase 대시보드 로그인과 앱 관리자 계정은 별개입니다.

## 데이터와 권한
`hiring_submissions` 원본은 수정하지 않으며 UUID 중복 제출은 `ON CONFLICT DO NOTHING`으로 처리합니다. `hiring_reviews`에 확인 상태를 별도 기록합니다. 두 테이블에 RLS를 활성화하고 anon/authenticated의 직접 접근을 금지했습니다. Edge Function이 검증된 관리자에 한해 조회·집계·확인을 수행합니다. 클라이언트나 프록시 헤더의 이메일을 신뢰하지 않습니다.

## 배포
GitHub 저장소를 Vercel 프로젝트에 연결하고 `main`을 배포합니다. 빌드 명령은 `npm run build`, output은 `public`, Node.js는 22입니다. Edge Function은 `supabase/functions/hiring-api`의 파일 전체를 Supabase에 배포합니다. `verify_jwt=false`는 익명 지원자 제출을 허용하기 위한 설정이며, 관리자 작업은 함수 내부에서 Supabase Auth 서버로 토큰을 재검증합니다.

`supabase/schema.sql`은 최초 스키마의 보관본입니다. 이미 생성된 테이블에 반복 실행하지 마세요. 기존 Sites의 지원자 데이터는 새 DB로 자동 복사하지 않았습니다.

비밀번호·토큰·지원자 데이터·로컬 환경 파일은 GitHub에 올리지 않습니다.
