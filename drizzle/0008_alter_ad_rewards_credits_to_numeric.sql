ALTER TABLE "daily_tasks" ALTER COLUMN "ad_rewards_credits" SET DATA TYPE numeric(12, 4) USING "ad_rewards_credits"::numeric(12, 4);
