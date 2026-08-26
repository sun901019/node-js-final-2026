const { EntitySchema, JoinColumn } = require("typeorm");
module.exports = new EntitySchema({
    name: "Coach",
    tableName: "coaches",
    columns: {
        id: {
            type: "uuid",
            primary: "true",
            generated: "uuid",
        },
        user_id: {
            type: "uuid",
            nullable: "false",
            unique: true,
        },
        experence_years: {
            type: "integer",
            nullable: false,
        },
        description: {
            type: "text",
            nullable: false,
        },
        profile_image_url: {
            type: "varchar",
            length: 2048,
            nullable: true,
        },
        created_at: {
            type: "timestamp",
            createDate: true,
        },
        updated_at: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        user: {
            type: "one-to-one",
            target: "User",
            JoinColumn: {
                name: "user_id",
            },
        },
    },
});
