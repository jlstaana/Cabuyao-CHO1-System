const fs = require('fs');
let file = fs.readFileSync('frontend/src/pages/dashboard/Consultations.jsx', 'utf-8');

const target = `            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Selected Appointment Slot</label>
              {requestForm.scheduled_at ? (
                <div className="w-full px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 font-semibold flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(requestForm.scheduled_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-medium text-sm">
                  Please click an available green slot below.
                </div>
              )}
              <input type="text" className="h-0 w-0 absolute opacity-0" required value={requestForm.scheduled_at || ''} onChange={()=>{}} tabIndex="-1" />
            </div>`;

const replacement = `            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Consultation Request For</label>
              <textarea
                required
                rows={3}
                value={requestForm.symptoms}
                onChange={e => setRequestForm({ ...requestForm, symptoms: e.target.value })}
                placeholder="Describe your symptoms or reason for consultation"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Additional Notes</label>
              <textarea
                rows={2}
                value={requestForm.notes}
                onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                placeholder="Medication, allergies, or other concerns"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Selected Appointment Slot</label>
              {requestForm.scheduled_at ? (
                <div className="w-full px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 font-semibold flex items-center gap-2">
                  <Calendar size={16} />
                  {new Date(requestForm.scheduled_at).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              ) : (
                <div className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-medium text-sm">
                  Please click an available green slot below.
                </div>
              )}
              <input type="text" className="h-0 w-0 absolute opacity-0" required value={requestForm.scheduled_at || ''} onChange={()=>{}} tabIndex="-1" />
            </div>`;

file = file.replace(target, replacement);

fs.writeFileSync('frontend/src/pages/dashboard/Consultations.jsx', file);
console.log('Patched');
