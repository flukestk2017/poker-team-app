"use client"

import { useState, useEffect, useTransition } from "react"
import { getMonthTasks, getDayTasks, toggleTask, setTaskDeadline } from "@/app/actions/tasks"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"]
const MONTH_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
]

interface DayTask {
  key: string
  label: string
  completed: boolean
  deadline: string | null
  notifyHoursBefore: number | null
}

type MonthData = Record<string, { completed: number; total: number }>

function timeRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return { text: "เกินกำหนด", overdue: true, urgent: true }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h >= 24) return { text: `${Math.floor(h / 24)}d`, overdue: false, urgent: false }
  return { text: h > 0 ? `${h}h ${m}m` : `${m}m`, overdue: false, urgent: true }
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function TaskSettingsPanel({
  task,
  date,
  onSaved,
  onClose,
}: {
  task: DayTask
  date: string
  onSaved: (key: string, deadline: string | null, notify: number | null) => void
  onClose: () => void
}) {
  const [dl, setDl] = useState(task.deadline ? toLocalDatetimeValue(task.deadline) : "")
  const [notify, setNotify] = useState(task.notifyHoursBefore?.toString() ?? "1")
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const deadline = dl || null
    const notifyNum = notify ? Number(notify) : null
    startTransition(async () => {
      await setTaskDeadline({ date, taskKey: task.key, deadline, notifyHoursBefore: notifyNum })
      onSaved(task.key, deadline ? new Date(dl).toISOString() : null, notifyNum)
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
      <p className="text-xs font-medium text-gray-700">{task.label}</p>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 w-16 shrink-0">Deadline</label>
        <input
          type="datetime-local"
          value={dl}
          onChange={(e) => setDl(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 flex-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 w-16 shrink-0">แจ้งก่อน</label>
        <input
          type="number"
          min={1}
          value={notify}
          onChange={(e) => setNotify(e.target.value)}
          className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 text-center"
        />
        <span className="text-xs text-gray-400">ชม.</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40"
        >
          บันทึก
        </button>
        {task.deadline && (
          <button
            onClick={() => { setDl(""); startTransition(async () => { await setTaskDeadline({ date, taskKey: task.key, deadline: null }); onSaved(task.key, null, null) }) }}
            className="text-xs text-red-400 hover:text-red-600"
          >
            ลบ deadline
          </button>
        )}
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">ยกเลิก</button>
      </div>
    </div>
  )
}

export default function CalendarView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [monthData, setMonthData] = useState<MonthData>({})
  const [totalTasks, setTotalTasks] = useState(5)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayTasks, setDayTasks] = useState<DayTask[]>([])
  const [loadingDay, setLoadingDay] = useState(false)
  const [settingsKey, setSettingsKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadMonth(y: number, m: number) {
    const { byDate, total } = await getMonthTasks({ year: y, month: m })
    setMonthData(byDate)
    setTotalTasks(total)
  }

  useEffect(() => { loadMonth(year, month) }, [year, month])

  function prevMonth() {
    const [y, m] = month === 1 ? [year - 1, 12] : [year, month - 1]
    setYear(y); setMonth(m); setSelectedDate(null)
  }

  function nextMonth() {
    const [y, m] = month === 12 ? [year + 1, 1] : [year, month + 1]
    setYear(y); setMonth(m); setSelectedDate(null)
  }

  async function handleDayClick(ds: string) {
    if (selectedDate === ds) { setSelectedDate(null); return }
    setSelectedDate(ds)
    setSettingsKey(null)
    setLoadingDay(true)
    const tasks = await getDayTasks({ date: ds })
    setDayTasks(tasks)
    setLoadingDay(false)
  }

  function handleToggle(taskKey: string) {
    setDayTasks((prev) => prev.map((t) => t.key === taskKey ? { ...t, completed: !t.completed } : t))
    startTransition(async () => {
      await toggleTask({ date: selectedDate!, taskKey })
      loadMonth(year, month)
    })
  }

  function handleSettingsSaved(key: string, deadline: string | null, notify: number | null) {
    setDayTasks((prev) => prev.map((t) => t.key === key ? { ...t, deadline, notifyHoursBefore: notify } : t))
    setSettingsKey(null)
  }

  // Build grid
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const todayStr = today.toISOString().split("T")[0]
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  function ds(day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  function dotColor(data?: { completed: number; total: number }) {
    if (!data || data.completed === 0) return "bg-gray-200"
    if (data.completed < data.total) return "bg-yellow-400"
    return "bg-green-500"
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">‹</button>
          <span className="text-sm font-semibold text-gray-900">{MONTH_TH[month - 1]} {year + 543}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">›</button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const dateStr = ds(day)
            const data = monthData[dateStr]
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  "flex flex-col items-center py-1.5 rounded-lg transition-colors",
                  isSelected ? "bg-gray-900" : isToday ? "bg-gray-100" : "hover:bg-gray-50"
                )}
              >
                <span className={cn("text-xs font-medium", isSelected ? "text-white" : isToday ? "text-gray-900" : "text-gray-700")}>
                  {day}
                </span>
                <div className={cn("w-1.5 h-1.5 rounded-full mt-1", isSelected ? "bg-white/60" : dotColor(data))} />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
          {[{ color: "bg-green-500", label: "ครบ" }, { color: "bg-yellow-400", label: "บางส่วน" }, { color: "bg-gray-200", label: "ยังไม่ทำ" }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day detail */}
      {selectedDate && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("th-TH", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </h2>
          {monthData[selectedDate] && (
            <p className="text-xs text-gray-400 mb-4">
              {monthData[selectedDate].completed}/{monthData[selectedDate].total} task เสร็จ
            </p>
          )}

          {loadingDay ? (
            <p className="text-sm text-gray-400 text-center py-4">กำลังโหลด...</p>
          ) : (
            <div className="space-y-1">
              {dayTasks.map((task) => {
                const remaining = task.deadline ? timeRemaining(task.deadline) : null
                const isSettingsOpen = settingsKey === task.key

                return (
                  <div key={task.key} className="rounded-lg overflow-hidden">
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors",
                      remaining?.overdue ? "bg-red-50" : remaining?.urgent ? "bg-yellow-50" : "hover:bg-gray-50"
                    )}>
                      {/* Toggle */}
                      <button onClick={() => handleToggle(task.key)} disabled={isPending} className="flex items-center gap-3 flex-1 text-left">
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                          task.completed ? "bg-gray-900 border-gray-900" : "border-gray-200"
                        )}>
                          {task.completed && (
                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className={cn("text-sm", task.completed ? "text-gray-300 line-through" : "text-gray-700")}>
                            {task.label}
                          </span>
                          {remaining && (
                            <p className={cn("text-xs", remaining.overdue ? "text-red-500" : "text-yellow-600")}>
                              ⏰ {remaining.text}
                            </p>
                          )}
                        </div>
                      </button>

                      {/* Settings button */}
                      <button
                        onClick={() => setSettingsKey(isSettingsOpen ? null : task.key)}
                        className={cn(
                          "text-xs w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                          task.deadline ? "text-gray-600 bg-gray-100" : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                        )}
                      >⚙</button>
                    </div>

                    {isSettingsOpen && (
                      <div className="px-3 pb-3">
                        <TaskSettingsPanel
                          task={task}
                          date={selectedDate}
                          onSaved={handleSettingsSaved}
                          onClose={() => setSettingsKey(null)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
