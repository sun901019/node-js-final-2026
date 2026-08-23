const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidUUID } = require("../utils/validUtils");

const skillController ={
    async getSkill(req, res, next){
        const skills = await dataSource.getRepository("Skill").find({
            select:{id: true, name:true},
        })
        res.json({status: 'success', data: skills,
        });
        return;
    },
    async postSkill(req, res, next){
        const { name } = req.body;
        if(!isValidString(name)){
            // ❌【原本寫錯】錯字：「欄位『為』填寫正確」→ 規格是「欄位『未』填寫正確」。
            // 測試只驗 4xx + status:failed 所以不會因此紅燈，但錯誤訊息是給前端使用者看的，要跟 Swagger 一致
            next(appError(400, "欄位未填寫正確"));
            return;
        }

        const skillRepo = dataSource.getRepository("Skill");
        const findSkill = await skillRepo.findOneBy({name: name.trim() });

        if(findSkill){
            next(appError(409, "資料重複"))
            return;
        }
        const newSkill = await skillRepo.save({name: name.trim()});

        res.json({
            status: 'success',
            data: newSkill,
        });
        return;
    },
    async deleteSkill(req, res, next){
        const { skillId } = req.params;
        // ✚【原本缺少，補上】先擋「uuid 格式不合法」的 id（例如 /skill/abc）。
        // 不擋的話 PostgreSQL 會丟 invalid input syntax for type uuid → 變成 500，而規格期望 4xx
        if(!isValidUUID(skillId)){
            next(appError(400,"ID錯誤"));
            return;
        }
        const result = await dataSource.getRepository("Skill").delete(skillId);
        if(result.affected === 0 ) {
            next(appError(400,"ID錯誤"));
            return
        }
        res.json({status: 'success',
        });
        return;
    },
};
module.exports = skillController