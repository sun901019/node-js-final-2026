// ❌【原本寫錯 ①】require("../controllers/user") → 檔案實際叫 users.js（多一個 s）。
// 路徑錯，server 一啟動就 Cannot find module '../controllers/user' 直接崩潰。
const usersController = require("../controllers/users");
// ✚【原本缺少，補上】profile 之後的 API 都要登入，需要 isAuth
const isAuth = require("../middlewares/isAuth");

const router = require("express").Router();

// ❌【原本寫錯 ②】"/singup" → 拼字錯誤，正確是 "/signup"。
// 路由是「逐字比對」的：測試打 POST /api/users/signup，你註冊的卻是 /singup，
// 永遠比不到 → 404，整個 M2 全部紅燈。
router.post("/signup", usersController.signup);
router.post("/login", usersController.login);

// ❌【原本寫錯 ③】route.get(...) → 變數叫 router 不是 route，ReferenceError 直接崩潰。
// ✚【補上】profile 需要登入 → 掛 isAuth。執行順序：isAuth 先驗 token，過了才進 controller
router.get("/profile", isAuth, usersController.getProfile);

// ✚【原本缺少，補上】M2 剩餘兩支 + M5 兩支（都需要登入）
router.put("/profile", isAuth, usersController.updateProfile);     // 修改暱稱
router.put("/password", isAuth, usersController.updatePassword);   // 修改密碼
router.get("/credit-package", isAuth, usersController.getCreditPackage); // 購買紀錄
router.get("/courses", isAuth, usersController.getCourses);        // 我的課表

module.exports = router
