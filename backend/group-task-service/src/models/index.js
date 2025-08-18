const { sequelize }= require("../config/database");
const Group = require("./Group");
const GroupMember = require("./GroupMember");

// 🔗 Buat relasi
Group.hasMany(GroupMember, { foreignKey: "groupId", as: "members" });
GroupMember.belongsTo(Group, { foreignKey: "groupId" });

module.exports = {
  sequelize,
  Group,
  GroupMember,
};
