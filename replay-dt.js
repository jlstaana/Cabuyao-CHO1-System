const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf8');

const target = `            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Preferred Date & Time</label>
              <input
                required
                type="datetime-local"
                value={requestForm.scheduled_at}
                onChange={e => setRequestForm({ ...requestForm, scheduled_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>`;

const replacement = `            {requestForm.requested_specialization ? (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">Available Appointment Slots</p>
                    <p className="text-xs text-text-light">Week of {requestWeekStart.toLocaleDateString()}</p>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-success-bg px-3 py-1 text-xs font-bold text-success-text">
                    Open slots can be selected
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setRequestWeekOffset(prev => prev - 1)} className="p-1.5 rounded-md hover:bg-surface-hover text-text-muted hover:text-text border border-border"><ChevronLeft size={16}/></button>
                  <span className="text-xs font-medium text-text-muted">Use arrows to change week</span>
                  <button type="button" onClick={() => setRequestWeekOffset(prev => prev + 1)} className="p-1.5 rounded-md hover:bg-surface-hover text-text-muted hover:text-text border border-border"><ChevronRight size={16}/></button>
                </div>

                {!availableDoctors.some(d => d.specialization === requestForm.requested_specialization) ? (
                  <div className="py-8 text-center text-sm text-text-muted bg-background rounded-xl border border-border border-dashed">
                    No doctors available for this specialization at the moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableDoctors
                      .filter(d => d.specialization === requestForm.requested_specialization)
                      .map(doctor => (
                        <div key={doctor.id} className="rounded-xl border border-border bg-background p-3">
                          <p className="mb-2 text-sm font-bold text-text">{doctor.user?.name}</p>
                          <div className="space-y-3">
                            {requestWeekDays.map((date, i) => {
                              const slots = getDoctorSlotsForDate(doctor, date);
                              if (slots.length === 0) return null;
                              
                              return (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                                  <span className="w-24 shrink-0 text-xs font-medium text-text-muted pt-1">
                                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <div className="flex flex-wrap gap-2 flex-1">
                                    {slots.map((slot, j) => {
                                      const stat = doctorSlotStatus(doctor, date, slot);
                                      const isFull = stat.remaining <= 0;
                                      const isSelected = requestForm.scheduled_at && requestForm.scheduled_at.startsWith(dateKey(date)) && requestForm.scheduled_at.includes(String(slot.start_time).slice(0,5));
                                      
                                      return (
                                        <button
                                          key={j}
                                          type="button"
                                          disabled={isFull}
                                          onClick={() => {
                                            const dt = new Date(date);
                                            const [hh, mm] = slot.start_time.split(':');
                                            dt.setHours(hh, mm, 0, 0);
                                            setRequestForm({ ...requestForm, scheduled_at: dt.toISOString().slice(0, 16), doctor_id: doctor.id });
                                          }}
                                          className={`relative px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                                            isSelected ? 'bg-sky-500 border-sky-600 text-white shadow-md scale-105' :
                                            isFull ? 'bg-surface border-border text-text-light opacity-50 cursor-not-allowed' :
                                            'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                                          }`}
                                        >
                                          {String(slot.start_time).slice(0, 5)} - {String(slot.end_time).slice(0, 5)}
                                          {!isFull && !isSelected && <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{stat.remaining}</span>}
                                          {isFull && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">0</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            {!requestWeekDays.some(date => getDoctorSlotsForDate(doctor, date).length > 0) && (
                              <p className="text-xs text-text-light italic">No slots available this week.</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border border-dashed bg-surface p-6 text-center">
                <CalendarIcon size={24} className="mx-auto mb-2 text-text-light opacity-50" />
                <p className="text-sm font-semibold text-text-muted">Select a Specialization</p>
                <p className="text-xs text-text-light mt-1">Please select a consultation type above to view available doctors and schedules.</p>
              </div>
            )}`;

file = file.replace(target, replacement);

const targetResched = `            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">New Date & Time</label>
              <input
                required
                type="datetime-local"
                value={rescheduleForm.scheduled_at}
                onChange={e => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-sky-500/20 outline-none"
              />
            </div>`;
const replacementResched = `            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Available Slots</p>
                  <p className="text-xs text-text-light">Week of {rescheduleWeekStart.toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setRescheduleWeekOffset(prev => prev - 1)} className="p-1.5 rounded-md border border-border hover:bg-surface-hover text-text-muted"><ChevronLeft size={14}/></button>
                  <button type="button" onClick={() => setRescheduleWeekOffset(prev => prev + 1)} className="p-1.5 rounded-md border border-border hover:bg-surface-hover text-text-muted"><ChevronRight size={14}/></button>
                </div>
              </div>

              <div className="space-y-3">
                {rescheduleWeekDays.map((date, i) => {
                  const slots = rescheduleDoctor ? getDoctorSlotsForDate(rescheduleDoctor, date) : [];
                  if (slots.length === 0) return null;
                  
                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="w-24 shrink-0 text-xs font-medium text-text-muted pt-1">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {slots.map((slot, j) => {
                          const stat = rescheduleDoctor ? doctorSlotStatus(rescheduleDoctor, date, slot) : { remaining: 0 };
                          const isFull = stat.remaining <= 0;
                          const isSelected = rescheduleForm.scheduled_at && rescheduleForm.scheduled_at.startsWith(dateKey(date)) && rescheduleForm.scheduled_at.includes(String(slot.start_time).slice(0,5));
                          
                          return (
                            <button
                              key={j}
                              type="button"
                              disabled={isFull}
                              onClick={() => {
                                const dt = new Date(date);
                                const [hh, mm] = slot.start_time.split(':');
                                dt.setHours(hh, mm, 0, 0);
                                setRescheduleForm({ ...rescheduleForm, scheduled_at: dt.toISOString().slice(0, 16) });
                              }}
                              className={\`relative px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all \${
                                isSelected ? 'bg-sky-500 border-sky-600 text-white shadow-md scale-105' :
                                isFull ? 'bg-surface border-border text-text-light opacity-50 cursor-not-allowed' :
                                'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
                              }\`}
                            >
                              {String(slot.start_time).slice(0, 5)} - {String(slot.end_time).slice(0, 5)}
                              {!isFull && !isSelected && <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">{stat.remaining}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {rescheduleDoctor && !rescheduleWeekDays.some(date => getDoctorSlotsForDate(rescheduleDoctor, date).length > 0) && (
                  <p className="text-xs text-text-light italic text-center py-4">No slots available this week.</p>
                )}
              </div>
            </div>`;
file = file.replace(targetResched, replacementResched);
fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
