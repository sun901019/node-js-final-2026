const router = require("express").Router();
const coursesController = require("../controllers/courses");
const isAuth = require("../middlewares/isAuth");

router.get("/", coursesController.getOngoingCourses);
router.post("/:courseId", isAuth, coursesController.postCourseBooking);
router.delete("/:courseId", isAuth, coursesController.cancelCourseBooking);
module.exports = router;
