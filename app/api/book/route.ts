import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, start, end } = body;

    // 環境変数のチェック
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
       return NextResponse.json({ message: 'サーバー設定エラー' }, { status: 500 });
    }

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      undefined,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/calendar.events']
    );

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // 重複チェック
    const existingEvents = await calendar.events.list({
      calendarId,
      timeMin: start,
      timeMax: end,
      singleEvents: true,
    });

    if (existingEvents.data.items && existingEvents.data.items.length > 0) {
      return NextResponse.json(
        { message: 'その時間は既に予約が入っています。' }, 
        { status: 409 }
      );
    }

    // 予約作成
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