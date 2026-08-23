const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const creditPackageController = require("../controllers/creditPackage");

router.get("/", creditPackageController.getAll);
router.post("/", creditPackageController.create);
router.delete("/:creditPackageId", creditPackageController.remove);

// ✚【原本缺少，補上/M5】購買方案（需登入）。
// 注意 POST "/" 和 POST "/:creditPackageId" 不會打架：
// Express 逐字比對路徑段數，POST /api/credit-package 進上面那條、
// POST /api/credit-package/<uuid> 進這條
router.post("/:creditPackageId", isAuth, creditPackageController.purchase);

module.exports = router;
