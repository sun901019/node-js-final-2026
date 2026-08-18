require("dotenv").config();

const dbConfig = require("./db");
const secret = require("./secret");
const web = require("./web");

const config = {
  db: dbConfig,
  secret: secret,
  web: web,
};
function get(path) {
  const keys = path.split(".");
  let result = config;

  for (const key of keys) {
    if (result === undefined) break; // 中途斷鏈就提早跳出，讓下面丟出好讀的錯誤
    result = result[key];
  }
  if (result === undefined) {
    throw new Error(`Config key ${path} not found`);
  }
  return result;
}

module.exports = { get };
