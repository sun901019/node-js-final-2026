const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())          // W3：前端在 3000、我們在 8080，沒它前端全被擋
app.use(express.json())



// M0：健康檢查——回純文字 OK，不是 JSON；路徑不在 /api 底下
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK')
})

// 之後每完成一個里程碑，路由就多掛一條：
// app.use('/api/credit-package', require('./routes/creditPackage'))

// 404（W3）
app.use((req, res) => {
  res.status(404).json({ status: 'failed', message: '無此路由' })
})

// 錯誤處理守門員（W4：四個參數）
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ status: 'failed', message: '伺服器錯誤' })
})


dataSource.initialize().then(() => {
  app.listen(config.get("web.port"), () => {
    console.log('伺服器運行中 port: ${config.get("web.port")}')
  });
}).catch((err) => {
  console.error('資料庫連線失敗', err)
  process.exit(1)   // 沒有資料庫就不營業
});
module.exports = app
