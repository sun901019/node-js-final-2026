const config = require("./config/index");
const express = require("express");
const cors = require("cors");
const { dataSource } = require("./db/data-source");
const skill = require("./routes/skill");
const users = require("./routes/users");
const creditPackage = require("./routes/creditPackage");
const app = express();
app.use(cors());
app.use(express.json());

// M0 healthcheck（下一步實作）
app.get("/healthcheck", async (req, res, next) => {
    try {
        await dataSource.query("SELECT 1 ");
        res.send("OK");
    } catch (error) {
        res.status(503).send("Service Unavailable");
    }
});
// 路由掛載（後續步驟逐一加入）
app.use("/api/coaches/skill", skill);
app.use("/api/users", users);
app.use("/api/credit-package", creditPackage);

// 404 錯誤
app.use((req, res, next) => {
    res.status(404).json({
        status: "failed",
        message: "找不到路由",
    });
    return;
});
// 全域錯誤處理
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: statusCode === 500 ? "error" : "failed",
        message: err.message || "伺服器錯誤",
    });
});

// 啟動
dataSource
    .initialize()
    .then(() => {
        app.listen(config.get("web.port"), () => {
            console.log(`Server running on port ${config.get("web.port")}`);
        });
    })
    .catch((err) => {
        console.error("資料庫連線失敗", err);
        process.exit(1);
    });
