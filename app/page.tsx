"use client";

import { useState, useEffect } from "react";

const MAX_CAPACITY = 6;

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    startTime: "",
    duration: 60, // 分単位
  });
  
  const [availability, setAvailability] = useState<{ [key: string]: number }>({});
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // 初期日付セット
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  // 日付が変わったら空き状況取得
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
        setTimeSlots(data.slots || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  const handleSlotClick = (time: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setFormData({ ...formData, startTime: time, duration: 60 });
    setStatus(""); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      // 終了時間を計算
      const [hour, minute] = formData.startTime.split(":").map(Number);
      const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDate = new Date(startDate.getTime() + formData.duration * 60000); // duration分後
      
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

  // 予約可否チェック（開始時間から指定時間の枠が空いているか）
  const isTimeRangeAvailable = (start: string, durationMinutes: number) => {
    if (!timeSlots.length) return false;
    const startIndex = timeSlots.indexOf(start);
    if (startIndex === -1) return false;
    
    // 30分枠の数 (60分なら2枠、90分なら3枠)
    const requiredSlots = durationMinutes / 30;
    
    for (let i = 0; i < requiredSlots; i++) {
      const slotTime = timeSlots[startIndex + i];
      if (!slotTime) return false; // 時間外
      if ((availability[slotTime] || 0) >= MAX_CAPACITY) return false; // 満席
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        
        <div className="bg-blue-600 p-6 text-center">
          <h1 className="text-2xl font-bold text-white">ラウンジ予約状況</h1>
          <p className="text-blue-100 text-sm">ご希望の時間帯を選択してください</p>
        </div>

        <div className="p-6">
          {status === "success" ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">予約完了しました</h2>
              <button onClick={() => setStatus("")} className="mt-4 text-blue-600 underline">戻る</button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* 日付選択 */}
              <div className="flex justify-center">
                <input
                  type="date"
                  className="px-4 py-2 border rounded-lg text-lg font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              {/* Station Work風グリッド */}
              <div className="overflow-x-auto">
                <div className="min-w-[500px] border rounded-lg overflow-hidden">
                  {/* ヘッダー */}
                  <div className="grid grid-cols-7 bg-gray-100 text-xs font-bold text-gray-500 py-2 border-b">
                    <div className="text-center pt-1">TIME</div>
                    {[...Array(MAX_CAPACITY)].map((_, i) => (
                      <div key={i} className="text-center pt-1">NO.{i + 1}</div>
                    ))}
                  </div>

                  {/* ボディ */}
                  {checking ? (
                    <div className="p-10 text-center text-gray-400">読み込み中...</div>
                  ) : (
                    timeSlots.map((time) => {
                      const count = availability[time] || 0;
                      // 定員の数だけセルを作る
                      return (
                        <div key={time} className="grid grid-cols-7 border-b last:border-b-0 h-10 hover:bg-blue-50 transition-colors">
                          {/* 時間ラベル */}
                          <div className="flex items-center justify-center text-xs font-bold text-gray-600 bg-gray-50 border-r">
                            {time}
                          </div>
                          
                          {/* 6つの座席スロット */}
                          {[...Array(MAX_CAPACITY)].map((_, i) => {
                            // 予約数(count)の分だけ左から埋める
                            const isBooked = i < count;
                            // 自分が選択中の時間か
                            const isSelected = formData.startTime === time;
                            
                            return (
                              <div 
                                key={i} 
                                onClick={() => !isBooked && handleSlotClick(time, true)}
                                className={`
                                  border-r last:border-r-0 cursor-pointer flex items-center justify-center text-xs
                                  ${isBooked 
                                    ? "bg-gray-300 cursor-not-allowed" // 予約済み(グレー)
                                    : isSelected 
                                      ? "bg-blue-600 text-white" // 選択中(青)
                                      : "bg-white hover:bg-blue-100" // 空き(白)
                                  }
                                `}
                              >
                                {isBooked ? "×" : isSelected ? "●" : ""}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-center mt-2 text-gray-500">
                  <span className="inline-block w-3 h-3 bg-white border mr-1 align-middle"></span>空き
                  <span className="inline-block w-3 h-3 bg-gray-300 mr-1 ml-3 align-middle"></span>予約済
                  <span className="inline-block w-3 h-3 bg-blue-600 mr-1 ml-3 align-middle"></span>選択中
                </p>
              </div>

              {/* 予約フォーム (時間を選択すると表示) */}
              {formData.startTime && (
                <form onSubmit={handleSubmit} className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-fade-in-up">
                  <h3 className="font-bold text-blue-800 mb-4 flex items-center">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2">選択中</span>
                    {formData.date} {formData.startTime} から利用
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">お名前</label>
                        <input
                          required
                          type="text"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">メール</label>
                        <input
                          required
                          type="email"
                          className="w-full px-3 py-2 border rounded-md"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">利用時間</label>
                      <select 
                        className="w-full px-3 py-2 border rounded-md bg-white"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                      >
                        {[60, 90, 120, 150, 180].map(min => {
                          const available = isTimeRangeAvailable(formData.startTime, min);
                          return (
                            <option key={min} value={min} disabled={!available}>
                              {min}分間 {available ? "" : "(空き時間が足りません)"}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {status && status !== "success" && (
                      <div className="text-red-500 text-sm font-bold">⚠️ {status}</div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || !isTimeRangeAvailable(formData.startTime, formData.duration)}
                      className={`w-full py-3 rounded-lg font-bold text-white shadow-md
                        ${loading || !isTimeRangeAvailable(formData.startTime, formData.duration)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                      {loading ? "処理中..." : "予約を確定する"}
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