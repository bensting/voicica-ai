import { NextRequest, NextResponse } from 'next/server';
import {
  telegramLanguages,
  WELCOME_TEXT,
  TELEGRAM_APP_BASE_URL,
} from '@/config/native/telegramBotConfig';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function callTelegramAPI(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function buildLanguageKeyboard() {
  const rows = [];
  for (let i = 0; i < telegramLanguages.length; i += 2) {
    const row = telegramLanguages.slice(i, i + 2).map((lang) => ({
      text: `${lang.flag} ${lang.nativeName}`,
      url: `${TELEGRAM_APP_BASE_URL}?lang=${lang.code}`,
    }));
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

export async function POST(request: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  const update = await request.json();

  // Handle /start command
  if (update.message?.text?.startsWith('/start')) {
    await callTelegramAPI('sendMessage', {
      chat_id: update.message.chat.id,
      text: WELCOME_TEXT,
      reply_markup: buildLanguageKeyboard(),
    });
  }

  return NextResponse.json({ ok: true });
}
