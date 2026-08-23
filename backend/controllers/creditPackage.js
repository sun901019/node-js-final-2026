// ✚【原本是「空檔案」】routes/creditPackage.js 已經引用 getAll / create / remove，
// 但這個檔案完全沒內容 → require 進來是 {}，router.get("/", undefined) 會在「掛載路由的瞬間」
// 丟 Route.get() requires a callback function 讓 server 起不來。
//
// 這支 controller 的模式跟 skill 完全一樣（M1），差在多兩個整數欄位 + M5 的購買功能。
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidInteger, isValidUUID } = require("../utils/validUtils");

const creditPackageController = {
    // GET /api/credit-package：取得所有方案（免登入）
    async getAll(req, res, next) {
        const packages = await dataSource.getRepository("CreditPackage").find({
            select: { id: true, name: true, credit_amount: true, price: true },
            order: { created_at: "ASC" }, // week9 範例：依建立時間排序，列表順序穩定
        });
        res.json({ status: "success", data: packages });
    },

    // POST /api/credit-package：新增方案（免登入）
    async create(req, res, next) {
        const { name, credit_amount, price } = req.body;
        // 驗證順序：先擋格式錯（400），再擋重複（409）
        // credit_amount / price 用 isValidInteger：必須是「數字型別」的整數且 >= 0
        if (!isValidString(name) || !isValidInteger(credit_amount) || !isValidInteger(price)) {
            return next(appError(400, "欄位未填寫正確"));
        }

        const pkgRepo = dataSource.getRepository("CreditPackage");
        const findPkg = await pkgRepo.findOneBy({ name: name.trim() });
        if (findPkg) {
            return next(appError(409, "資料重複"));
        }

        const newPkg = await pkgRepo.save({
            name: name.trim(),
            credit_amount,
            price,
        });
        res.status(201).json({ status: "success", data: newPkg });
    },

    // DELETE /api/credit-package/:creditPackageId：刪除方案（免登入）
    async remove(req, res, next) {
        const { creditPackageId } = req.params;
        // 先擋「uuid 格式不合法」：不擋的話 PostgreSQL 會丟型別錯誤變 500
        if (!isValidUUID(creditPackageId)) {
            return next(appError(400, "ID錯誤"));
        }
        const result = await dataSource.getRepository("CreditPackage").delete(creditPackageId);
        // affected = 這次 DELETE 實際影響幾筆。0 = 格式對但查無此 id
        if (result.affected === 0) {
            return next(appError(400, "ID錯誤"));
        }
        res.json({ status: "success" });
    },

    // ✚【M5】POST /api/credit-package/:creditPackageId：購買方案（需登入 → route 掛 isAuth）
    // 資料流：isAuth 解出 req.user.id → 查方案是否存在 → 把方案的堂數/價格「複製」進 credit_purchases
    async purchase(req, res, next) {
        const { creditPackageId } = req.params;
        if (!isValidUUID(creditPackageId)) {
            return next(appError(400, "ID錯誤"));
        }
        const pkg = await dataSource.getRepository("CreditPackage").findOneBy({ id: creditPackageId });
        if (!pkg) {
            return next(appError(400, "ID錯誤"));
        }

        await dataSource.getRepository("CreditPurchase").save({
            user_id: req.user.id,             // 「誰買的」來自 JWT（isAuth 塞進來的），不能信 body
            credit_package_id: pkg.id,
            purchased_credits: pkg.credit_amount, // 快照：從方案複製，日後方案改價不影響歷史紀錄
            price_paid: pkg.price,
        });
        res.status(200).json({ status: "success", data: null });
    },
};

// ⚠️ 別忘了匯出——controllers/users.js 原本就是忘了這行
module.exports = creditPackageController;
