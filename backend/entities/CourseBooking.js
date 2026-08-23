// ✚【全新檔案，原本缺少】報名紀錄表。
// 兩個關鍵設計：
// 1. cancelled_at 可為 null → 「軟刪除」：取消報名不是 DELETE 資料，只是把這欄標上時間。
//    好處：紀錄留著（可以擋「取消過的課再報名」）、剩餘堂數可用「總購買 − 未取消報名數」即時算出來。
// 2. created_at → M6 月營收就是看「這欄」落在哪個月（不是課程的上課時間！），
//    所以欄位名刻意取 created_at（snake_case），M6 的原生 SQL 才能直接寫 cb.created_at。
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CourseBooking',
    tableName: 'course_bookings',
    columns: {
        id: { type: "uuid", primary: true, generated: 'uuid' },
        user_id: { type: "uuid", nullable: false },
        course_id: { type: "uuid", nullable: false },
        created_at: { type: "timestamptz", createDate: true },    // 報名建立時間（M6 用它算月份）
        cancelled_at: { type: "timestamptz", nullable: true },    // null = 有效報名；有值 = 已取消
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: "user_id" },
        },
        course: {
            type: 'many-to-one',
            target: 'Course',
            joinColumn: { name: "course_id" },
        },
    },
});
