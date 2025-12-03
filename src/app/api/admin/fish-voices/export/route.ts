import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminWithoutDb } from '@/lib/auth-admin';
import * as XLSX from 'xlsx';

/**
 * Fish Audio API 返回的模型信息
 */
interface FishVoiceModel {
  _id: string;
  title: string;
  description: string;
  cover_image: string;
  train_mode: string;
  state: string;
  tags: string[];
  languages: string[];
  visibility: string;
  like_count: number;
  mark_count: number;
  task_count: number;
  created_at: string;
  updated_at: string;
  author: {
    _id: string;
    nickname: string;
    avatar: string;
  };
}

/**
 * 获取 Fish Audio API Token
 */
function getFishApiToken(): string {
  const token = process.env.FISH_AUDIO_API_KEY;
  if (!token) {
    throw new Error('未配置 FISH_AUDIO_API_KEY 环境变量');
  }
  return token;
}

/**
 * 构建封面图 URL
 */
function buildCoverImageUrl(coverImage: string): string {
  if (!coverImage) return '';
  if (coverImage.startsWith('http')) return coverImage;
  return `https://public-platform.r2.fish.audio/cdn-cgi/image/width=200,format=webp/${coverImage}`;
}

/**
 * 从 Fish Audio API 获取语音模型列表
 */
async function fetchVoicesFromFish(
  pageSize: number,
  pageNumber: number,
  language?: string
): Promise<{ total: number; items: FishVoiceModel[] }> {
  const token = getFishApiToken();

  let url = `https://api.fish.audio/model?page_size=${pageSize}&page_number=${pageNumber}`;
  if (language) {
    url += `&language=${language}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Fish Audio API 请求失败: ${response.status}`);
  }

  return await response.json();
}

/**
 * 将模型转换为 Excel 行
 */
function modelToExcelRow(model: FishVoiceModel, index: number) {
  return {
    序号: index + 1,
    ID: model._id,
    名称: model.title,
    描述: model.description,
    作者: model.author?.nickname || 'Unknown',
    语言: model.languages.join(', '),
    使用次数: model.task_count,
    点赞数: model.like_count,
    收藏数: model.mark_count,
    标签: model.tags?.join(', ') || '',
    训练模式: model.train_mode,
    状态: model.state,
    可见性: model.visibility,
    创建时间: model.created_at,
    更新时间: model.updated_at,
    封面图: buildCoverImageUrl(model.cover_image),
  };
}

/**
 * GET /api/admin/fish-voices/export?language=zh
 * 导出 Fish Audio 语音列表为 Excel（流式下载）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await verifyAdminWithoutDb();

    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || undefined;

    console.log(`📊 开始导出 Fish Audio 语音数据 (语言: ${language || '全部'})...`);

    const batchSize = 10000;
    let pageNumber = 1;
    let totalFetched = 0;
    let total = 0;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    let worksheet: XLSX.WorkSheet | null = null;

    // 分批获取数据
    while (true) {
      console.log(`📊 获取第 ${pageNumber} 批数据...`);
      const data = await fetchVoicesFromFish(batchSize, pageNumber, language);

      if (pageNumber === 1) {
        total = data.total;
        console.log(`📊 总共 ${total} 条数据`);
      }

      if (data.items.length === 0) {
        break;
      }

      // 转换为 Excel 行数据
      const rows = data.items.map((model, index) =>
        modelToExcelRow(model, totalFetched + index)
      );

      if (worksheet === null) {
        worksheet = XLSX.utils.json_to_sheet(rows);
      } else {
        XLSX.utils.sheet_add_json(worksheet, rows, {
          skipHeader: true,
          origin: -1,
        });
      }

      totalFetched += data.items.length;
      console.log(`📊 已获取 ${totalFetched}/${total} 条`);

      if (totalFetched >= total || data.items.length < batchSize) {
        break;
      }

      pageNumber++;
    }

    if (!worksheet) {
      return NextResponse.json({ error: '没有数据可导出' }, { status: 404 });
    }

    // 添加工作表
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fish Voices');

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 30 },
      { wch: 50 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 30 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 60 },
    ];

    // 生成 buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 生成文件名
    const languageLabel = language ? `_${language}` : '';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `fish_voices${languageLabel}_${dateStr}.xlsx`;

    console.log(`✅ Excel 生成成功: ${filename} (${totalFetched} 条数据)`);

    // 返回文件下载
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导出失败' },
      { status: 500 }
    );
  }
}