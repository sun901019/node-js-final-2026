const express = require("express");
const cors = require("cors");
const { dataSource } = require("./db/data-source");
const appError = require("./utils/appError");
// 路由們（require 的瞬間，該檔案的程式碼就會執行一次並回傳 router 物件）
const skillRouter = require("./routes/skill");
const usersRouter = require("./routes/users");
// ✚【原本缺少，補上】其餘六組路由
const creditPackageRouter = require("./routes/creditPackage");
const coachesRouter = require("./routes/coaches");
const coursesRouter = require("./routes/courses");
const adminCoachesRouter = require("./routes/adminCoaches");
const adminCoursesRouter = require("./routes/adminCourses");
const adminRevenueRouter = require("./routes/adminRevenue");

const app = express();
app.use(cors()); // W3：前端在 3000、我們在 8080，沒它前端全被擋
app.use(express.json()); // 把請求的 JSON body 解析成 req.body（沒它 req.body 是 undefined）

// M0：健康檢查——回純文字 OK，不是 JSON；路徑不在 /api 底下
app.get("/healthcheck", async (req, res, next) => {
    try {
        await dataSource.query("SELECT 1"); // 連線測試：資料庫沒就緒就不能說自己 OK
        res.status(200).send("OK");
    } catch (err) {
        res.status(503).send("Service Unavailable");
    }
});

// ============ 掛載路由 ============
// ⚠️ Express 按「註冊順序」逐一比對，具體路徑先掛、含 :param 的後掛：
// 1. /api/coaches/skill 要在 /api/coaches 前面 —— 反過來的話，
//    GET /api/coaches/skill 會先命中 /api/coaches 底下的 /:coachId，"skill" 被當成 coachId
// 2. /api/admin/coaches/courses、/revenue 要在 /api/admin/coaches 前面 ——
//    不然 "courses"/"revenue" 會被 POST /:userId 當成 userId 吃掉
app.use("/api/coaches/skill", skillRouter);
app.use("/api/coaches", coachesRouter); // ✚ M4 公開瀏覽
app.use("/api/users", usersRouter);
app.use("/api/credit-package", creditPackageRouter); // ✚ M1 方案 + M5 購買
app.use("/api/courses", coursesRouter); // ✚ M4 課程列表 + M5 報名
app.use("/api/admin/coaches/courses", adminCoursesRouter); // ✚ M3 課程管理（先掛）
app.use("/api/admin/coaches/revenue", adminRevenueRouter); // ✚ M6 月營收（先掛）
app.use("/api/admin/coaches", adminCoachesRouter); // ✚ M3 升級/教練資料（後掛）

// 404（W3）：放在所有路由「之後」——前面全都沒比對到才會走到這裡
app.use((req, res, next) => {
    next(appError(404, "找不到路由"));
    return;
});

// 錯誤處理守門員（W4：四個參數）——所有 next(error) 最後都流到這裡統一回 JSON
app.use((err, req, res, next) => {
    const statusCode = err.status || 500; // 沒帶狀態碼的意外錯誤一律當 500
    res.status(statusCode).json({
        status: statusCode === 500 ? "error" : "failed", // 4xx 是 failed、500 是 error
        message: err.message || "伺服器錯誤",
    });
    return;
});

// ❌【原本寫錯】這裡原本還有一段 dataSource.initialize() + app.listen(...)——
// 但 bin/www.js 也做了一模一樣的事。同一件事寫兩個地方的問題：
// 1. 如果用 node bin/www.js 啟動，initialize 會被呼叫兩次 → TypeORM 直接丟錯
// 2. 職責混亂：app.js 應該只負責「定義 app 長什麼樣」，
//    「啟動伺服器」是入口檔（bin/www.js）的事 —— 這也是課程建議的分工
//    （package.json 的 dev/start 已改成指向 ./bin/www.js）
module.exports = app;
