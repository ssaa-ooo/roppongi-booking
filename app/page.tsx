"use client";

import { useState, useEffect } from "react";

const MAX_CAPACITY = 6;

// デフォルトの時間枠（API取得までのつなぎ）
const DEFAULT_SLOTS = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", 
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
];

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    startTime: "",
    duration: 60,
  });
  
  const [availability, setAvailability] = useState<{ [key: string]: number }>({});
  const [timeSlots, setTimeSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // 初期化：今日の日付をセット
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setFormData(prev => ({ ...prev, date: `${yyyy}-${mm}-${dd}` }));
  }, []);

  // 日付が変わったらAPIを叩く
  useEffect(() => {
    if (formData.date) {
      checkAvailability(formData.date);
    }
  }, [formData.date]);

  const checkAvailability = async (date: string) => {
    setChecking(true);
    try {
      const res = await fetch(`/api/availability?date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setAvailability(data.bookings || {});
        // APIからスロットが返ってくればそれを使う、なければデフォルト
        if (data.slots && data.slots.length > 0) {
          setTimeSlots(data.slots);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const handleSlotClick = (time: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setFormData({ ...formData, startTime: time, duration: 60 }); // クリックしたら選択状態に
    setStatus(""); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDate = new Date(startDate.getTime() + formData.duration * 60000); 
      
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setFormData({ ...formData, name: "", email: "", startTime: "", duration: 60 });
        checkAvailability(formData.date);
      } else {
        setStatus(data.message || "予約エラー");
      }
    } catch (error) {
      setStatus("システムエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // 予約可否チェック
  const isTimeRangeAvailable = (start: string, durationMinutes: number) => {
    if (!timeSlots.length) return false;
    const startIndex = timeSlots.indexOf(start);
    if (startIndex === -1) return false;
    
    const requiredSlots = durationMinutes / 30;
    
    for (let i = 0; i < requiredSlots; i++) {
      const slotTime = timeSlots[startIndex + i];
      if (!slotTime) return false; 
      if ((availability[slotTime] || 0) >= MAX_CAPACITY) return false; 
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100">
        
        {/* ヘッダー：ボーネルンドカラー */}
        <div className="bg-[#007AC3] p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            ボーネルンド六本木ヒルズ店<br/>親子ラウンジ 予約システム
          </h1>
          <p className="text-blue-100 text-sm mt-2">
            ご希望の時間帯の空き枠を選択してください
          </p>
        </div>

        <div className="p-6">
          {status === "success" ? (
            <div className="text-center py-10 bg-green-50 rounded-lg">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">ご予約ありがとうございます</h2>
              <p className="text-gray-600 mb-6">当日はスタッフにお名前をお伝えください。</p>
              <button 
                onClick={() => setStatus("")} 
                className="text-white bg-[#007AC3] px-6 py-2 rounded-full hover:bg-blue-600 font-bold"
              >
                続けて予約する
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* 日付選択 */}
              <div className="flex justify-center">
                <div className="relative">
                  <input
                    type="date"
                    className="pl-4 pr-10 py-3 border-2 border-blue-200 rounded-lg text-xl font-bold text-gray-700 bg-white focus:outline-none focus:border-[#007AC3]"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {/* Station Work風グリッド */}
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[600px] border border-gray-300 rounded-lg overflow-hidden">
                  {/* テーブルヘッダー */}
                  <div className="grid grid-cols-7 bg-gray-100 text-xs font-bold text-gray-600 py-3 border-b border-gray-300">
                    <div className="text-center">時間</div>
                    {[...Array(MAX_CAPACITY)].map((_, i) => (
                      <div key={i} className="text-center">席 {i + 1}</div>
                    ))}
                  </div>

                  {/* テーブルボディ */}
                  <div className="bg-white">
                    {checking && timeSlots.length === 0 ? (
                      <div className="p-10 text-center text-gray-400">読み込み中...</div>
                    ) : (
                      timeSlots.map((time) => {
                        const count = availability[time] || 0;
                        const isSelectedRow = formData.startTime === time;

                        return (
                          <div key={time} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0 h-12">
                            {/* 時間ラベル */}
                            <div className="flex items-center justify-center text-sm font-bold text-gray-600 bg-gray-50 border-r border-gray-200">
                              {time}
                            </div>
                            
                            {/* 6つの座席スロット */}
                            {[...Array(MAX_CAPACITY)].map((_, i) => {
                              const isBooked = i < count; // 左から埋めていく
                              const isAvailable = !isBooked;
                              const isSelected = isSelectedRow && isAvailable; // 選択中の行かつ空き
                              
                              return (
                                <div 
                                  key={i} 
                                  onClick={() => handleSlotClick(time, isAvailable)}
                                  className={`
                                    border-r border-gray-100 last:border-r-0 flex items-center justify-center cursor-pointer transition-all duration-200
                                    ${isBooked 
                                      ? "bg-gray-400 text-white cursor-not-allowed" // 予約済: 濃いグレー
                                      : isSelected 
                                        ? "bg-[#007AC3] text-white scale-95 rounded-sm shadow-inner" // 選択中: キドキドブルー
                                        : "bg-white hover:bg-blue-50" // 空き: 白
                                    }
                                  `}
                                >
                                  {/* アイコン表示 */}
                                  {isBooked && <span className="text-xs">✕</span>}
                                  {isSelected && <span className="text-xs">●</span>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 凡例 */}
                <div className="flex justify-center gap-6 mt-3 text-xs text-gray-600">
                  <div className="flex items-center"><span className="w-4 h-4 bg-white border border-gray-300 mr-2 rounded-sm"></span> 空き</div>
                  <div className="flex items-center"><span className="w-4 h-4 bg-gray-400 mr-2 rounded-sm"></span> 予約済</div>
                  <div className="flex items-center"><span className="w-4 h-4 bg-[#007AC3] mr-2 rounded-sm"></span> 選択中</div>
                </div>
              </div>

              {/* 予約フォーム (時間を選択すると表示) */}
              {formData.startTime && (
                <form onSubmit={handleSubmit} className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 animate-pulse-once">
                  <h3 className="font-bold text-[#007AC3] mb-4 flex items-center text-lg border-b border-blue-200 pb-2">
                    予約内容の入力
                  </h3>

                  <div className="space-y-5">
                    <div className="bg-white p-4 rounded-lg border border-blue-100 text-center">
                      <p className="text-sm text-gray-500">選択日時</p>
                      <p className="text-xl font-bold text-gray-800">
                        {formData.date} <span className="text-[#007AC3] mx-2">{formData.startTime}</span> 〜
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">お名前 <span className="text-red-500">*</span></label>
                        <input
                          required
                          placeholder="例：ボーネルンド 太郎"
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                        <input
                          required
                          placeholder="sample@example.com"
                          type="email"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">利用時間 <span className="text-red-500">*</span></label>
                      <select 
                        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-400"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                      >
                        {[60, 90, 120, 150, 180].map(min => {
                          const available = isTimeRangeAvailable(formData.startTime, min);
                          return (
                            <option key={min} value={min} disabled={!available} className={available ? "text-black" : "text-gray-300"}>
                              {min}分間 {available ? "" : "(後の時間が埋まっています)"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {status && status !== "success" && (
                      <div className="bg-red-100 text-red-600 text-sm font-bold p-3 rounded">⚠️ {status}</div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !isTimeRangeAvailable(formData.startTime, formData.duration)}
                      className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-md transition-transform transform active:scale-95
                        ${loading || !isTimeRangeAvailable(formData.startTime, formData.duration)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#007AC3] hover:bg-blue-600"
                        }`}
                    >
                      {loading ? "予約処理中..." : "予約を確定する"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}