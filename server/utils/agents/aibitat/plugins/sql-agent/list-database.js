module.exports.SqlAgentListDatabase = {
  name: "sql-list-databases",
  plugin: function () {
    const { listSQLConnections } = require("./SQLConnectors");
    return {
      name: "sql-list-databases",
      setup(aibitat) {
        aibitat.function({
          super: aibitat,
          name: this.name,
          description:
            "Use this tool to proactively list all available databases you have access to when you need to fetch data or answer user questions related to data. You do not need explicit keywords like 'connect sql' to use this. Returns a unique string identifier `database_id` that can be used for future calls.",
          examples: [
            {
              prompt: "What databases can you access?",
              call: JSON.stringify({}),
            },
            {
              prompt: "What databases can you tell me about?",
              call: JSON.stringify({}),
            },
            {
              prompt: "Is there a database named erp-logs you can access?",
              call: JSON.stringify({}),
            },
          ],
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {},
            additionalProperties: false,
          },
          handler: async function () {
            this.super.handlerProps.log(`Using the sql-list-databases tool.`);
            this.super.introspect(
              `${this.caller}: Checking what are the available databases.`
            );

            const connections = (await listSQLConnections()).map((conn) => {
              const { connectionString: _connectionString, ...rest } = conn;
              return rest;
            });
            return JSON.stringify(connections);
          },
        });
      },
    };
  },
};
