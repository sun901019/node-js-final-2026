const { dataSource } = require("../db/data-source");
const { LessThanOrEqual, MoreThan } = require("typeorm");

const coursesController = {
  async getOngoingCourses(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");
    const now = new Date();

    const courses = await courseRepo.find({
      where: {
        start_at: LessThanOrEqual(now),
        end_at: MoreThan(now),
      },
      relations: {
        user: true,
        skill: true,
      },
    });
    const data = courses.map((course) => ({
      id: course.id,
      name: course.name,
      description: course.description,
      start_at: course.start_at,
      end_at: course.end_at,
      max_participants: course.max_participants,
      coach_name: course.user.name,
      skill_name: course.skill.name,
    }));
    res.json({
      status: "success",
      data: data,
    });
    return;
  },
};
module.exports = coursesController;
