// ✚【全新檔案，原本缺少/M3】教練後台：升級教練 + 個人資料
const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const adminCoachesController = require("../controllers/adminCoaches");

// 查/改「自己的」教練資料：isAuth 先解 token → isCoach 再驗身分，掛的順序 = 執行順序
router.get("/", isAuth, isCoach, adminCoachesController.getOwnProfile);
router.put("/", isAuth, isCoach, adminCoachesController.updateOwnProfile);

// 升級教練（課程簡化設計：免登入）。
// ⚠️ ":userId" 會吃掉任何一段文字——所以這個 router 在 app.js 必須掛在
// /api/admin/coaches/courses 和 /revenue 「之後」，不然 "courses" 會被當成 userId
router.post("/:userId", adminCoachesController.promote);

module.exports = router;
