"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    startTime: "10:00",
    endTime: "11:00",
  });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("予約処理中...");

    // 日時を結合してISO形式に変換 (例: 2024-01-01T10:00:00)
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
      }),
    });

    if (res.ok) {
      setStatus("予約が完了しました！カレンダーを確認してください。");
      setFormData({ ...formData, name: "", email: "" }); // フォームをクリア
    } else {
      const errorData = await res.json();
      setStatus(`エラー: ${errorData.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          ラウンジ予約
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">お名前</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">日付</label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">開始時間</label>
              <input
                type="time"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">終了時間</label>
              <input
                type="time"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            予約する
          </button>
        </form>

        {status && (
          <div className={`mt-4 p-3 rounded text-center text-sm ${status.includes("完了") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}