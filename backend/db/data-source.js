require('dotenv').config("../config/index")
const { DataSource } = require('typeorm')

const dataSource = new DataSource({
  type:"postgres",
  host: config.get("db.host"),
  port:Number(config.get("db.port")),
  username: config.get("db.username"),
  password: config.get("db.password"),
  database: config.get("db.database"),
  synchronize: config.get("db.synchronize") === 'true',
  ssl: config.get("db.ssl") === 'true',
  entities: [
    require('../entities/User'),
    require('../entities/Coach'),
    require('../entities/Skill'),
    // 今天的 entities 會一個一個長出來
  ],
})

module.exports = { dataSource }
