const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");
const { IsNull } = require("typeorm");
const adminCoursesController = {
  async getAllCourses(req, res, next) {
    const courseRepo = dataSource.getRepository("Course");

    const courses = await courseRepo.find({
      where: {
        user_id: req.user.id,
      },
    });

    const courseBookingRepo = dataSource.getRepository("CourseBooking");

    const now = new Date();
    const courseList = [];
    for (const course of courses) {
      let status;

      if (now < course.start_at) {
        status = "尚未開始";
      } else if (now < course.end_at) {
        status = "進行中";
      } else {
        status = "已結束";
      }

      const participants = await courseBookingRepo.count({
        where: {
          course_id: course.id,
          cancelled_at: IsNull(),
        },
      });

      courseList.push({
        id: course.id,
        name: course.name,
        status: status,
        start_at: course.start_at,
        end_at: course.end_at,
        max_participants: course.max_participants,
        meeting_url: course.meeting_url,
        participants: participants,
      });
    }

    res.json({
      status: "success",
      data: courseList,
    });
    return;
  },
  async postCreateCourse(req, res, next) {
    const { skill_id, name, description, start_at, end_at, max_participants, meeting_url } = req.body;
    if (
      !isValidString(skill_id) ||
      !isInteger(max_participants) ||
      !isValidString(name) ||
      !isValidString(description) ||
      !isValidString(start_at) ||
      !isValidString(end_at) ||
      !isValidString(meeting_url) ||
      !meeting_url.startsWith("https") ||
      max_participants < 0
    ) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const courseRepo = dataSource.getRepository("Course");
    const newCourse = await courseRepo.save({
      user_id: req.user.id,
      skill_id: skill_id,
      description: description.trim(),
      name: name.trim(),
      start_at: start_at,
      end_at: end_at,
      max_participants: max_participants,
      meeting_url: meeting_url,
    });
    res.status(201).json({
      status: "success",
      data: {
        course: newCourse,
      },
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
