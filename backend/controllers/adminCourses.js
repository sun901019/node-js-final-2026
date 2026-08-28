const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const adminCoursesController = {
    async getAllCourses(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
    async postCreateCourse(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
    async getCourse(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
    async putUpdateCourse(req, res, next) {
        res.json({
            status: "success",
            data: {},
        });
        return;
    },
};

module.exports = adminCoursesController;
