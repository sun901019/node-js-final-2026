const fs = require("fs");
const path = require("path");

const backendPackagePath = path.join(process.cwd(), "backend", "package.json");

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(backendPackagePath)) {
  fail("⛔ 找不到 backend/package.json：請確認已在專案根目錄建立 backend/，並將其 commit、push。");
}

let backendPackage;
try {
  backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, "utf8"));
} catch (error) {
  fail("⛔ backend/package.json 不是合法 JSON，請先修正後再重新執行。");
}

if (!backendPackage.scripts || !backendPackage.scripts.start) {
  fail(
    "⛔ backend/package.json 缺少 scripts.start：正式繳交時，根目錄 npm start 會代理執行 npm --prefix backend start。",
  );
}
