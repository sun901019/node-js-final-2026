const userController = require("../controllers/user");

const router = require("express").Router();

router.post("/singup", userController.signup);
router.post("/login", userController.login);
route.get("/profile", userController.profile);

module.exports = router