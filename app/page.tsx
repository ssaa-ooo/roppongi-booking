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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
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

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setFormData({ ...formData, name: "", email: "" });
      } else {
        setStatus(data.message || "予約エラーが発生しました");
      }
    } catch (error) {
      console.error(error);
      setStatus("システムエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans text-gray-800">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
        
        {/* ヘッダーエリア (キドキドブルー) */}
        <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            ボーネルンド六本木店
          </h1>
          <p className="text-blue-100 text-sm mt-1 font-medium">
            特別ラウンジ予約フォーム
          </p>
        </div>

        {/* フォームエリア */}
        <div className="p-8 md:p-10">
          {status === "success" ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">ご予約ありがとうございます</h2>
              <p className="text-gray-600">予約を受け付けました。<br/>当日のお越しをお待ちしております。</p>
              <button 
                onClick={() => setStatus("")}
                className="mt-8 text-sm text-blue-600 underline hover:text-blue-800 font-medium"
              >
                続けて予約する
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 名前 */}
              <div>
                <label className="block text-sm font-bold text-blue-600 mb-2">
                  お名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例：ボーネルンド 太郎"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-bold text-blue-600 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="sample@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* 日付 */}
              <div>
                <label className="block text-sm font-bold text-blue-600 mb-2">
                  ご利用日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-700"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* 時間選択 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-2">
                    開始時間 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-700"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-2">
                    終了時間 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-700"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* エラーメッセージ */}
              {status && status !== "success" && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg flex items-start border border-red-200">
                  <span className="mr-2 text-lg">⚠️</span> <span>{status}</span>
                </div>
              )}

              {/* 送信ボタン (キドキドブルー) */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg tracking-wide shadow-md transition duration-300 transform hover:-translate-y-0.5
                  ${loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                  }`}
              >
                {loading ? "処理中..." : "予約する"}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                ※ 同時刻の定員は6名様までとなります。<span className="text-red-500">*</span> は必須項目です。
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}