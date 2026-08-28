const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const adminCoachesController = {
    async postPromoteCoach(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
    async getCoachProfile(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
    async putUpdateCoachProfile(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
};

module.exports = adminCoachesController;
