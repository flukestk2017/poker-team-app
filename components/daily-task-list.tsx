"use client"

import { useState, useTransition } from "react"
import { toggleTask, setTaskDeadline } from "@/app/actions/tasks"
import { addUserTask, updateUserTask, deleteUserTask } from "@/app/actions/user-tasks"
import { cn } from "@/lib/utils"
import { SnipButton } from "@/components/SnipButton"

interface Task {
  key: string
  label: string
  completed: boolean
  deadline: string | null
  notifyHoursBefore: number | null
}

interface DailyTaskListProps {
  tasks: Task[]
  date: string
}

function timeRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return { text: "เกินกำหนด", urgent: true, overdue: true }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h >= 24) return { text: `${Math.floor(h / 24)} วัน`, urgent: false, overdue: false }
  if (h > 0) return { text: `${h}h ${m}m`, urgent: true, overdue: false }
  return { text: `${m} นาที`, urgent: true, overdue: false }
}

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function DailyTaskList({ tasks: initial, date }: DailyTaskListProps) {
  const [tasks, setTasks] = useState(initial)
  const [deadlineKey, setDeadlineKey] = useState<string | null>(null)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [addingTask, setAddingTask] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [isPending, startTransition] = useTransition()

  // ── Toggle ──────────────────────────────────────────────
  function handleToggle(key: string) {
    setTasks((prev) => prev.map((t) => t.key === key ? { ...t, completed: !t.completed } : t))
    startTransition(async () => { await toggleTask({ date, taskKey: key }) })
  }

  // ── Deadline ─────────────────────────────────────────────
  function handleDeadlineSave(key: string, deadlineVal: string, notifyVal: string) {
    const dl = deadlineVal || null
    const notify = notifyVal ? Number(notifyVal) : null
    setTasks((prev) => prev.map((t) =>
      t.key === key ? { ...t, deadline: dl ? new Date(dl).toISOString() : null, notifyHoursBefore: notify } : t
    ))
    setDeadlineKey(null)
    startTransition(async () => {
      await setTaskDeadline({ date, taskKey: key, deadline: dl, notifyHoursBefore: notify })
    })
  }

  // ── Rename ───────────────────────────────────────────────
  function handleRename(key: string) {
    const trimmed = editValue.trim()
    if (!trimmed) { setEditKey(null); return }
    setTasks((prev) => prev.map((t) => t.key === key ? { ...t, label: trimmed } : t))
    setEditKey(null)
    startTransition(async () => { await updateUserTask({ taskKey: key, label: trimmed }) })
  }

  // ── Delete ───────────────────────────────────────────────
  function handleDelete(key: string, label: string) {
    if (!window.confirm(`ลบ "${label}" ออก?`)) return
    setTasks((prev) => prev.filter((t) => t.key !== key))
    startTransition(async () => { await deleteUserTask({ taskKey: key }) })
  }

  // ── Add ──────────────────────────────────────────────────
  function handleAdd() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const tempKey = `temp_${Date.now()}`
    setTasks((prev) => [...prev, { key: tempKey, label: trimmed, completed: false, deadline: null, notifyHoursBefore: null }])
    setNewLabel("")
    setAddingTask(false)
    startTransition(async () => { await addUserTask({ label: trimmed }) })
  }

  return (
    <div>
      {tasks.length === 0 && !addingTask && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          ยังไม่มี task — กด + เพิ่มเลย
        </div>
      )}

      {tasks.map((task) => {
        const remaining = task.deadline ? timeRemaining(task.deadline) : null
        const isDeadlineOpen = deadlineKey === task.key
        const isEditing = editKey === task.key

        return (
          <div key={task.key}>
            {/* Task row */}
            <div className={cn(
              "flex items-center gap-2 px-5 py-4 first:rounded-t-xl transition-colors",
              remaining?.overdue ? "bg-red-50" : remaining?.urgent ? "bg-yellow-50" : ""
            )}>
              {/* Checkbox + label */}
              <button
                onClick={() => handleToggle(task.key)}
                disabled={isPending}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
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
                <div className="min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleRename(task.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(task.key)
                        if (e.key === "Escape") setEditKey(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-300 w-full"
                    />
                  ) : (
                    <span className={cn("text-sm", task.completed ? "text-gray-300 line-through" : "text-gray-700")}>
                      {task.label}
                    </span>
                  )}
                  {remaining && (
                    <p className={cn("text-xs mt-0.5", remaining.overdue ? "text-red-500" : remaining.urgent ? "text-yellow-600" : "text-gray-400")}>
                      ⏰ {remaining.text}
                    </p>
                  )}
                </div>
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  title="ตั้ง deadline"
                  onClick={() => setDeadlineKey(isDeadlineOpen ? null : task.key)}
                  className={cn(
                    "text-xs w-7 h-7 flex items-center justify-center rounded-md transition-colors",
                    task.deadline
                      ? remaining?.overdue ? "text-red-400 bg-red-100" : remaining?.urgent ? "text-yellow-600 bg-yellow-100" : "text-gray-500 bg-gray-100"
                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                  )}
                >⏰</button>
                <SnipButton
                  compact
                  onCapture={(url) => console.log('Screenshot URL:', url)}
                />
                <button
                  title="เปลี่ยนชื่อ"
                  onClick={() => { setEditKey(task.key); setEditValue(task.label) }}
                  className="text-xs w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >✏</button>
                <button
                  title="ลบ task"
                  onClick={() => handleDelete(task.key, task.label)}
                  className="text-xs w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >×</button>
              </div>
            </div>

            {/* Deadline panel */}
            {isDeadlineOpen && (
              <DeadlinePanel
                deadline={task.deadline}
                notifyHoursBefore={task.notifyHoursBefore}
                onSave={(dl, notify) => handleDeadlineSave(task.key, dl, notify)}
                onClose={() => setDeadlineKey(null)}
              />
            )}
          </div>
        )
      })}

      {/* Add task row */}
      {addingTask ? (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-50">
          <input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") { setAddingTask(false); setNewLabel("") }
            }}
            placeholder="ชื่อ task ใหม่..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
          />
          <button onClick={handleAdd} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700">เพิ่ม</button>
          <button onClick={() => { setAddingTask(false); setNewLabel("") }} className="text-xs text-gray-400 hover:text-gray-600">ยกเลิก</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingTask(true)}
          className="w-full text-left px-5 py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-50 last:rounded-b-xl"
        >
          + เพิ่ม task
        </button>
      )}
    </div>
  )
}

function DeadlinePanel({
  deadline,
  notifyHoursBefore,
  onSave,
  onClose,
}: {
  deadline: string | null
  notifyHoursBefore: number | null
  onSave: (deadline: string, notify: string) => void
  onClose: () => void
}) {
  const [dl, setDl] = useState(deadline ? toLocalDatetimeValue(deadline) : "")
  const [notify, setNotify] = useState(notifyHoursBefore?.toString() ?? "1")

  return (
    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Deadline</label>
        <input
          type="datetime-local"
          value={dl}
          onChange={(e) => setDl(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">แจ้งก่อน</label>
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
        <button onClick={() => onSave(dl, notify)} className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700">บันทึก</button>
        {deadline && (
          <button onClick={() => onSave("", "")} className="text-xs text-red-400 hover:text-red-600">ลบ deadline</button>
        )}
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">ยกเลิก</button>
      </div>
    </div>
  )
}
