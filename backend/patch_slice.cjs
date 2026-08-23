const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

const idxStart = f.indexOf('System Utilization bar chart');
if (idxStart !== -1) {
  // Go back to the `{/* `
  const actualStart = f.lastIndexOf('{/*', idxStart);
  
  // Find the end of the div
  const idxEnd = f.indexOf('          </div>\n        )}', actualStart);
  
  if (idxEnd !== -1) {
    const newChart = `{/* ?? Recent System Activity ?? */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-text flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" /> Recent System Activity
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-hover/50 text-text-muted font-medium border-b border-border">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3 min-w-[200px]">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-text">
                  {(stats.recent_logs || []).slice(0, 5).map((log, i) => (
                    <tr key={i} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-text-light text-xs">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-text">{log.user || 'System'}</div>
                        {log.role && <div className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">{log.role}</div>}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-light text-xs">{log.description}</td>
                    </tr>
                  ))}
                  {(!stats.recent_logs || stats.recent_logs.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-text-muted">No recent activity recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
`;
    f = f.slice(0, actualStart) + newChart + f.slice(idxEnd);
    fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', f);
    console.log('Fixed System Utilization');
  }
}
