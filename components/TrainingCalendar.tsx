"use client";

import { useState } from "react";
import { planToEvents, TYPE_COLORS } from "@/lib/planUtils";
import type { TrainingPlan, Workout } from "@/lib/claude";

type Props = { plan: TrainingPlan & { start_date?: string } };
type CalEvent = ReturnType<typeof planToEvents>[number];

const TYPE_BG: Record<string, string> = {
  "Easy Run":       "bg-green-700/80",
  "Long Run":       "bg-blue-700/80",
  "Tempo Run":      "bg-orange-600/80",
  "Intervals":      "bg-red-700/80",
  "Cross Training": "bg-purple-700/80",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
}

const MONTHS = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function TrainingCalendar({ plan }: Props) {
  const events = planToEvents(plan);
  const eventsByDate: Record<string, CalEvent[]> = {};
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<{ event: CalEvent; date: string } | null>(null);

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">‹</button>
        <span className="font-semibold text-white">{MONTHS[month]} {year}</span>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">›</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-600 font-semibold uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
        {cells.map((day, i) => {
          const dateStr = day
            ? `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
            : null;
          const dayEvents = dateStr ? (eventsByDate[dateStr] ?? []) : [];
          const isToday = dateStr === today;

          return (
            <div
              key={i}
              className={`min-h-[80px] p-1.5 bg-[#0d0d14] ${day ? "hover:bg-white/[0.03]" : "opacity-30"} transition-colors`}
            >
              {day && (
                <>
                  <span className={`text-xs block text-right mb-1 w-6 ml-auto rounded-full leading-6 text-center
                    ${isToday ? "bg-orange-500 text-white font-bold" : "text-gray-600"}`}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelected({ event, date: dateStr! })}
                        className={`w-full text-left text-xs px-1.5 py-0.5 rounded font-medium truncate ${TYPE_BG[event.extendedProps.workout.type] ?? "bg-gray-700"} text-white hover:opacity-80 transition-opacity`}
                      >
                        {event.extendedProps.workout.distance_km
                          ? `${event.extendedProps.workout.type.split(" ")[0]} ${event.extendedProps.workout.distance_km}k`
                          : event.extendedProps.workout.type.split(" ")[0]}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-xs text-orange-400/70 px-1">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TYPE_COLORS[selected.event.extendedProps.workout.type] }} />
              <span className="font-semibold text-sm">{selected.event.extendedProps.workout.type}</span>
              <span className="text-gray-500 text-xs">
                {new Date(selected.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{selected.event.extendedProps.workout.description}</p>
            <div className="flex gap-4 mt-2">
              {selected.event.extendedProps.workout.distance_km && (
                <span className="text-xs text-gray-500">{selected.event.extendedProps.workout.distance_km} km</span>
              )}
              {selected.event.extendedProps.workout.pace_min_per_km && (
                <span className="text-xs text-gray-500">@ {selected.event.extendedProps.workout.pace_min_per_km} /km</span>
              )}
              <span className="text-xs text-gray-600">{selected.event.extendedProps.weekTheme}</span>
            </div>
          </div>
          <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-300 text-xl leading-none shrink-0">×</button>
        </div>
      )}
    </div>
  );
}
