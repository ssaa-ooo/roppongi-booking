import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, start, end } = body;

    // 1. 環境変数のチェック
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_CALENDAR_ID) {
       return NextResponse.json({ message: 'サーバー設定エラー: 環境変数が不足しています' }, { status: 500 });
    }

    // 2. Google認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    
    // ★ ここで定員数を設定（6名）
    const MAX_CAPACITY = 6;

    // 3. 予約状況の確認
    const existingEvents = await calendar.events.list({
      calendarId,
      timeMin: start,
      timeMax: end,
      singleEvents: true,
    });

    // 現在の予約数をカウント
    const currentBookings = existingEvents.data.items ? existingEvents.data.items.length : 0;

    // 定員オーバーならエラーを返す
    if (currentBookings >= MAX_CAPACITY) {
      return NextResponse.json(
        { message: `申し訳ありません。その時間は満席です。（定員${MAX_CAPACITY}名に達しました）` }, 
        { status: 409 }
      );
    }

    // 4. 予約作成
    await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `予約: ${name}様`,
        description: `Email: ${email}\nラウンジ利用`,
        start: { dateTime: start },
        end: { dateTime: end },
      },
    });

    return NextResponse.json({ message: '予約完了' }, { status: 200 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ message: 'エラーが発生しました' }, { status: 500 });
  }
}