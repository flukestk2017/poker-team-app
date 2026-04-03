import CalendarView from "@/components/calendar-view"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-400 mt-0.5">ภาพรวม task รายเดือน</p>
      </div>
      <CalendarView />
    </div>
  )
}
