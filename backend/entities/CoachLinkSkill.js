// ✚【全新檔案，原本缺少】教練 ↔ 技能 的「多對多中介表」。
// 一位教練會多個技能、一個技能被多位教練會 → 多對多，需要一張中間表存 (coach_id, skill_id) 配對。
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CoachLinkSkill',
    tableName: 'coach_link_skill',
    columns: {
        id: { type: "uuid", primary: true, generated: 'uuid' },
        coach_id: { type: "uuid", nullable: false },
        skill_id: { type: "uuid", nullable: false },
    },
    relations: {
        // relations 寫法重點：target 填 Entity 的 name（"Coach"），不是 tableName；
        // joinColumn.name 填「本表」存外鍵的欄位名。
        coach: {
            type: 'many-to-one',
            target: 'Coach',
            joinColumn: { name: "coach_id" },
            onDelete: "CASCADE", // 教練被刪除時，這些關聯紀錄自動跟著刪，不留孤兒資料
        },
        skill: {
            type: 'many-to-one',
            target: 'Skill',
            joinColumn: { name: "skill_id" },
            onDelete: "CASCADE",
        },
    },
});
