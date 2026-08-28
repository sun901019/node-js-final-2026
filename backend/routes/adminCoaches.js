const router = require("express").Router();
const adminCoachesController = require("../controllers/adminCoaches");
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");

router.post("/:userId", adminCoachesController.postPromoteCoach);
router.get("/", isAuth, isCoach, adminCoachesController.getCoachProfile);
router.put("/:creditPackageId", adminCoachesController.putUpdateCoachProfile);

module.exports = router;
