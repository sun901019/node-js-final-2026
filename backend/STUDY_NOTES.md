# 最終任務 學習筆記（2026-08-23 補齊紀錄）

這份筆記記錄：哪些是「你寫錯的」、哪些是「你沒寫到的」、以及整個後端的**資料流**。
程式碼裡也都有對應的行內註解：`❌【原本寫錯】` 和 `✚【原本缺少，補上】`。

驗收結果：`npm test` → **68 passed / 68 total**（本機開發模式與容器化模式都通過）。

---

## 一、你「寫錯」的地方（共 8 處）

| # | 檔案 | 錯誤 | 為什麼會炸 |
|---|------|------|-----------|
| 1 | `routes/users.js` | `require("../controllers/user")` | 檔名是 `users.js`（多個 s），啟動瞬間 Cannot find module 崩潰 |
| 2 | `routes/users.js` | `"/singup"` 拼錯 | 路由逐字比對，測試打 `/signup` 永遠 404 |
| 3 | `routes/users.js` | `route.get(...)` | 變數叫 `router`，ReferenceError 崩潰 |
| 4 | `controllers/users.js` | 檔案結尾**忘了 `module.exports`** | require 進來是空物件 `{}`，掛路由時 callback 是 undefined 直接報錯 |
| 5 | `controllers/users.js` signup | 密碼規則檢查寫成 `isValidString`（且 validUtils 根本沒有 `isValidPassword`） | import 不存在的函式 = undefined，一呼叫就 TypeError |
| 6 | `controllers/users.js` login/profile | login 驗證了不存在的 `name` 欄位、沒比對密碼、沒發 JWT；profile 從 GET 的 body 讀資料 | login body 只有 email/password；GET 沒有 body，「我是誰」要從 `req.user` 拿 |
| 7 | `controllers/skill.js` | 「欄位**為**填寫正確」錯字 | 應為「欄位**未**填寫正確」（訊息是給前端/使用者看的，要跟 Swagger 一致） |
| 8 | `app.js` + `bin/www.js` | 兩邊都寫了 `initialize()+listen()` | 用 www.js 啟動會 initialize 兩次直接丟錯。分工：app.js 只「定義」、www.js 負責「啟動」，scripts 已改指向 `./bin/www.js` |

風格修正（不算 bug 但已對齊課程 week9 範例）：
- `entities/Skill.js` 的 `name` 原本 `unique:false` → 規格要 unique（資料庫當最後防線，擋併發重複）
- `User/Coach/Skill` 的 `createdAt/updatedAt` → 改 `created_at/updated_at`（snake_case，跟其他表一致，M6 原生 SQL 也才好寫）

## 二、你「沒完成、已補上」的部分

- **Entities（5 個）**：`CreditPackage`、`CoachLinkSkill`、`Course`、`CreditPurchase`、`CourseBooking`，並全部註冊進 `db/data-source.js`
- **Middlewares（整個資料夾）**：`isAuth.js`（驗 JWT → 查 DB → `req.user`）、`isCoach.js`（驗 role）
- **Controllers**：`creditPackage.js`（原本是空檔案！route 已引用它，一掛載就會崩）、`coaches.js`（M4）、`courses.js`（M4+M5）、`adminCoaches.js`（M3）、`adminCourses.js`（M3）、`adminRevenue.js`（M6）；`users.js` 補 `updateProfile`、`updatePassword`、`getCreditPackage`、`getCourses`
- **Routes**：`coaches.js`、`courses.js`、`adminCoaches.js`、`adminCourses.js`、`adminRevenue.js`；`users.js`、`creditPackage.js` 補齊缺的路由
- **app.js**：掛載全部 8 組路由（含順序邏輯，見下）
- **容器化**：`Dockerfile`、`.dockerignore`、`docker-compose.yml` 的 backend 服務

## 三、啟動時「誰先誰後」（模組載入順序）

執行 `npm start`（= `node ./bin/www.js`）後：

```
bin/www.js
 └─ require('../app')                ← app.js 開始執行
     ├─ require('./db/data-source')
     │   ├─ require('../config')     ← config/index.js 第一行 dotenv.config()
     │   │                              把 .env 讀進 process.env（所有設定的源頭！）
     │   └─ new DataSource({...})    ← 讀入 8 個 entities/*.js 的表定義（此時還沒連線）
     ├─ require('./routes/*')        ← 每個 route 檔又 require 對應的 controller 和 middleware
     ├─ app.use(...) 依序掛上：cors → json 解析 → healthcheck → 8 組路由 → 404 → 錯誤處理
     └─ module.exports = app         ← 回到 www.js
 ├─ await dataSource.initialize()    ← 這時才真正連上 PostgreSQL；
 │                                      synchronize:true 比對 Entity ↔ 資料庫，自動建表
 └─ app.listen(8080)                 ← DB 就緒「之後」才開門收請求（M0 的要求）
```

關鍵觀念：**require 只是把定義載入記憶體，「連線」發生在 initialize()、「收請求」發生在 listen()**。
所以 healthcheck 能保證：它回 200 時資料庫一定活著。

## 四、一個請求進來「怎麼跑」（以最複雜的報名課程為例）

`POST /api/courses/:courseId`（會員按下「報名」）：

```
瀏覽器（前端 localhost:3000）
  │  fetch POST http://127.0.0.1:8080/api/courses/abc-123
  │  header: Authorization: Bearer <token>
  ▼
app.js：cors() 放行跨網域 → express.json() 把 body 解析成 req.body
  ▼
路由比對（按掛載順序）：/api/coaches/skill ✗ → /api/coaches ✗ → /api/users ✗
  → /api/credit-package ✗ → /api/courses ✓ 進入 routes/courses.js
  → router.post("/:courseId", isAuth, createBooking) 比對成功，courseId="abc-123"
  ▼
middlewares/isAuth.js（controller 之前先跑）
  1. 取出 Bearer token → 沒有就 next(appError(401,"請先登入")) 直接跳去錯誤處理
  2. jwt.verify(token, JWT_SECRET) → 驗簽章 + 過期
  3. 拿 payload.id 查 users 表 → req.user = 完整使用者 → next() 放行
  ▼
controllers/courses.js createBooking（四道檢查，順序是合約）
  ① courses 表查 id           → 查無 → "ID錯誤"
  ② course_bookings 查(user_id, course_id)【含已取消】→ 有 → "已經報名過此課程"
  ③ credit_purchases 加總堂數 − 未取消報名數 ≤ 0      → "已無可使用堂數"
  ④ 這堂課未取消報名數 ≥ max_participants             → "已達最大參加人數，無法參加"
  全過 → bookingRepo.save(...)  ← INSERT，created_at 由 DB 自動填（M6 靠它算月份）
  ▼
res.status(201).json({status:"success", data:null}) → 回到瀏覽器
（任何一關 next(appError(...)) → 直接跳到 app.js 最後的錯誤處理 middleware 統一回 JSON）
```

## 五、幾個核心設計的「為什麼」

1. **剩餘堂數沒有欄位**：`remain = Σ購買堂數 − 未取消報名數`，即時計算。
   好處：取消報名時堂數「自動歸還」，不用寫「加回去」的程式，也永遠不會加錯。
2. **取消是軟刪除**（標 `cancelled_at`，不刪紀錄）：
   紀錄留著 → 才能擋「取消過的課再報名」（檢查 ② 故意不過濾 cancelled_at）。
3. **快照欄位**：購買時把方案的 `credit_amount/price` 複製進 `credit_purchases`。
   方案日後改價或刪除，歷史訂單金額不受影響。
4. **M6 用原生 SQL**：TypeORM 的 `find()` 寫不出 `EXTRACT(MONTH FROM ...)`；
   `$1/$2/$3` 參數化查詢防 SQL injection。`floor` 必須在「乘完之後」才做。
5. **路由順序**：具體路徑先掛、`:param` 後掛。
   `/api/admin/coaches/courses` 若掛在 `/api/admin/coaches` 之後，"courses" 會被 `POST /:userId` 當成 userId 吃掉。
6. **isAuth 查 DB**（week9 課程版）：token 合法但帳號已刪除也擋得住；
   controller 直接用 `req.user.name/email`，不用重查。

## 六、⚠️ 你這台電腦的特殊環境問題（跟作業無關，但會害你連不上資料庫）

你的 Windows 本機裝了**兩個 PostgreSQL 服務**（`postgresql-x64-17` 佔 5432、`postgresql-x64-18` 佔 5433）。
後端連 `localhost:5432` 時，其實連到「本機那顆」而不是 Docker 的 → 報 `password authentication failed for user "student"`。

目前的解法（完全可逆）：
- 根目錄新增 `docker-compose.override.yml`：讓 Docker 的 postgres 多開 **15432** 對外埠
- `backend/.env` 的 `DB_PORT` 暫時改成 **15432**

如果之後想恢復標準的 5432（擇一）：
1. 用系統管理員身分停用本機服務：`services.msc` → 停止並停用 postgresql-x64-17 / 18，
   然後刪掉 `docker-compose.override.yml`、把 `.env` 的 `DB_PORT` 改回 5432
2. 或維持現狀（CI / GitHub Actions 不受影響——容器內部走 `postgres:5432`，跟你本機的埠無關）

注意：`docker-compose.override.yml` 是本機用的，**不建議 push**（可加進 .gitignore 或 push 前留意）。

## 七、繳交前檢查清單

- [x] `npm test` → 68 passed（本機 + 容器化都驗過）
- [x] `docker compose up -d --build backend postgres` + `npm run test:smoke` → 4 passed
- [ ] `git add backend/ docker-compose.yml` 後 commit + push（確認 `.env` 沒被加進去——根目錄 .gitignore 已擋）
- [ ] push 後到 GitHub Repo 的 Actions 分頁看 7 個 job 全綠
