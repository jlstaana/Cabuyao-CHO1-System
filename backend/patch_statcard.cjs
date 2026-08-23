const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

const oldCode = `function StatCard({ label, value, sub, color = 'sky' }) {
  const styles = {
    sky: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent',
    indigo: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent',
    rose: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-transparent',
  };
  return (
    <div className={\`p-5 rounded-2xl border \${styles[color] || styles.sky}\`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/80">{label}</p>
      <p className="text-3xl font-black mt-1 text-white">{value}</p>
      {sub && <p className="text-[10px] mt-1 text-white/70 uppercase tracking-wide">{sub}</p>}
    </div>
  );
}`.replace(/\r\n/g, '\n');

const newCode = `function StatCard({ label, value, sub, color = 'sky' }) {
  const styles = {
    sky: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white border-transparent',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent',
    indigo: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent',
    rose: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-transparent',
    amber: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent',
  };
  
  const isText = typeof value === 'string' && isNaN(value.replace(/,/g, ''));
  const valueClass = isText ? 'text-xl font-bold truncate mt-2' : 'text-3xl font-black mt-1';
  
  return (
    <div className={\`p-5 rounded-2xl border \${styles[color] || styles.sky}\`}>
      <p className="text-xs font-bold uppercase tracking-wider text-white/80">{label}</p>
      <p className={\`\${valueClass} text-white\`} title={value}>{value}</p>
      {sub && <p className="text-[10px] mt-2 text-white/70 uppercase tracking-wide">{sub}</p>}
    </div>
  );
}`.replace(/\r\n/g, '\n');

f = f.replace(new RegExp(oldCode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\n/g, '\\r?\\n')), newCode);

fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', f);
console.log('Fixed StatCard');
