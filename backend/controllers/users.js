const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");

const PWD_ERR = "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字";

const usersController = {
  async signup(req, res, next) {
    const { name, email, password } = req.body;
    if (!isValidString(name) || !isValidString(email) || !isValidString(password)) {
      next(appError(400, "欄位為填寫正確"));
      return;
    }
    if (!isValidPassword(password)) {
      next(appError(400, PWD_ERR));
      return;
    }
    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });

    if (findUser) {
      next(appError(409, "Email 已被使用"));
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "USER",
      password: hashed,
    });
    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
        },
      },
    });
    return;
  },
  async login(req, res, next) {
    const { email, password } = req.body;
    if (!isValidString(email) || !isValidString(password)) {
      next(appError(400, "欄位為填寫正確"));
      return;
    }
    if (!isValidPassword(password)) {
      next(appError(400, PWD_ERR));
      return;
    }
    //帳號不存在「或」密碼比對錯誤（⚠️ 兩種情況共用同一句）：
    // 「使用者不存在或密碼輸入錯誤」

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({ email: email.trim().toLowerCase() });

    if (!findUser) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }
    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }
    //jwtSecret: process.env.JWT_SECRET || "defaultsecret",
    //jwtExpiresDay: process.env.JWT_EXPIRES_DAY || "30d",
    const token = await jwt.sign(
      {
        id: findUser.id,
        role: findUser.role,
      },
      config.get("secret.jwtSecret"),
      {
        expiresIn: config.get("secret.jwtExpiresDay"),
      },
    );
    res.status(201).json({
      status: "success",
      data: {
        token,
        user: {
          name: findUser.name,
        },
      },
    });
    return;
  },
  async getProfile(req, res, next) {
    res.json({
      status: "success",
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
    return;
  },
  async putPassword(req, res, next) {
    const { password, new_password, confirm_new_password } = req.body;
    if (!isValidString(password) || !isValidString(new_password) || !isValidString(confirm_new_password)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    if (!isValidPassword(password) || !isValidPassword(new_password) || !isValidPassword(confirm_new_password)) {
      next(appError(400, PWD_ERR));
      return;
    }
    if (new_password === password) {
      next(appError(400, "新密碼不能與舊密碼相同"));
      return;
    }
    if (new_password !== confirm_new_password) {
      next(appError(400, "新密碼與驗證新密碼不一致"));
      return;
    }
    const isMatch = await bcrypt.compare(password, req.user.password);

    if (!isMatch) {
      next(appError(400, "密碼輸入錯誤"));
      return;
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    const userRepo = dataSource.getRepository("User");

    await userRepo.update(req.user.id, {
      password: hashedPassword,
    });

    res.json({
      status: "success",
      data: null,
    });
    return;
  },
  async updateProfile(req, res, next) {
    const { name } = req.body;
    if (!isValidString(name)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }
    const newName = name.trim();
    if (newName === req.user.name) {
      next(appError(400, "使用者名稱未變更"));
      return;
    }
    const userRepo = dataSource.getRepository("User");
    const result = await userRepo.update(req.user.id, {
      name: newName,
    });
    if (result.affected === 0) {
      next(appError(400, "更新使用者資料失敗"));
      return;
    }
    res.json({
      status: "success",
      data: {
        user: {
          name: newName,
        },
      },
    });
    return;
  },
  async getCreditPurchases(req, res, next) {
    const userId = req.user.id;

    const creditPurchaseRepo = dataSource.getRepository("CreditPurchase");

    const creditPurchases = await creditPurchaseRepo.find({
      where: {
        user_id: userId,
      },
      relations: {
        creditPackage: true,
      },
      order: {
        purchase_at: "DESC",
      },
    });
    const data = creditPurchases.map((creditPurchase) => ({
      name: creditPurchase.creditPackage.name,
      purchased_credits: creditPurchase.purchased_credits,
      price_paid: creditPurchase.price_paid,
      purchase_at: creditPurchase.purchase_at,
    }));
    res.json({
      status: "success",
      data: data,
    });
    return;
  },
  async getUserCourses(req, res, next) {
    const userId = req.user.id;

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
    const courseBookingRepo = dataSource.getRepository("CourseBooking");

    const courseBookings = await courseBookingRepo.find({
      where: {
        user_id: userId,
      },
      relations: {
        course: {
          user: true,
        },
      },
      order: {
        course: {
          start_at: "ASC",
        },
      },
    });
    const creditUsage = courseBookings.filter((courseBooking) => courseBooking.cancelled_at === null).length;
    const creditRemain = totalPurchasedCredits - creditUsage;
    const courseBookingData = courseBookings.map((courseBooking) => ({
      course_id: courseBooking.course_id,
      name: courseBooking.course.name,
      start_at: courseBooking.course.start_at,
      end_at: courseBooking.course.end_at,
      meeting_url: courseBooking.course.meeting_url,
      coach_name: courseBooking.course.user.name,
      cancelled_at: courseBooking.cancelled_at,
    }));
    res.json({
      status: "success",
      data: {
        credit_remain: creditRemain,
        credit_usage: creditUsage,
        course_booking: courseBookingData,
      },
    });
    return;
  },
};
module.exports = usersController;
