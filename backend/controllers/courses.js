const { dataSource } = require("../db/data-source");
const { LessThanOrEqual, MoreThan, IsNull } = require("typeorm");
const appError = require("../utils/appError");

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
  async postCourseBooking(req, res, next) {
    const { courseId } = req.params;
    const userId = req.user.id;
    const courseRepo = dataSource.getRepository("Course");

    const course = await courseRepo.findOneBy({
      id: courseId,
    });
    if (!course) {
      next(appError(400, "ID錯誤"));
      return;
    }
    const courseBookingRepo = dataSource.getRepository("CourseBooking");

    const existingCourseBooking = await courseBookingRepo.findOneBy({
      user_id: userId,
      course_id: courseId,
    });
    if (existingCourseBooking) {
      next(appError(400, "已經報名過此課程"));
      return;
    }
    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");

    const creditPurchases = await creditPurchaseRepo.find({
      where: {
        user_id: userId,
      },
    });

    const totalPurchasedCredits = creditPurchases.reduce(
      (total, creditPurchase) => total + creditPurchase.purchased_credits,
      0,
    );

    const creditUsage = await courseBookingRepo.count({
      where: {
        user_id: userId,
        cancelled_at: IsNull(),
      },
    });

    const creditRemain = totalPurchasedCredits - creditUsage;

    if (creditRemain <= 0) {
      next(appError(400, "已無可使用堂數"));
      return;
    }
    const participantCount = await courseBookingRepo.count({
      where: {
        course_id: courseId,
        cancelled_at: IsNull(),
      },
    });
    if (participantCount >= course.max_participants) {
      next(appError(400, "已達最大參加人數，無法參加"));
      return;
    }
    await courseBookingRepo.save({
      user_id: userId,
      course_id: courseId,
    });
    res.status(201).json({
      status: "success",
      data: null,
    });
    return;
  },
  async cancelCourseBooking(req, res, next) {
    const { courseId } = req.params;
    const userId = req.user.id;
    const courseBookingRepo = dataSource.getRepository("CourseBooking");

    const courseBooking = await courseBookingRepo.findOneBy({
      user_id: userId,
      course_id: courseId,
      cancelled_at: IsNull(),
    });

    if (!courseBooking) {
      next(appError(400, "ID錯誤"));
      return;
    }
    courseBooking.cancelled_at = new Date();

    await courseBookingRepo.save(courseBooking);
    res.status(200).json({
      status: "success",
      data: null,
    });
    return;
  },
};
module.exports = coursesController;
