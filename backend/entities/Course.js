// ✚【全新檔案，原本缺少】課程表。
// ⚠️ 這裡的 user_id 直接對應 users.id（教練的「使用者」id），不是 coaches.id —— M6 會踩到這個雷。
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Course',
    tableName: 'courses',
    columns: {
        id: { type: "uuid", primary: true, generated: 'uuid' },
        user_id: { type: "uuid", nullable: false },  // 開課教練（users 表的 id）
        skill_id: { type: "uuid", nullable: false }, // 這堂課教哪個技能
        name: { type: "varchar", length: 100, nullable: false },
        description: { type: "text", nullable: false },
        start_at: { type: "timestamptz", nullable: false },
        end_at: { type: "timestamptz", nullable: false },
        max_participants: { type: "integer", nullable: false, default: 0 },
        meeting_url: { type: "varchar", length: 2048, nullable: true },
        created_at: { type: "timestamptz", createDate: true },
        updated_at: { type: "timestamptz", updateDate: true },
    },
    relations: {
        // 有了 relation，controller 才能用 relations: { user: true } 一次 JOIN 出教練名字（coach_name）
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: "user_id" },
        },
        skill: {
            type: 'many-to-one',
            target: 'Skill',
            joinColumn: { name: "skill_id" },
        },
    },
});
