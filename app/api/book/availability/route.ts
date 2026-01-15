import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// 10:00 〜 18:30 までの30分刻みリストを生成
const TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // 日付がない場合はリストだけ返してエラーにしない（フロントエンドの描画用）
    if (!date) {
      return NextResponse.json({ bookings: {}, slots: TIME_SLOTS });
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

    // JSTでの検索範囲設定
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

    // 重複カウントロジック
    TIME_SLOTS.forEach(slotTime => {
      const slotStart = new Date(`${date}T${slotTime}:00+09:00`);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30分後

      let count = 0;
      items.forEach(item => {
        const eventStart = new Date(item.start?.dateTime || item.start?.date || '');
        const eventEnd = new Date(item.end?.dateTime || item.end?.date || '');

        // 判定: 予定がこの30分枠と少しでも被っていればカウント
        if (eventStart < slotEnd && eventEnd > slotStart) {
          count++;
        }
      });
      bookings[slotTime] = count;
    });

    // bookings（予約数）と slots（時間リスト）の両方を返す
    return NextResponse.json({ bookings, slots: TIME_SLOTS });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ message: '取得エラー' }, { status: 500 });
  }
}