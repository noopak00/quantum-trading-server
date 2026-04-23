# 🚀 QUANTUM TRADER 실시간 배포 가이드

## 📋 준비물
- GitHub 계정 (무료)
- Render 계정 (무료)

---

## 🔧 Step 1: GitHub에 코드 업로드

### 1.1 GitHub 저장소 생성
1. https://github.com/new 방문
2. Repository name: `quantum-trading-server` 입력
3. "Create repository" 클릭

### 1.2 코드 업로드 (Git 초심자용)
```bash
# 폴더 생성
mkdir quantum-trading-server
cd quantum-trading-server

# Git 초기화
git init
git add .
git commit -m "Initial quantum trading backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quantum-trading-server.git
git push -u origin main
```

**또는** GitHub 웹 사이트에서 직접 파일 업로드:
1. 저장소 페이지에서 "Add file" → "Upload files"
2. 다음 3개 파일 업로드:
   - `server.js`
   - `package.json`
   - `.gitignore` (아래 참고)

### .gitignore 생성 (선택사항)
```
node_modules/
.env
.DS_Store
```

---

## 🌐 Step 2: Render에 배포

### 2.1 Render 계정 생성
1. https://render.com 방문
2. GitHub로 회원가입
3. GitHub 계정 연결 승인

### 2.2 새 서비스 생성
1. Render 대시보드에서 "New +" → "Web Service"
2. "Connect a repository" 클릭
3. `quantum-trading-server` 저장소 선택

### 2.3 설정
| 설정항목 | 값 |
|---------|-----|
| **Name** | `quantum-trading-server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Region** | `Singapore` (한국 가까움) |
| **Plan** | Free (무료) |

4. "Create Web Service" 클릭
5. **배포 시작** (2-3분 소요)

### 2.4 배포 확인
- 상태가 "Live" 표시되면 완료
- URL 확인: `https://quantum-trading-server.onrender.com`

---

## 🔌 Step 3: 프론트엔드 연결

### 3.1 코드 수정
`index.html`에서 다음 줄을 찾아 수정:

**변경 전:**
```javascript
const BACKEND_URL = 'http://localhost:3000';
```

**변경 후:**
```javascript
const BACKEND_URL = 'https://quantum-trading-server.onrender.com';
```
(Render에서 생성된 URL로 바꾸기)

### 3.2 프론트엔드 호스팅 (선택: Netlify)
1. https://netlify.com 방문
2. GitHub 연결
3. `index.html` 드래그 앤 드롭 또는 GitHub 저장소 연결

---

## ✅ 테스트

### 로컬 테스트 (배포 전)
```bash
# Node.js 설치 확인
node --version

# 의존성 설치
npm install

# 서버 실행
npm start

# 브라우저에서 열기
http://localhost:3000/api/status
```

### 배포 후 테스트
```
https://quantum-trading-server.onrender.com/api/status
```

결과 예:
```json
{"status":"Server is running","timestamp":"2024-04-23T..."}
```

---

## 📊 API 엔드포인트

### 한국 주식
```
GET /api/stock/kr/:code
예: /api/stock/kr/삼성전자
```

### 미국 주식
```
GET /api/stock/us/:ticker
예: /api/stock/us/AAPL
```

### 분석 실행
```
POST /api/analyze
Body: {
  "prices": [...],
  "strategy": "momentum|mean_revert|breakout|quantum",
  "risk": "low|mid|high"
}
```

---

## 🔧 문제 해결

### 1️⃣ 405 Method Not Allowed
- CORS 설정 확인
- `server.js`의 `app.use(cors());` 있는지 확인

### 2️⃣ 데이터 로드 안 됨
- Render 로그 확인: Dashboard → "Logs"
- API 레이트 제한 (Alpha Vantage 데모 키 사용 중)
- 실제 API 키 필요 시 `.env` 설정

### 3️⃣ 항상 오프라인 상태
- Render 서버가 절전 상태일 수 있음 (첫 요청 시 10초 대기)
- 프리 플랜의 특성

---

## 💡 개선 사항

### API 키 추가 (선택사항)
Alpha Vantage 실제 키로 더 많은 요청 가능:

1. https://www.alphavantage.co/api-key/ 에서 무료 키 발급
2. `server.js` 수정:
   ```javascript
   const apiKey = process.env.ALPHA_VANTAGE_KEY || 'demo';
   ```
3. Render Dashboard → Environment 에서 변수 추가

---

## 🎯 최종 체크리스트

- [ ] GitHub에 코드 업로드됨
- [ ] Render에서 배포 완료
- [ ] 서버 상태 "Live"
- [ ] `/api/status` 응답 확인
- [ ] `index.html`의 BACKEND_URL 수정됨
- [ ] 프론트엔드에서 분석 버튼 작동

---

**모든 단계 완료 시 실시간 트레이딩 분석기가 작동합니다!** 🚀
