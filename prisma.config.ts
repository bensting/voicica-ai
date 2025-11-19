import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// 加载 .env.local 环境变量
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
