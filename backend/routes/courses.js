// ✚【全新檔案，原本缺少/M4+M5】課程路由：公開列表（免登入）＋ 報名/取消（需登入）
const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const coursesController = require("../controllers/courses");

router.get("/", coursesController.getAllCourses);                    // 免登入：全站進行中課程
router.post("/:courseId", isAuth, coursesController.createBooking);  // 需登入：報名
router.delete("/:courseId", isAuth, coursesController.deleteBooking);// 需登入：取消報名（軟刪除）

module.exports = router;
