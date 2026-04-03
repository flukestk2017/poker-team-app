import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DAILY_TASKS } from "@/lib/constants"
import DailyTaskList from "@/components/daily-task-list"
import { ScreenshotGallery } from "@/components/ScreenshotGallery"

function getTodayDate() {
  return new Date().toISOString().split("T")[0]
}

export default async function TasksPage() {
  const session = await auth()
  const userId = session!.user.id
  const today = getTodayDate()

  // Auto-seed UserTask if first time
  let userTasks = await db.userTask.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  })
  if (userTasks.length === 0) {
    await db.userTask.createMany({
      data: DAILY_TASKS.map((t, i) => ({ userId, taskKey: t.key, label: t.label, sortOrder: i })),
    })
    userTasks = await db.userTask.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } })
  }

  const records = await db.dailyTask.findMany({ where: { userId, date: today } })
  const taskMap = new Map(records.map((t) => [t.taskKey, t]))

  const tasks = userTasks.map((ut) => ({
    key: ut.taskKey,
    label: ut.label,
    completed: taskMap.get(ut.taskKey)?.completed ?? false,
    deadline: taskMap.get(ut.taskKey)?.deadline?.toISOString() ?? null,
    notifyHoursBefore: taskMap.get(ut.taskKey)?.notifyHoursBefore ?? null,
  }))

  const completedCount = tasks.filter((t) => t.completed).length

  const dateLabel = new Date().toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400">{dateLabel}</p>
        <h1 className="text-xl font-semibold text-gray-900 mt-0.5">Daily Tasks</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">ความคืบหน้าวันนี้</span>
          <span className="text-sm font-medium text-gray-900">{completedCount}/{tasks.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-900 rounded-full transition-all duration-500"
            style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        <DailyTaskList tasks={tasks} date={today} />
      </div>

      <ScreenshotGallery />
    </div>
  )
}
