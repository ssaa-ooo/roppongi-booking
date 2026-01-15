import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// 予約枠の定義（フロントエンドと合わせる）
const TIME_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // 例: "2026-01-16"

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

    // 1. その日の全イベントを取得（JST 00:00 - 23:59）
    const dayStart = new Date(`${date}T00:00:00+09:00`).toISOString();
    const dayEnd = new Date(`${date}T23:59:59+09:00`).toISOString();

    const events = await calendar.events.list({
      calendarId,
      timeMin: dayStart,
      timeMax: dayEnd,
      singleEvents: true,
    });

    const items = events.data.items || [];
    const bookings: { [key: string]: number } = {};

    // 2. 各時間枠について「重複している予定」をカウントする
    TIME_SLOTS.forEach(slotTime => {
      // 枠の開始・終了時刻を計算（JST）
      const slotStart = new Date(`${date}T${slotTime}:00+09:00`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1時間後

      let count = 0;
      items.forEach(item => {
        // イベントの開始・終了時刻
        // （all-dayイベントの場合はdateが入るが、new Date()でUTC00:00=JST09:00として扱われるため、多少ズレる可能性があるが今回は時刻指定前提）
        const eventStart = new Date(item.start?.dateTime || item.start?.date || '');
        const eventEnd = new Date(item.end?.dateTime || item.end?.date || '');

        // ★重複判定ロジック: (イベント開始 < 枠終了) かつ (イベント終了 > 枠開始)
        if (eventStart < slotEnd && eventEnd > slotStart) {
          count++;
        }
      });

      bookings[slotTime] = count;
    });

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('Availability API Error:', error);
    return NextResponse.json({ message: '取得エラー' }, { status: 500 });
  }
}