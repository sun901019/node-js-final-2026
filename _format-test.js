const express = require("express");
const router = express.Router();
function messy(a, b) {
  if (a > b) {
    return a;
  } else {
    return b;
  }
}
router.get("/test", (req, res) => {
  res.json({ ok: true, value: messy(1, 2) });
});
module.exports = router;
