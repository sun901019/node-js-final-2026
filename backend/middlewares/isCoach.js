// ✚【全新檔案，原本缺少】M3/M6 的教練後台 API 需要「登入 + 是教練」雙重檢查。
// 掛法：router.get("/", isAuth, isCoach, controller)
// 執行順序就是掛的順序：isAuth 先解出 req.user → isCoach 再檢查 role → 都過才進 controller。
// 所以 isCoach 一定要掛在 isAuth「後面」，不然 req.user 還不存在。
const appError = require("../utils/appError");

module.exports = (req, res, next) => {
  // 語意上「有登入但無權限」應該回 403，但本作業測試規定統一用 401
  if (!req.user || req.user.role !== "COACH") {
    return next(appError(401, "使用者尚未成為教練"));
  }
  next();
};
