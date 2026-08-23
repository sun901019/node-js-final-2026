// ✚【全新檔案，原本缺少/M6】教練後台：月營收（掛載點 /api/admin/coaches/revenue）
const router = require("express").Router();
const isAuth = require("../middlewares/isAuth");
const isCoach = require("../middlewares/isCoach");
const adminRevenueController = require("../controllers/adminRevenue");

router.get("/", isAuth, isCoach, adminRevenueController.getRevenue);

module.exports = router;
