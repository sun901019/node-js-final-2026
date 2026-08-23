// ✚【全新檔案，原本缺少/M4】公開瀏覽：教練列表、教練詳情、教練的課程（都免登入）
const { MoreThan } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidUUID } = require("../utils/validUtils");

const coachesController = {
    // GET /api/coaches?per=&page=  教練列表（分頁）
    async getCoaches(req, res, next) {
        const { per, page } = req.query;
        // query string 進來永遠是「字串」（"100" 不是 100），要先 Number() 再驗證。
        // 規格：per、page 必填且為整數，per >= 0、page >= 1
        const perNum = Number(per);
        const pageNum = Number(page);
        if (
            per === undefined || page === undefined ||
            !Number.isInteger(perNum) || perNum < 0 ||
            !Number.isInteger(pageNum) || pageNum < 1
        ) {
            return next(appError(400, "欄位未填寫正確"));
        }

        // 分頁公式：skip = (第幾頁 - 1) × 每頁筆數 → 第 2 頁、每頁 10 筆 = 跳過前 10 筆
        const coaches = await dataSource.getRepository("Coach").find({
            relations: { user: true },       // JOIN users，才能拿到教練的名字
            order: { created_at: "ASC" },    // 規格：依建立時間舊 → 新
            take: perNum,                    // LIMIT
            skip: (pageNum - 1) * perNum,    // OFFSET
        });

        // ⚠️ id 回的是「教練 id」（coaches 表的主鍵），user_id 才是使用者 id，兩個別搞混
        const data = coaches.map((c) => ({
            id: c.id,
            user_id: c.user_id,
            name: c.user.name,
        }));
        res.json({ status: "success", data });
    },

    // GET /api/coaches/:coachId  教練詳情
    async getCoachDetail(req, res, next) {
        const { coachId } = req.params;
        if (!isValidUUID(coachId)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        const coach = await dataSource.getRepository("Coach").findOne({
            where: { id: coachId },
            relations: { user: true },
        });
        if (!coach) {
            return next(appError(400, "找不到該教練"));
        }

        // skills 要的是「技能名稱的字串陣列」，不是物件陣列 →
        // 查中介表 coach_link_skill 並 JOIN skills，再 map 出名字
        const links = await dataSource.getRepository("CoachLinkSkill").find({
            where: { coach_id: coach.id },
            relations: { skill: true },
        });
        const skills = links.map((link) => link.skill.name);

        res.json({
            status: "success",
            data: {
                user: {
                    name: coach.user.name,
                    role: coach.user.role,
                },
                coach: {
                    id: coach.id,
                    user_id: coach.user_id,
                    experience_years: coach.experience_years,
                    description: coach.description,
                    profile_image_url: coach.profile_image_url,
                    skills,
                },
            },
        });
    },

    // GET /api/coaches/:coachId/courses  這位教練「未結束」的課程
    // ⚠️ 口徑跟 GET /api/courses 不同：這裡是 end_at > now（含尚未開始），全站列表是「進行中」
    async getCoachCourses(req, res, next) {
        const { coachId } = req.params;
        if (!isValidUUID(coachId)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        const coach = await dataSource.getRepository("Coach").findOneBy({ id: coachId });
        if (!coach) {
            return next(appError(400, "找不到該教練"));
        }

        // 課程表存的是 user_id（教練的使用者 id），所以要用 coach.user_id 去查，不是 coach.id
        const courses = await dataSource.getRepository("Course").find({
            where: {
                user_id: coach.user_id,
                end_at: MoreThan(new Date()),  // TypeORM 運算子 → SQL 的 end_at > NOW()
            },
            relations: { user: true, skill: true },
            order: { start_at: "ASC" },
        });

        const data = courses.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            start_at: c.start_at,
            end_at: c.end_at,
            max_participants: c.max_participants,
            coach_name: c.user.name,
            skill_name: c.skill.name,
        }));
        res.json({ status: "success", data });
    },
};

module.exports = coachesController;
