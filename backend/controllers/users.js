const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");


const PW_ERR = "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字";

const usersController = {
    // POST /api/users/signup 註冊
    async signup(req, res, next){
        const{name, email, password} = req.body
        if(!isValidString(name)||!isValidString(email)||!isValidString(password)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        // ❌【原本寫錯】這裡原本又寫了一次 isValidString(password)——
        // 1. 跟上一行檢查重複，永遠不會成立（上面已擋掉非字串）
        // 2. 真正要檢查的是「密碼規則」（大小寫英數、8~16 字），要用 isValidPassword
        // 3. 而且當時 validUtils.js 根本沒有 isValidPassword，import 進來是 undefined，一呼叫就 500
        if(!isValidPassword(password)){
            next(appError(400,PW_ERR));
            return;
        }
        const userRepo = dataSource.getRepository("User")
        const findUser = await userRepo.findOneBy({email:email.trim().toLowerCase()})
        if(findUser){
            next(appError(409,"Email 已被使用"));
            return;
        }

        // bcrypt.hash(明文, 10)：10 是 salt rounds（雜湊強度）。
        // 資料庫永遠只存雜湊值，就算被偷走也還原不出原始密碼
        const hashed = await bcrypt.hash(password,10);

        const newUser  = await userRepo.save({
            name:name.trim(),
            email:email.trim().toLowerCase(),
            role:"USER",
            password:hashed
        })
        res.status(201).json({
            status: "success",
            data: {
                user:{
                    id:newUser.id,
                    name:newUser.name,
                }
            },
        })
        return;
    },

    // POST /api/users/login 登入
    async login(req, res, next){
        // ❌【原本寫錯】原本解構了 name 並檢查 isValidString(name)——
        // 但登入的 body 根本沒有 name，只有 email 和 password，所以每次登入都會被 400 擋掉。
        // 而且原本沒查資料庫、沒比對密碼、沒簽 JWT，只回了一個空的 data:{}，整支是空殼。
        const{email, password} = req.body
        if(!isValidString(email)||!isValidString(password)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }

        // ✚【補上】1. 用 email 找人（註冊時存的是小寫，這裡也要轉小寫才找得到）
        const userRepo = dataSource.getRepository("User")
        const findUser = await userRepo.findOneBy({email:email.trim().toLowerCase()})
        // 資安習慣：「帳號不存在」和「密碼錯誤」回同一句話，
        // 不讓攻擊者透過錯誤訊息「猜出哪些 Email 有註冊過」
        if(!findUser){
            next(appError(400,"使用者不存在或密碼輸入錯誤"));
            return;
        }

        // ✚【補上】2. bcrypt.compare(使用者輸入的明文, 資料庫的雜湊值)
        // 它會把明文用同一組 salt 再雜湊一次來比對——絕對不是「解密」資料庫的值
        const isMatch = await bcrypt.compare(password, findUser.password);
        if(!isMatch){
            next(appError(400,"使用者不存在或密碼輸入錯誤"));
            return;
        }

        // ✚【補上】3. 簽發 JWT。payload 必含 { id, role }（合約），exp 由 expiresIn 自動加上。
        // 之後每個需要登入的請求，isAuth 就是解開這顆 token 得知「你是誰、什麼身分」，
        // 這就是為什麼升級教練後要「重新登入」——舊 token 裡的 role 還是 USER
        const token = jwt.sign(
            { id: findUser.id, role: findUser.role },
            config.get("secret.jwtSecret"),
            { expiresIn: config.get("secret.jwtExpiresDay") }
        );

        res.status(201).json({
            status: "success",
            data: {
                token,
                user:{
                    name: findUser.name,
                }
            },
        })
        return;
    },

    // GET /api/users/profile 取得個人資料（需登入）
    async getProfile(req, res, next){
        // ❌【原本寫錯】原本從 req.body 解構 name 來驗證——但這是 GET 請求，沒有 body！
        // 「我是誰」要從 req.user 拿（isAuth middleware 驗完 token、查完資料庫塞進來的），
        // 這就是 middleware 存在的意義：controller 進來時身分已經是可信、完整的了，
        // 連資料庫都不用再查（week9 課程版 isAuth 放的是完整 User）。
        res.json({
            status: "success",
            data: {
                user:{
                    email: req.user.email,
                    name: req.user.name,
                    role: req.user.role,
                }
            },
        })
        return;
    },

    // ✚【原本缺少，補上】PUT /api/users/profile 修改暱稱（需登入）
    async updateProfile(req, res, next){
        const { name } = req.body;
        if(!isValidString(name)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        const userRepo = dataSource.getRepository("User");
        const user = await userRepo.findOneBy({ id: req.user.id });
        // 規格：新名字不能跟原本一樣
        if(user.name === name.trim()){
            next(appError(400, "使用者名稱未變更"));
            return;
        }
        // update(條件, 要改的欄位)：只改 name，其他欄位不動
        await userRepo.update({ id: req.user.id }, { name: name.trim() });
        res.json({ status: "success", data: { user: { name: name.trim() } } });
        return;
    },

    // ✚【原本缺少，補上】PUT /api/users/password 修改密碼（需登入）
    // 檢查順序是規格定好的：必填 → 符合規則 → 新舊不同 → 兩次新密碼一致 → 舊密碼比對
    async updatePassword(req, res, next){
        const { password, new_password, confirm_new_password } = req.body;
        // ① 三個欄位都必填
        if(!isValidString(password) || !isValidString(new_password) || !isValidString(confirm_new_password)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        // ② 三個都要符合密碼規則
        if(!isValidPassword(password) || !isValidPassword(new_password) || !isValidPassword(confirm_new_password)){
            next(appError(400, PW_ERR));
            return;
        }
        // ③ 新密碼不能跟舊密碼一樣
        if(new_password === password){
            next(appError(400, "新密碼不能與舊密碼相同"));
            return;
        }
        // ④ 新密碼要打兩次一致
        if(new_password !== confirm_new_password){
            next(appError(400, "新密碼與驗證新密碼不一致"));
            return;
        }
        // ⑤ 舊密碼要跟資料庫比對成功
        const userRepo = dataSource.getRepository("User");
        const user = await userRepo.findOneBy({ id: req.user.id });
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            next(appError(400, "密碼輸入錯誤"));
            return;
        }
        // 新密碼一樣要先雜湊才能存
        const hashed = await bcrypt.hash(new_password, 10);
        await userRepo.update({ id: req.user.id }, { password: hashed });
        res.json({ status: "success", data: null });
        return;
    },

    // ✚【原本缺少，補上/M5】GET /api/users/credit-package 本人的購買紀錄（需登入）
    async getCreditPackage(req, res, next){
        const purchases = await dataSource.getRepository("CreditPurchase").find({
            where: { user_id: req.user.id },
            relations: { creditPackage: true },   // JOIN credit_packages，才能拿到方案名稱
            order: { purchase_at: "DESC" },        // 規格：新的在前
        });
        // map：把「資料庫的形狀」轉成「API 規格的形狀」，只露出該露的欄位
        const data = purchases.map((p) => ({
            name: p.creditPackage.name,
            purchased_credits: p.purchased_credits,
            price_paid: p.price_paid,
            purchase_at: p.purchase_at,
        }));
        res.json({ status: "success", data });
        return;
    },

    // ✚【原本缺少，補上/M5】GET /api/users/courses 我的課表（需登入）
    // 核心觀念：剩餘堂數「沒有欄位」，是即時算出來的 → 總購買堂數 − 未取消報名數
    async getCourses(req, res, next){
        const purchaseRepo = dataSource.getRepository("CreditPurchase");
        const bookingRepo = dataSource.getRepository("CourseBooking");

        // ① 買過的全部堂數加總
        const purchases = await purchaseRepo.find({ where: { user_id: req.user.id } });
        const totalCredits = purchases.reduce((sum, p) => sum + p.purchased_credits, 0);

        // ② 全部報名紀錄（含已取消的——課表要顯示，只是標記 cancelled_at）
        //    relations: { course: { user: true } } → 兩層 JOIN：booking → course → 開課教練
        const allBookings = await bookingRepo.find({
            where: { user_id: req.user.id },
            relations: { course: { user: true } },
            order: { course: { start_at: "ASC" } },
        });

        // ③ 只有「未取消」的才耗堂數
        const creditUsage = allBookings.filter((b) => !b.cancelled_at).length;
        const creditRemain = totalCredits - creditUsage;

        const courseBooking = allBookings.map((b) => ({
            course_id: b.course_id,
            name: b.course.name,
            start_at: b.course.start_at,
            end_at: b.course.end_at,
            meeting_url: b.course.meeting_url,
            coach_name: b.course.user.name,  // 走 relation 兩層拿到的教練名字
            cancelled_at: b.cancelled_at,
        }));

        res.json({
            status: "success",
            data: {
                credit_remain: creditRemain,
                credit_usage: creditUsage,
                course_booking: courseBooking,
            },
        });
        return;
    },
}

// ❌【原本寫錯】整個檔案最後「忘記 module.exports」——
// 沒有這行，routes/users.js require 進來只會拿到空物件 {}，
// 所有 usersController.xxx 都是 undefined，掛路由瞬間就報錯。
module.exports = usersController;
