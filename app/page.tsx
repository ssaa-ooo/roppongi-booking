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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* ヘッダーエリア */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400"></div>
          <p className="text-blue-200 text-xs tracking-[0.3em] font-medium mb-2">RESERVATION</p>
          <h1 className="text-3xl font-light text-white tracking-wider">
            ROPPONGI LOUNGE
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">
            ボーネルンド六本木店 特別ラウンジ予約
          </p>
        </div>

        {/* フォームエリア */}
        <div className="p-8 md:p-10">
          {status === "success" ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank you</h2>
              <p className="text-slate-500">ご予約を受け付けました。<br/>当日のお越しをお待ちしております。</p>
              <button 
                onClick={() => setStatus("")}
                className="mt-8 text-sm text-slate-500 underline hover:text-slate-800"
              >
                続けて予約する
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 名前 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="お名前を入力"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="sample@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* 日付 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200 text-slate-700"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* 時間選択 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200 text-slate-700"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    End Time
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200 text-slate-700"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* エラーメッセージ */}
              {status && status !== "success" && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center">
                  <span className="mr-2">⚠️</span> {status}
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg text-white font-medium tracking-wide shadow-lg transition duration-300 transform hover:-translate-y-0.5
                  ${loading 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 hover:shadow-xl"
                  }`}
              >
                {loading ? "PROCESSING..." : "RESERVE NOW"}
              </button>

              <p className="text-center text-xs text-slate-400 mt-4">
                ※ 同時刻の定員は6名様までとなります
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}