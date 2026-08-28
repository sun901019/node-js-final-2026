const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const adminCoachesController = {
    async postPromoteCoach(req, res, next) {
        const { userId } = req.params;
        const { experience_years, description, profile_image_url } = req.body;
        if (!isInteger(experience_years) || experience_years < 0 || !isValidString(description)) {
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        const isInvalidProfileImageUrl =
            profile_image_url !== undefined &&
            profile_image_url !== "" &&
            (!isValidString(profile_image_url) || !profile_image_url.startsWith("https"));
        if (isInvalidProfileImageUrl) {
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        const userRepo = dataSource.getRepository("User");
        const findUser = await userRepo.findOneBy({
            id: userId,
        });
        if (!findUser) {
            next(appError(400, "使用者不存在"));
            return;
        }
        if (findUser.role === "COACH") {
            next(appError(409, "使用者已經是教練"));
            return;
        }
        const coachRepo = dataSource.getRepository("Coach");
        const newCoach = await coachRepo.save({
            user_id: userId,
            experience_years,
            description: description.trim(),
            profile_image_url: profile_image_url || null,
        });
        findUser.role = "COACH";
        const updatedUser = await userRepo.save(findUser);

        res.status(201).json({
            status: "success",
            data: {
                user: {
                    name: updatedUser.name,
                    role: updatedUser.role,
                },
                coach: newCoach,
            },
        });
        return;
    },
    async getCoachProfile(req, res, next) {
        const coachRepo = dataSource.getRepository("Coach");
        const findCoach = await coachRepo.findOneBy({
            user_id: req.ues.id,
        });
        const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");
        const coachLinkSkills = await coachLinkSkillRepo.find({
            where: {
                coach_id: findCoach.id,
            },
            select: {
                skill_id: true,
            },
        });
        const skillIds = coachLinkSkills.map((coachLinkSkill) => coachLinkSkill.skill_id);
        res.json({
            status: "success",
            data: {
                id: findCoach.id,
                experience_years: findCoach.experience_years,
                description: findCoach.description,
                profile_image_url: findCoach.profile_image_url,
                skill_ids: skillIds,
            },
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
