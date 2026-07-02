const prisma = require("../utils/prisma");

const SubAgents = {
  create: async (data) => {
    try {
      const subAgent = await prisma.sub_agents.create({
        data,
      });
      return { subAgent, message: null };
    } catch (error) {
      console.error(error.message);
      return { subAgent: null, message: error.message };
    }
  },

  update: async (uuid, data) => {
    try {
      const subAgent = await prisma.sub_agents.update({
        where: { uuid },
        data,
      });
      return { subAgent, message: null };
    } catch (error) {
      console.error(error.message);
      return { subAgent: null, message: error.message };
    }
  },

  delete: async (uuid) => {
    try {
      await prisma.sub_agents.delete({
        where: { uuid },
      });
      return { success: true, message: null };
    } catch (error) {
      console.error(error.message);
      return { success: false, message: error.message };
    }
  },

  get: async (where = {}) => {
    try {
      const subAgents = await prisma.sub_agents.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
      });
      return subAgents;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  getOne: async (where = {}) => {
    try {
      const subAgent = await prisma.sub_agents.findFirst({
        where,
      });
      return subAgent;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },
};

module.exports = { SubAgents };
