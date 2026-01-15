import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// 30分刻みの時間枠を生成 (10:00 - 18:00)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 10; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

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

    // 各30分枠について、重なっている予約をカウント
    TIME_SLOTS.forEach(slotTime => {
      const slotStart = new Date(`${date}T${slotTime}:00+09:00`);
      // 枠の終了は30分後
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      let count = 0;
      items.forEach(item => {
        const eventStart = new Date(item.start?.dateTime || item.start?.date || '');
        const eventEnd = new Date(item.end?.dateTime || item.end?.date || '');

        // 重複判定: イベントがこの30分枠に少しかかっていればカウント
        if (eventStart < slotEnd && eventEnd > slotStart) {
          count++;
        }
      });

      bookings[slotTime] = count;
    });

    return NextResponse.json({ bookings, slots: TIME_SLOTS });

  } catch (error) {
    console.error('Availability API Error:', error);
    return NextResponse.json({ message: '取得エラー' }, { status: 500 });
  }
}