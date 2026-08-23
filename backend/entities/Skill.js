const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Skill",
    tableName: "skills",
    columns: {
        id: { type: "uuid", primary: true, generated: "uuid" },
        // ❌【原本寫錯】unique:false → 規格是技能名稱不可重複（409 資料重複）。
        // 雖然 controller 有先查重，但 unique:true 讓「資料庫」當最後防線——
        // 兩個請求同時進來時，程式層的查重可能同時都查不到，資料庫的 unique 約束才擋得住。
        name: { type: "varchar", length: 50, nullable: false, unique: true },
        // ❌【原本寫錯（風格不一致）】createdAt → created_at（對齊 week9 範例的 snake_case 命名）
        created_at: { type: "timestamp", createDate: true },
    },
});
