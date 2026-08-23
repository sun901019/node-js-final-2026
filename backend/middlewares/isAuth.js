// ✚【全新檔案，原本整個 middlewares/ 資料夾都不存在】（此版本對齊 week9 課程範例）
// 但 routes/creditPackage.js 已經 require("../middlewares/isAuth") —— 檔案不存在的話，
// 路由一被掛載，整個 server 啟動就會 Cannot find module 直接崩潰。
//
// middleware 的本質：在 controller「之前」先跑的一段函式。
// 資料流：請求進來 → route 比對成功 → isAuth 先執行 →
//   驗證通過 → 把「資料庫裡的完整使用者」塞進 req.user → next() 放行給 controller
//   驗證失敗 → next(appError(401, ...)) → 直接跳到 app.js 最後的錯誤處理 middleware
const jwt = require("jsonwebtoken");
const config = require("../config");
const appError = require("../utils/appError");
const { dataSource } = require("../db/data-source");

async function isAuth(req, res, next) {
  try {
    // 1. 取出 Authorization header，格式必須是 "Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // ⚠️「請先登入」是四句 UI 合約之一，前端逐字比對，一個字都不能差
      return next(appError(401, "請先登入"));
    }

    const token = authHeader.split(" ")[1];

    // 2. jwt.verify 同時做兩件事：驗簽章（token 沒被竄改）＋ 驗過期（exp）
    //    secret 必須跟 login 簽發時用的同一把（config → 環境變數 JWT_SECRET）
    //    失敗會 throw → 掉進下面的 catch
    const decoded = jwt.verify(token, config.get("secret.jwtSecret"));

    // 3.（week9 課程版）拿 payload 的 id 回資料庫撈「完整的使用者」——
    //    比只信 token 內容更保險：帳號若已被刪除，token 再合法也擋下來；
    //    controller 也能直接用 req.user.name / req.user.email，不用再查一次
    const findUser = await dataSource.getRepository("User").findOneBy({
      id: decoded.id,
    });
    if (!findUser) {
      return next(appError(401, "無效的 token"));
    }

    req.user = findUser;
    next(); // 放行 → 才會進到 controller
  } catch (error) {
    // jwt.verify 丟出的錯誤用 name 區分：過期是 TokenExpiredError，其他（簽章不對等）是無效
    if (error.name === "TokenExpiredError") {
      return next(appError(401, "Token 已過期"));
    }
    return next(appError(401, "無效的 token"));
  }
}

module.exports = isAuth;
