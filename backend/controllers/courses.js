// ✚【全新檔案，原本缺少】M4 全站課程列表 + M5 報名/取消課程（整份作業最複雜的一支在這）
const { IsNull, MoreThan, LessThanOrEqual } = require("typeorm");
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidUUID } = require("../utils/validUtils");

const coursesController = {
    // GET /api/courses  全站「進行中」課程（免登入）
    // ⚠️ 口徑：start_at <= now < end_at —— 只有正在進行的，尚未開始的「不能」出現
    async getAllCourses(req, res, next) {
        const now = new Date();
        const courses = await dataSource.getRepository("Course").find({
            where: {
                start_at: LessThanOrEqual(now), // start_at <= NOW()：已經開始
                end_at: MoreThan(now),          // end_at  >  NOW()：還沒結束
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

    // POST /api/courses/:courseId  報名課程（需登入）
    // 四道檢查「順序是合約」：先中先回，順序錯了測試會拿到錯的訊息
    async createBooking(req, res, next) {
        const { courseId } = req.params;
        const courseRepo = dataSource.getRepository("Course");
        const bookingRepo = dataSource.getRepository("CourseBooking");
        const purchaseRepo = dataSource.getRepository("CreditPurchase");

        // ① 查無課程 → ID錯誤（uuid 格式不合法也算）
        if (!isValidUUID(courseId)) {
            return next(appError(400, "ID錯誤"));
        }
        const course = await courseRepo.findOneBy({ id: courseId });
        if (!course) {
            return next(appError(400, "ID錯誤"));
        }

        // ② 已有報名紀錄（⚠️ 含已取消的！所以「不加」cancelled_at 條件）
        // 這就是軟刪除的第二個作用：紀錄還在，取消過的課查得到 → 不能再報名
        const existBooking = await bookingRepo.findOneBy({
            user_id: req.user.id,
            course_id: courseId,
        });
        if (existBooking) {
            return next(appError(400, "已經報名過此課程"));
        }

        // ③ 剩餘堂數 = 買的總堂數 − 未取消報名數（沒有欄位，即時算）
        const purchases = await purchaseRepo.find({ where: { user_id: req.user.id } });
        const totalCredits = purchases.reduce((sum, p) => sum + p.purchased_credits, 0);
        // IsNull()：SQL 的 cancelled_at IS NULL。
        // ⚠️ 不能寫 { cancelled_at: null }，TypeORM 會忽略 null 條件，變成「全部都算」
        const usageCount = await bookingRepo.count({
            where: { user_id: req.user.id, cancelled_at: IsNull() },
        });
        if (totalCredits - usageCount <= 0) {
            return next(appError(400, "已無可使用堂數"));
        }

        // ④ 這堂課「未取消」的報名人數已達上限
        const participantCount = await bookingRepo.count({
            where: { course_id: courseId, cancelled_at: IsNull() },
        });
        if (participantCount >= course.max_participants) {
            return next(appError(400, "已達最大參加人數，無法參加"));
        }

        // 四關都過 → 建立報名（created_at 由資料庫自動填，M6 的月營收就是看它）
        await bookingRepo.save({ user_id: req.user.id, course_id: courseId });
        res.status(201).json({ status: "success", data: null });
    },

    // DELETE /api/courses/:courseId  取消報名（需登入）—— 軟刪除
    async deleteBooking(req, res, next) {
        const { courseId } = req.params;
        if (!isValidUUID(courseId)) {
            return next(appError(400, "ID錯誤"));
        }
        const bookingRepo = dataSource.getRepository("CourseBooking");
        // 只找「還沒取消」的那筆 —— 取消第二次時這裡查不到 → 回 ID錯誤
        const booking = await bookingRepo.findOneBy({
            user_id: req.user.id,
            course_id: courseId,
            cancelled_at: IsNull(),
        });
        if (!booking) {
            return next(appError(400, "ID錯誤"));
        }

        // 軟刪除：不是 remove()，只是蓋一個取消時間。
        // 堂數會「自動歸還」——因為 remain 是即時計算，這筆不再滿足 cancelled_at IS NULL 就不扣了
        booking.cancelled_at = new Date();
        await bookingRepo.save(booking);
        res.json({ status: "success", data: null });
    },
};

module.exports = coursesController;
