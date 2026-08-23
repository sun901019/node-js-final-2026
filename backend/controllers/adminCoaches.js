// ✚【全新檔案，原本缺少/M3】升級教練 + 教練個人資料維護
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidInteger, isValidUrl, isValidUUID } = require("../utils/validUtils");

const adminCoachesController = {
    // POST /api/admin/coaches/:userId  把一般會員升級成教練（課程簡化設計：免登入）
    async promote(req, res, next) {
        const { userId } = req.params;
        const { experience_years, description, profile_image_url } = req.body;

        // 驗證：年資是整數且 >= 0、自我介紹必填；圖片網址「選填」，但有填就必須 https 開頭
        if (!isValidUUID(userId) || !isValidInteger(experience_years) || !isValidString(description)) {
            return next(appError(400, "欄位未填寫正確"));
        }
        if (profile_image_url && !isValidUrl(profile_image_url)) {
            return next(appError(400, "欄位未填寫正確"));
        }

        const userRepo = dataSource.getRepository("User");
        const coachRepo = dataSource.getRepository("Coach");

        const user = await userRepo.findOneBy({ id: userId });
        if (!user) {
            return next(appError(400, "使用者不存在"));
        }
        // 查 coaches 表有沒有這個 user_id → 有就代表升級過了，不能升第二次
        const existCoach = await coachRepo.findOneBy({ user_id: userId });
        if (existCoach) {
            return next(appError(409, "使用者已經是教練"));
        }

        // 升級 = 改兩個地方：users.role 變 COACH ＋ coaches 表新增一筆檔案
        // （之後這個人「重新登入」時，JWT payload 的 role 才會是 COACH → isCoach 才放行）
        await userRepo.update({ id: userId }, { role: "COACH" });
        const newCoach = await coachRepo.save({
            user_id: userId,
            experience_years,
            description,
            profile_image_url: profile_image_url || null,
        });

        res.status(201).json({
            status: "success",
            data: {
                user: { id: user.id, name: user.name, role: "COACH" },
                coach: newCoach,
            },
        });
    },

    // GET /api/admin/coaches  教練查「自己」的資料（isAuth + isCoach）
    async getOwnProfile(req, res, next) {
        // 「自己」= req.user.id（token 解出來的），所以用 user_id 查 coaches 表
        const coach = await dataSource.getRepository("Coach").findOneBy({ user_id: req.user.id });
        if (!coach) {
            return next(appError(400, "找不到教練資料"));
        }
        // skill_ids：從中介表撈出這位教練勾選過的技能 id 陣列
        const links = await dataSource.getRepository("CoachLinkSkill").find({
            where: { coach_id: coach.id },
        });
        res.json({
            status: "success",
            data: {
                id: coach.id,
                experience_years: coach.experience_years,
                description: coach.description,
                profile_image_url: coach.profile_image_url,
                skill_ids: links.map((link) => link.skill_id),
            },
        });
    },

    // PUT /api/admin/coaches  更新教練資料（含技能清單）（isAuth + isCoach）
    async updateOwnProfile(req, res, next) {
        const { experience_years, description, profile_image_url, skill_ids } = req.body;

        // skill_ids 必須是「每個元素都是合法 uuid」的陣列 → every() 逐一檢查
        if (
            !isValidInteger(experience_years) ||
            !isValidString(description) ||
            !Array.isArray(skill_ids) || skill_ids.length === 0 ||
            !skill_ids.every((id) => isValidUUID(id))
        ) {
            return next(appError(400, "欄位未填寫正確"));
        }
        if (profile_image_url && !isValidUrl(profile_image_url)) {
            return next(appError(400, "欄位未填寫正確"));
        }

        const coachRepo = dataSource.getRepository("Coach");
        const coach = await coachRepo.findOneBy({ user_id: req.user.id });
        if (!coach) {
            return next(appError(400, "找不到教練資料"));
        }

        await coachRepo.update(
            { id: coach.id },
            {
                experience_years,
                description,
                profile_image_url: profile_image_url || null,
            }
        );

        // 技能清單的更新策略：「先全刪、再全建」。
        // 比起逐筆比對哪些要加哪些要刪，整組換掉最簡單，結果一定跟這次送來的清單一致
        const linkRepo = dataSource.getRepository("CoachLinkSkill");
        await linkRepo.delete({ coach_id: coach.id });
        await linkRepo.save(
            skill_ids.map((skillId) => ({ coach_id: coach.id, skill_id: skillId }))
        );

        res.json({
            status: "success",
            data: {
                id: coach.id,
                experience_years,
                description,
                profile_image_url: profile_image_url || null,
                skill_ids,
            },
        });
    },
};

module.exports = adminCoachesController;
