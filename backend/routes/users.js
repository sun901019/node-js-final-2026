const router = require("express").Router();
const usersController = require("../controllers/users");
const isAuth = require("../middlewares/isAuth");
router.post("/signup", usersController.signup);
router.post("/login", usersController.login);
router.get("/profile", isAuth, usersController.getProfile);
router.put("/profile", isAuth, usersController.updateProfile);
router.put("/password", isAuth, usersController.putPassword);
module.exports = router;
