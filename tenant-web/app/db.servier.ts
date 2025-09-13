import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is not set");
}
const sql = postgres(dbUrl, { max: 10 });

export default sql;
