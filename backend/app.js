const express = require('express')
const cors = require('cors')
const config = require("./config")
const {dataSource}= require("./db/data-source");
const appError = require("./utils/appError");
const skill = require("./routes/skill")
const users = require("./routes/users")
const app = express()
app.use(cors())          // W3：前端在 3000、我們在 8080，沒它前端全被擋
app.use(express.json())



// M0：健康檢查——回純文字 OK，不是 JSON；路徑不在 /api 底下
app.get('/healthcheck', async (req, res, next) => {
  try {
    await dataSource.query('SELECT 1')   // 連線測試
    res.status(200).send('OK')
  } catch (err) {
    res.status(503).send('Service Unavailable')
  }
})
app.use("/api/coaches/skill",skill)
app.use("/api/users", users)


// 404（W3）
app.use((req, res, next) => {
  next(appError(404, '找不到路由'))
  return;
})

// 錯誤處理守門員（W4：四個參數）
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;   // 沒帶狀態碼的意外錯誤一律當 500
  res.status(statusCode).json({
    status: statusCode === 500 ? 'error' : 'failed',   // 4xx 是 failed、500 是 error
    message: err.message || "伺服器錯誤"
  })
  return
})


dataSource.initialize().then(() => {
  app.listen(config.get("web.port"), () => {
    console.log(`伺服器運行中 port: ${config.get("web.port")}`)
  });
}).catch((err) => {
  console.error('資料庫連線失敗', err)
  process.exit(1)   // 沒有資料庫就不營業
});
module.exports = app
