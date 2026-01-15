import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ message: '日付が指定されていません' }, { status: 400 });
    }

    // 環境変数のチェック
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

    // その日の0:00から23:59までの範囲を設定
    const timeMin = new Date(`${date}T00:00:00+09:00`).toISOString();
    const timeMax = new Date(`${date}T23:59:59+09:00`).toISOString();

    // 予約リストを取得
    const events = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
    });

    // 時間枠ごとの予約数をカウント
    const bookings: { [key: string]: number } = {};
    const items = events.data.items || [];

    items.forEach((item) => {
      const start = item.start?.dateTime || item.start?.date;
      if (start) {
        // "2024-01-01T10:00:00+09:00" -> "10:00" を抽出
        const timeKey = new Date(start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        bookings[timeKey] = (bookings[timeKey] || 0) + 1;
      }
    });

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('Availability API Error:', error);
    return NextResponse.json({ message: '取得エラー' }, { status: 500 });
  }
}