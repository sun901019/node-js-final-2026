require("dotenv").config();

const dbConfig = require("./db");
const scret = require("./secret");
const web = require("./web");

const config = {
  db: dbConfig,
  secret: scret,
  web: web,
};
function get(path){
    const keys = path.split(".");
    let result = config;

    for (const key of keys) {
        result = result[key];
    }
    if (result === undefined) {
        throw new Error(`Config key ${path} not found`);
    }
    return result;
}