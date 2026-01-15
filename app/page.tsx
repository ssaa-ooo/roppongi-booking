"use client";

import { useState, useEffect } from "react";

// 予約可能な時間枠の定義
const TIME_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", 
  "14:00", "15:00", "16:00", "17:00", "18:00"
];

const MAX_CAPACITY = 6;

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    time: "", // 時間は1つ選ぶ形式に変更
  });
  
  const [availability, setAvailability] = useState<{ [key: string]: number }>({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // 日付が変わったら空き状況を取得
  useEffect(() => {
    if (formData.date) {
      checkAvailability(formData.date);
    }
  }, [formData.date]);

  const checkAvailability = async (date: string) => {
    setChecking(true);
    setAvailability({}); // リセット
    try {
      const res = await fetch(`/api/availability?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailability(data.bookings || {});
      }
    } catch (error) {
      console.error("空き状況取得エラー", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
      setStatus("時間を選択してください");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      // 終了時間は自動で1時間後に設定
      const [hour, minute] = formData.time.split(":").map(Number);
      const endHour = hour + 1;
      const endTimeString = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(`${formData.date}T${endTimeString}`);

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
        setFormData({ ...formData, name: "", email: "", time: "" });
        // 予約後に空き状況を再取得して更新
        checkAvailability(formData.date);
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

  // 空き状況に応じたマークとスタイルを返す関数
  const getSlotStatus = (time: string) => {
    const count = availability[time] || 0;
    const remaining = MAX_CAPACITY - count;

    if (remaining <= 0) return { label: "× 満席", style: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed", disabled: true };
    if (remaining <= 2) return { label: `△ 残り${remaining}`, style: "bg-white border-orange-300 text-orange-600 hover:bg-orange-50", disabled: false };
    return { label: "◎ 空きあり", style: "bg-white border-blue-200 text-blue-600 hover:bg-blue-50", disabled: false };
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans text-gray-800">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
        
        {/* ヘッダーエリア */}
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
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

              {/* 時間枠選択エリア */}
              {formData.date && (
                <div>
                  <label className="block text-sm font-bold text-blue-600 mb-2">
                    時間を選択 <span className="text-red-500">*</span>
                    {checking && <span className="ml-2 text-xs font-normal text-gray-400">空き状況を確認中...</span>}
                  </label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((time) => {
                      const { label, style, disabled } = getSlotStatus(time);
                      const isSelected = formData.time === time;
                      
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={disabled || checking}
                          onClick={() => setFormData({ ...formData, time })}
                          className={`
                            py-2 px-1 text-sm rounded-md border flex flex-col items-center justify-center transition-all duration-200
                            ${isSelected 
                              ? "bg-blue-600 border-blue-600 text-white shadow-md transform scale-105 z-10" 
                              : style
                            }
                          `}
                        >
                          <span className="font-bold text-base">{time}</span>
                          <span className="text-xs mt-1">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* エラーメッセージ */}
              {status && status !== "success" && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg flex items-start border border-red-200">
                  <span className="mr-2 text-lg">⚠️</span> <span>{status}</span>
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading || !formData.time}
                className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg tracking-wide shadow-md transition duration-300 transform hover:-translate-y-0.5
                  ${loading || !formData.time
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                  }`}
              >
                {loading ? "予約処理中..." : "上記の内容で予約する"}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                ※ 同時刻の定員は6名様までとなります。<br/>
                ※ 予約は1時間制です。
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}