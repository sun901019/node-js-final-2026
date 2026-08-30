const jwt = require("jsonwebtoken");
const config = require("../config/index");
const appError = require("../utils/appError");
const { dataSource } = require("../db/data-source");

async function isAuth(req, res, next) {
  try {
    // 沒帶 Authorization header、或格式不是 Bearer ：「請先登入」
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return next(appError(401, "請先登入"));
    }
    const token = auth.split(" ")[1];
    // token 已過期：「Token 已過期」
    const decode = await jwt.verify(token, config.get("secret.jwtSecret"));
    // token 無效（內容不對、或查無此使用者）：「無效的 token」 ⚠️「請先登入」是四句固定錯誤訊息文字之一，一個字都不能改。
    const findUser = await dataSource.getRepository("User").findOneBy({
      id: decode.id,
    });
    if (!findUser) {
      return next(appError(401, "無效的 token"));
    }
    req.user = findUser;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(appError(401, "Token 已過期"));
    }
    return next(appError(401, "無效的 token"));
  }
}
module.exports = isAuth;
