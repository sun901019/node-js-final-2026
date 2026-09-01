const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const creditPackageController = require("../controllers/creditPackage");

router.get("/", creditPackageController.getCreditPackages);
router.post("/", creditPackageController.postCreditPackage);
router.delete("/:creditPackageId", creditPackageController.deleteCreditPackage);
router.post("/:creditPackageId", isAuth, creditPackageController.postBuyCreditPackage);

module.exports = router;
