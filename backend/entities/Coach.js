const{EntitySchema} = require('typeorm');

module.exports = new EntitySchema({
    name: 'Coach',
    tableName: 'coaches',
    columns: {
        id:{type:"uuid", primary:true, generated:'uuid'},
        user_id:{type:"uuid", nullable:false, unique:true},
        experience_years:{type:"int", nullable:false,default:0},
        description:{type:"text", nullable:true},
        profile_image_url:{type:"varchar", length:2048, nullable:true},
        // ❌【原本寫錯（風格不一致）】createdAt/updatedAt → created_at/updated_at（對齊 week9 範例；
        // M4 教練列表要 order by created_at ASC，欄位名一致 controller 才好寫）
        created_at:{type:"timestamp", createDate:true},
        updated_at:{type:"timestamp", updateDate:true},
    },
    relations: {
        user: {
            type: 'one-to-one',
            target: 'User',
            joinColumn: {name:"user_id"},
        }
    }
});
