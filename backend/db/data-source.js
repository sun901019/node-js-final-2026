const config = require("../config");

const { DataSource } = require("typeorm");

const dataSource = new DataSource({
    type: "postgres",
    host: config.get("db.host"),
    port: Number(config.get("db.port")),
    username: config.get("db.username"),
    password: config.get("db.password"),
    database: config.get("db.database"),
    synchronize: config.get("db.synchronize"),
    ssl: config.get("db.ssl"),
    entities: [
        require("../entities/User"),
        require("../entities/Coach"),
        require("../entities/Skill"),
        // ✚【原本缺少，補上】剩下 5 張表。沒註冊在這裡的 Entity：
        // 1. synchronize 不會幫它建表 2. getRepository("Xxx") 會直接丟 EntityMetadataNotFoundError
        require("../entities/CreditPackage"),
        require("../entities/CoachLinkSkill"),
        require("../entities/Course"),
        require("../entities/CreditPurchase"),
        require("../entities/CourseBooking"),
    ],
});

module.exports = { dataSource };
