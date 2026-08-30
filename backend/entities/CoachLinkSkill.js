const { EntitySchema } = require("typeorm");
module.exports = new EntitySchema({
  name: "CoachLinkSkill",
  tableName: "coach_link_skill",
  columns: {
    coach_id: {
      type: "uuid",
      nullable: false,
      primary: true,
    },
    skill_id: {
      type: "uuid",
      nullable: false,
      primary: true,
    },
  },
  relations: {
    coach: {
      type: "many-to-one",
      target: "Coach",
      joinColumn: {
        name: "coach_id",
      },
      onDelete: "CASCADE",
    },
    skill: {
      type: "many-to-one",
      target: "Skill",
      joinColumn: {
        name: "skill_id",
      },
      onDelete: "CASCADE",
    },
  },
});
