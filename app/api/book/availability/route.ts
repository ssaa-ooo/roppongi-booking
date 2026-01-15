import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // "2026-01-16"

    if (!date) {
      return NextResponse.json({ message: '日付が指定されていません' }, { status: 400 });
    }

    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_CALENDAR_ID) {
       return NextResponse.json({ message: 'サーバー設定エラー' }, { status: 500 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // JSTの00:00:00〜23:59:59を正確にISO形式（UTC）に変換して検索範囲にする
    // 例: 日本の 1/16 00:00 は、UTCの 1/15 15:00
    const timeMin = new Date(`${date}T00:00:00+09:00`).toISOString();
    const timeMax = new Date(`${date}T23:59:59+09:00`).toISOString();

    const events = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
    });

    const bookings: { [key: string]: number } = {};
    const items = events.data.items || [];

    items.forEach((item) => {
      const start = item.start?.dateTime || item.start?.date;
      if (start) {
        // ★ここが修正ポイント：サーバーの時間は無視して「Asia/Tokyo」として時間を抽出する
        const dateObj = new Date(start);
        const timeKey = new Intl.DateTimeFormat('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Tokyo', // 強制的に日本時間で解釈
        }).format(dateObj);

        // "10:00" のような形式でカウントアップ
        bookings[timeKey] = (bookings[timeKey] || 0) + 1;
      }
    });

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('Availability API Error:', error);
    return NextResponse.json({ message: '取得エラー' }, { status: 500 });
  }
}