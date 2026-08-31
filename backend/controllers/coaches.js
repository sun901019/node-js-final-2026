const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const coachesController = {
  async getCoaches(req, res, next) {
    const { per, page } = req.query;
    if (!isValidString(per) || !isValidString(page)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const perNumber = Number(per);
    const pageNumber = Number(page);
    if (!isInteger(perNumber) || !isInteger(pageNumber) || perNumber < 0 || pageNumber < 1) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const coachRepo = dataSource.getRepository("Coach");

    let coaches = [];

    if (perNumber > 0) {
      coaches = await coachRepo.find({
        relations: {
          user: true,
        },
        skip: (pageNumber - 1) * perNumber,
        take: perNumber,
      });
    }
    const data = coaches.map((coach) => ({
      id: coach.id,
      user_id: coach.user_id,
      name: coach.user.name,
    }));

    res.json({
      status: "success",
      data: data,
    });
    return;
  },
  async getCoach(req, res, next) {
    const { coachId } = req.params;
    if (!isValidString(coachId) || coachId === "undefined") {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const coachRepo = dataSource.getRepository("Coach");

    const coach = await coachRepo.findOne({
      where: {
        id: coachId,
      },
      relations: {
        user: true,
      },
    });

    if (!coach) {
      next(appError(400, "找不到該教練"));
      return;
    }
    const coachLinkSkillRepo = dataSource.getRepository("CoachLinkSkill");

    const coachLinkSkills = await coachLinkSkillRepo.find({
      where: {
        coach_id: coachId,
      },
      relations: {
        skill: true,
      },
    });
    const skills = coachLinkSkills.map((coachLinkSkill) => coachLinkSkill.skill.name);
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
          created_at: coach.created_at,
          updated_at: coach.updated_at,
          skills,
        },
      },
    });
    return;
  },
  async getCoachCourses(req, res, next) {
    res.json({
      status: "success",
      data: {},
    });
    return;
  },
};
module.exports = coachesController;
