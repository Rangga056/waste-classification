export default {
  schema: "./src/db/schema.js",
  dialect: "mysql",
  out: "./drizzle",
  dbCredentials: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: 3306,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
