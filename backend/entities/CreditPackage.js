// ✚【全新檔案，原本缺少】M1 購買方案的資料表。
// 資料流：synchronize:true → 後端啟動時 TypeORM 讀這份定義，自動在 PostgreSQL 建出 credit_packages 表。
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CreditPackage',        // 程式裡 getRepository("CreditPackage") 用的名字
    tableName: 'credit_packages', // 資料庫裡實際的表名
    columns: {
        id: { type: "uuid", primary: true, generated: 'uuid' },
        // unique:true → 資料庫層也擋重複名稱（規格：方案名稱不可重複，409 資料重複）
        name: { type: "varchar", length: 100, nullable: false, unique: true },
        credit_amount: { type: "integer", nullable: false, default: 0 }, // 這個方案有幾堂課
        price: { type: "integer", nullable: false, default: 0 },          // 售價
        // timestamptz = 「帶時區」的 timestamp（week9 範例用法），存絕對時間點，不怕時區換算問題
        created_at: { type: "timestamptz", createDate: true },
    },
});
