const router = require("express").Router();
const coursesController = require("../controllers/courses");

router.get("/", coursesController.getOngoingCourses);

module.exports = router;
