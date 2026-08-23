// ✚【全新檔案，原本缺少/M4】公開瀏覽的教練相關路由（免登入，所以不掛 isAuth）
const router = require("express").Router();
const coachesController = require("../controllers/coaches");

// ⚠️ 路由順序：具體路徑先掛、含 :param 的後掛。
// "/:coachId" 像個貪吃的萬用格，如果掛在前面，之後的任何一段路徑都會被它當成 coachId 吃掉
router.get("/", coachesController.getCoaches);                       // GET /api/coaches?per=&page=
router.get("/:coachId/courses", coachesController.getCoachCourses);  // 兩段的先掛
router.get("/:coachId", coachesController.getCoachDetail);           // 一段的後掛

module.exports = router;
