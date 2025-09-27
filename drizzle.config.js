// export default {
//   schema: "./src/db/schema.js",
//   dialect: "mysql",
//   out: "./drizzle",
//   dbCredentials: {
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     port: 3306,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//   },
// };

//NOTE: Migrate to supabase
// drizzle.config.js
import "dotenv/config";

export default {
  schema: "./src/db/schema.js",
  dialect: "postgresql", // Ganti dari "mysql"
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL, // Gunakan URL database Supabase
  },
};
