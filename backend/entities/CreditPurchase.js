// ✚【全新檔案，原本缺少】購買紀錄表（誰、買了哪個方案、拿到幾堂、付多少）。
// 設計重點：purchased_credits / price_paid 是「快照」——從方案複製過來存一份，
// 因為方案之後可能改價或被刪除，但歷史訂單的金額不能跟著變。
const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CreditPurchase',
    tableName: 'credit_purchases',
    columns: {
        id: { type: "uuid", primary: true, generated: 'uuid' },
        user_id: { type: "uuid", nullable: false },
        credit_package_id: { type: "uuid", nullable: false },
        purchased_credits: { type: "integer", nullable: false }, // 從 credit_packages.credit_amount 複製
        price_paid: { type: "integer", nullable: false },        // 從 credit_packages.price 複製
        // createDate:true → INSERT 時資料庫自動填當下時間，M5 購買紀錄要依這欄 DESC 排序
        purchase_at: { type: "timestamptz", createDate: true },
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: { name: "user_id" },
        },
        creditPackage: {
            type: 'many-to-one',
            target: 'CreditPackage',
            joinColumn: { name: "credit_package_id" },
        },
    },
});
