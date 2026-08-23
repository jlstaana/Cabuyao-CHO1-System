const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Overview.jsx', 'utf-8');

const oldCode = `function DoctorOverview({ user, consultations, prescriptions }) {
  
  const scheduledToday = consultations.filter((c) => c.status === 'Scheduled' && isToday(c.scheduled_at)).length;
  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Stethoscope} title={\`Good day, Dr. \${(user?.name?.split(' ')[0] || '').replace(/^Dr\\.\\s*/i, '')}!\`} description="Here's your consultation overview." iconClassName="bg-success-bg text-emerald-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        <StatCard label="Scheduled Consultations" value={scheduledToday} icon={Calendar} color="text-sky-500"  sub="Upcoming sessions for today" />
        <StatCard label="Recent Prescriptions" value={prescriptions.length} icon={FileText} color="text-indigo-500"  sub="Total generated prescriptions" />
      </div>`.replace(/\r\n/g, '\n');

const newCode = `function DoctorOverview({ user, consultations, prescriptions }) {
  const now = new Date();
  const completedThisMonth = consultations.filter(c => {
    if (c.status !== 'Completed') return false;
    const d = new Date(c.scheduled_at || c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  
  const scheduledToday = consultations.filter((c) => c.status === 'Scheduled' && isToday(c.scheduled_at)).length;
  return (
    <>
      <header className="mb-8">
        <PageTitle icon={Stethoscope} title={\`Good day, Dr. \${(user?.name?.split(' ')[0] || '').replace(/^Dr\\.\\s*/i, '')}!\`} description="Here's your consultation overview." iconClassName="bg-success-bg text-emerald-600" />
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Scheduled Consultations" value={scheduledToday} icon={Calendar} color="text-sky-500" sub="Upcoming sessions for today" />
        <StatCard label="Recent Prescriptions" value={prescriptions.length} icon={FileText} color="text-indigo-500" sub="Total generated prescriptions" />
        <StatCard label="Completed Consultations" value={completedThisMonth} icon={CheckCircle} color="text-emerald-500" sub="Successfully finished this month" />
      </div>`.replace(/\r\n/g, '\n');

f = f.replace(new RegExp(oldCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), newCode);

fs.writeFileSync('../frontend/src/pages/dashboard/Overview.jsx', f);
console.log('Added Completed Consultations card');
