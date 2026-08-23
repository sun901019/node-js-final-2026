const {EntitySchema} = require('typeorm');

module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {type :"uuid", primary: true, generated: 'uuid'},
    name:{type:"varchar", length: 50, nullable: false},
    email: {type: 'varchar', length:320, nullable: false, unique: true},
    password: {type: 'varchar', length:255, nullable: false},
    role:{type:"varchar", length:20, nullable:false, default:"USER"},
    // ❌【原本寫錯（風格不一致）】原本叫 createdAt / updatedAt（駝峰）——
    // EntitySchema 的「屬性名」會直接變成資料庫「欄位名」，
    // 課程範例（week9）與其他表都用 snake_case（created_at），統一命名才不會查資料時混亂
    created_at: {type: 'timestamp', createDate: true},
    updated_at: {type: 'timestamp', updateDate: true},
  }
});
