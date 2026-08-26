const { DataSource } = require("typeorm");
const CourseBooking = require("../entities/CourseBooking");

const dataSource = new DataSource({
    type: "postgres",
    host: config.get("db.host"),
    port: Number(config.get("db.port")),
    username: config.get("db.username"),
    password: config.get("db.password"),
    database: config.get("db.database"),
    synchronize: config.get("db.synchronize"),
    ssl: config.get("db.ssl"),
    entities: [User, Skill, CreditPurchase, CreditPackage, CourseBooking, CourseBooking, CoachLinkSkill, Coach],
});
