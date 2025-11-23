-- 将 voice_sample_url 从 text 转换为 json 格式
-- 现有数据转换为 {"default": 原有url} 格式

-- 1. 先将现有的 text 列转换为 json，并将数据包装为 {"default": url} 格式
ALTER TABLE voices
ALTER COLUMN voice_sample_url TYPE json
USING jsonb_build_object('default', voice_sample_url)::json;