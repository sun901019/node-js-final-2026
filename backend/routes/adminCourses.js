// ✚【全新檔案，原本缺少/M3】教練後台：課程管理（掛載點 /api/admin/coaches/courses）
const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const adminCoursesController = require("../controllers/adminCourses");

// 列表與開課：需要「登入 + 是教練」雙 middleware
router.get("/", isAuth, isCoach, adminCoursesController.getAllCourses);
router.post("/", isAuth, isCoach, adminCoursesController.postCreateCourse);

// 單一課程查/改：規格只要求登入（isAuth），「是不是你的課」由 controller 的 owner check 把關
router.get("/:courseId", isAuth, adminCoursesController.getCourse);
router.put("/:courseId", isAuth, adminCoursesController.putUpdateCourse);

module.exports = router;
