// ✚【全新檔案，原本缺少/M3】教練的課程管理：開課、改課、課程列表、單一課程
const { IsNull } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidInteger, isValidUrl, isValidUUID } = require("../utils/validUtils");

// 開課和改課的欄位驗證邏輯一模一樣 → 抽成小函式重複使用，回傳錯誤訊息或 null
function validateCourseBody(body) {
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = body;
    if (
        !isValidUUID(skill_id) ||
        !isValidString(name) ||
        !isValidString(description) ||
        !isValidString(start_at) || Number.isNaN(Date.parse(start_at)) || // Date.parse 失敗回 NaN → 不是合法時間字串
        !isValidString(end_at) || Number.isNaN(Date.parse(end_at)) ||
        !isValidInteger(max_participants) ||
        !isValidUrl(meeting_url) // meeting_url 必須 https 開頭（測試會用 http:// 打）
    ) {
        return "欄位未填寫正確";
    }
    return null;
}

// 課程狀態是「即時計算」的，資料庫沒有 status 欄位：
// 現在 < start_at → 尚未開始；start_at <= 現在 < end_at → 進行中；否則 → 已結束
function courseStatus(course, now) {
    if (now < course.start_at) return "尚未開始";
    if (now < course.end_at) return "進行中";
    return "已結束";
}

const adminCoursesController = {
    // POST /api/admin/coaches/courses  開課（isAuth + isCoach）
    async createCourse(req, res, next) {
        const errMsg = validateCourseBody(req.body);
        if (errMsg) {
            return next(appError(400, errMsg));
        }
        const skill = await dataSource.getRepository("Skill").findOneBy({ id: req.body.skill_id });
        if (!skill) {
            return next(appError(400, "欄位未填寫正確"));
        }

        const course = await dataSource.getRepository("Course").save({
            user_id: req.user.id, // 課主 = 登入的教練本人（token 解出來的），不能讓 body 指定
            skill_id: req.body.skill_id,
            name: req.body.name,
            description: req.body.description,
            start_at: new Date(req.body.start_at),
            end_at: new Date(req.body.end_at),
            max_participants: req.body.max_participants,
            meeting_url: req.body.meeting_url,
        });
        res.status(201).json({ status: "success", data: { course } });
    },

    // GET /api/admin/coaches/courses  自己的課程列表（isAuth + isCoach）
    async getOwnCourses(req, res, next) {
        const courses = await dataSource.getRepository("Course").find({
            where: { user_id: req.user.id },
            order: { start_at: "ASC" },
        });
        const bookingRepo = dataSource.getRepository("CourseBooking");
        const now = new Date();

        // 每堂課的 participants = 這堂課「未取消」的報名數（也是即時算的）
        // Promise.all：多堂課的 count 查詢「並行」發出，不用一堂等一堂
        const data = await Promise.all(
            courses.map(async (c) => ({
                id: c.id,
                name: c.name,
                start_at: c.start_at,
                end_at: c.end_at,
                max_participants: c.max_participants,
                status: courseStatus(c, now),
                participants: await bookingRepo.count({
                    where: { course_id: c.id, cancelled_at: IsNull() },
                }),
            }))
        );
        res.json({ status: "success", data });
    },

    // GET /api/admin/coaches/courses/:courseId  查單一課程（isAuth；owner-scoped）
    async getCourseDetail(req, res, next) {
        const { courseId } = req.params;
        if (!isValidUUID(courseId)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        const course = await dataSource.getRepository("Course").findOneBy({ id: courseId });
        if (!course) {
            return next(appError(400, "課程不存在"));
        }
        // owner check：只有課主本人能看。別的教練來查 → 擋。
        // 沒有這行的話，任何登入者都能窺看所有課程的 meeting_url
        if (course.user_id !== req.user.id) {
            return next(appError(400, "無權限查看此課程"));
        }
        // 規格：回「扁平」物件（欄位直接攤在 data 底下，不是包在 data.course 裡）
        res.json({
            status: "success",
            data: {
                id: course.id,
                skill_id: course.skill_id,
                name: course.name,
                description: course.description,
                start_at: course.start_at,
                end_at: course.end_at,
                max_participants: course.max_participants,
                meeting_url: course.meeting_url,
            },
        });
    },

    // PUT /api/admin/coaches/courses/:courseId  更新課程（isAuth；owner-scoped）
    async updateCourse(req, res, next) {
        const { courseId } = req.params;
        if (!isValidUUID(courseId)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        const errMsg = validateCourseBody(req.body);
        if (errMsg) {
            return next(appError(400, errMsg));
        }

        const courseRepo = dataSource.getRepository("Course");
        const course = await courseRepo.findOneBy({ id: courseId });
        if (!course) {
            return next(appError(400, "課程不存在"));
        }
        // owner check 一定要在「更新之前」——順序反了就會先被外人蓋掉資料才發現不對
        if (course.user_id !== req.user.id) {
            return next(appError(400, "無權限更新此課程"));
        }

        await courseRepo.update(
            { id: courseId },
            {
                skill_id: req.body.skill_id,
                name: req.body.name,
                description: req.body.description,
                start_at: new Date(req.body.start_at),
                end_at: new Date(req.body.end_at),
                max_participants: req.body.max_participants,
                meeting_url: req.body.meeting_url,
            }
        );
        // week9 範例：把更新後的課程查回來回給前端，前端不用再打一次 GET
        const updated = await courseRepo.findOneBy({ id: courseId });
        res.json({ status: "success", data: { course: updated } });
    },
};

module.exports = adminCoursesController;
