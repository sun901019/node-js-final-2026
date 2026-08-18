const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dataSource } = require("../db/data-source");
const config = require("../config/index");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");


const PW_ERR = "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字";

const usersController = {
    async signup(req, res, next){
        const{name, email, password} = req.body
        if(!isValidString(name)||!isValidString(email)||!isValidString(password)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        if(!isValidString(password)){
            next(appError(400,PW_ERR));
            return;
        }
        const userRepo = dataSource.getRepository("User")
        const findUser = await userRepo.findOneBy({email:email.trim().toLowerCase()})
        if(findUser){
            next(appError(409,"Email 已被使用"));
            return;
        }

        const   hashed = await bcrypt.hash(password,10);

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
    async login(req, res, next){
        const{name, email, password} = req.body
        if(!isValidString(name)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        res.status(201).json({
            status: "success",
            data: {},
        })
        return;
    },
    async profile(req, res, next){
        const{name, email, password} = req.body
        if(!isValidString(name)){
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        res.status(201).json({
            status: "success",
            data: {},
        })
        return;
    },
}