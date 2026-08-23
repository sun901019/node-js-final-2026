// 入口檔：整個後端從這裡開始跑（package.json 的 dev/start 都指向這裡）
// 啟動順序（很重要，這就是「資料誰先誰後」）：
//   1. require('../app') → app.js 開始執行 → 它 require config（dotenv 在這時把 .env 讀進 process.env）
//      → require data-source（TypeORM 讀進 8 個 Entity 定義，但「還沒」連線）
//      → 掛好所有路由、錯誤處理 → 回傳 app 物件
//   2. dataSource.initialize() → 真正連上 PostgreSQL；synchronize:true 會比對 Entity 與資料庫，自動建表
//   3. app.listen() → 資料庫就緒「之後」才開始收請求（M0 要求 healthcheck 等 DB 就緒才回 200）
const app = require('../app')
const { dataSource } = require('../db/data-source')
// ❌【原本寫錯】原本直接用 process.env.PORT——能動（因為 config 被 app.js 載入時已跑過 dotenv），
// 但全專案的環境變數都該走 config 統一出口，之後要改預設值/驗證只需改一個地方
const config = require('../config')

async function start() {
  try {
    await dataSource.initialize()
    console.log('資料庫連線成功')

    app.listen(config.get('web.port'), () => {
      console.log(`server 跑起來了：http://localhost:${config.get('web.port')}`)
    })
  } catch (err) {
    console.error('資料庫連線失敗', err)
    process.exit(1)   // 沒有資料庫就不營業
  }
}

start()
