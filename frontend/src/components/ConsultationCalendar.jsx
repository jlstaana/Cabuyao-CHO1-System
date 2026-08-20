import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react';

const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Scheduled: 'bg-sky-100 text-sky-700 border-sky-200',
  Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function ConsultationCalendar({ consultations, onViewConsultation }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add padding days for start of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const getConsultationsForDay = (date) => {
    if (!date) return [];
    return consultations.filter(c => {
      const cDate = new Date(c.scheduled_at || c.created_at);
      return cDate.getFullYear() === date.getFullYear() &&
             cDate.getMonth() === date.getMonth() &&
             cDate.getDate() === date.getDate();
    });
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-border bg-background">
        <h2 className="text-lg font-bold text-text flex items-center gap-2">
          <Stethoscope size={20} className="text-sky-500" />
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-border hover:bg-surface-hover text-text-muted"><ChevronLeft size={18}/></button>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-border hover:bg-surface-hover text-text-muted"><ChevronRight size={18}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-border">
        {weekDays.map(day => (
          <div key={day} className="bg-surface py-2 text-center text-xs font-semibold text-text-muted uppercase tracking-wider">
            {day}
          </div>
        ))}
        
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="bg-background min-h-[120px]" />;
          
          const dayConsultations = getConsultationsForDay(date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div key={date.toISOString()} className={`min-h-[120px] bg-background p-2 transition-colors hover:bg-surface/50 ${isToday ? 'bg-sky-50/20' : ''}`}>
              <p className={`text-xs font-bold mb-2 ${isToday ? 'text-sky-600 bg-sky-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-text-light'}`}>
                {date.getDate()}
              </p>
              <div className="space-y-1">
                {dayConsultations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onViewConsultation(c)}
                    className={`w-full text-left text-[10px] sm:text-xs truncate px-2 py-1 rounded border ${STATUS_COLORS[c.status] || STATUS_COLORS.Pending} hover:opacity-80 transition-opacity`}
                  >
                    {new Date(c.scheduled_at || c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {c.patient?.user?.name || 'Patient'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
