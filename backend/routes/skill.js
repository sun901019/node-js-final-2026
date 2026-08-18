const skillController = require('../controllers/skill')

const router = require('express').Router()

router.get("/", skillController.getSkill);
router.post("/", skillController.postSkill)
router.delete("/:skillId", skillController.deleteSkill)

module.exports = router;