const{EntitySchema} = require('@mikro-orm/core');

module.exports = new EntitySchema({
    name: 'Coach',
    tableName: 'coaches',
    columns: {
        id:{type:"uuid", primary:true, generated:'uuid'},
        user_id:{type:"uuid", nullable:false, unique:true},
        experience_years:{type:"int", nullable:false,default:0},
        description:{type:"text", nullable:true},
        profile_image_url:{type:"varchar", length:2048, nullable:true},
        createdAt:{type:"timestamp", createDate:true},
        updatedAt:{type:"timestamp", updateDate:true},
    },
    relations: {
        user: {
            type: 'one-to-one',
            target: 'User',
            joinColumn: {name:"user_id"},
        }
    }
});