// ✚【全新檔案，原本缺少/M6】教練月營收統計（isAuth + isCoach）
// 三條最容易踩雷的語意：
// ① 報名算哪個月 → 看「報名建立時間」course_bookings.created_at，不是上課時間；年份固定當年
// ② month 收「英文小寫月份名」（january ~ december），不是數字
// ③ 單堂均價 = 全部方案 Σprice ÷ Σcredit_amount；營收 = floor(當月未取消報名數 × 均價)
//    —— floor 在「乘完之後」才做，先 floor 均價再乘會算錯
const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");

const MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
];

const adminRevenueController = {
    // GET /api/admin/coaches/revenue?month=august
    async getRevenue(req, res, next) {
        const { month } = req.query;
        // indexOf 一石二鳥：不在清單裡回 -1（擋掉沒填/亂填），在清單裡回 0~11（剛好當月份索引）
        const monthIndex = MONTH_NAMES.indexOf(String(month || "").toLowerCase());
        if (monthIndex === -1) {
            return next(appError(400, "欄位未填寫正確"));
        }
        const year = new Date().getFullYear(); // 年份固定為「伺服器當年」

        // 為什麼用原生 SQL？TypeORM 的 find() 寫不出 EXTRACT(MONTH FROM ...) 這種 PostgreSQL 函式。
        // $1/$2/$3 是「參數化查詢」：值由驅動安全代入，不是字串拼接 → 防 SQL injection。
        // JOIN 的原因：報名表只有 course_id，「這堂課是誰開的」要接到 courses 表的 user_id 才知道
        const bookings = await dataSource.query(
            `SELECT cb.user_id
             FROM course_bookings cb
             JOIN courses c ON c.id = cb.course_id
             WHERE c.user_id = $1
               AND cb.cancelled_at IS NULL
               AND EXTRACT(YEAR FROM cb.created_at) = $2
               AND EXTRACT(MONTH FROM cb.created_at) = $3`,
            [req.user.id, year, monthIndex + 1] // EXTRACT(MONTH) 回 1~12，所以索引要 +1
        );

        // course_count 欄位名有誤導性：語意是「該月未取消的報名『筆數』」，不是課程數（Swagger 規格）
        const courseCount = bookings.length;
        // participants = 不重複的學員數：同一人報兩堂課只算一個人 → 用 Set 去重
        const participants = new Set(bookings.map((b) => b.user_id)).size;

        // 單堂均價：用「全部」方案（不分教練）的總價 ÷ 總堂數
        const packages = await dataSource.getRepository("CreditPackage").find();
        const totalPrice = packages.reduce((sum, p) => sum + Number(p.price), 0);
        const totalCredits = packages.reduce((sum, p) => sum + Number(p.credit_amount), 0);
        // 防呆：一個方案都沒有時分母是 0，0/0 = NaN 會讓回應變垃圾 → 直接視為均價 0
        const perCreditPrice = totalCredits === 0 ? 0 : totalPrice / totalCredits;

        // floor 放最外層：先乘、最後才無條件捨去（規格明定順序）
        const revenue = Math.floor(courseCount * perCreditPrice);

        res.json({
            status: "success",
            data: {
                total: {
                    revenue,
                    participants,
                    course_count: courseCount,
                },
            },
        });
    },
};

module.exports = adminRevenueController;
