const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

// Find the epidemiology block
const epiStart = f.indexOf("{activeTab === 'epidemiology' && (");
if (epiStart !== -1) {
  const insertIndex = f.indexOf('<div className="space-y-6">', epiStart) + '<div className="space-y-6">'.length;
  
  const newStats = `
            {(() => {
              const topDiagnosis = (stats.top_diseases && stats.top_diseases.length > 0) ? stats.top_diseases[0].diagnosis : 'N/A';
              const topDiagnosisCases = (stats.top_diseases && stats.top_diseases.length > 0) ? stats.top_diseases[0].total : 0;
              const topBarangay = (stats.cases_by_barangay && stats.cases_by_barangay.length > 0) ? stats.cases_by_barangay[0].barangay : 'N/A';
              const topBarangayCases = (stats.cases_by_barangay && stats.cases_by_barangay.length > 0) ? stats.cases_by_barangay[0].total : 0;
              const topDemo = (stats.demographics_by_age && stats.demographics_by_age.length > 0) ? stats.demographics_by_age[0].category : 'N/A';
              const totalBarangays = (stats.cases_by_barangay || []).length;
              
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Top Diagnosis" value={topDiagnosis} sub={topDiagnosis !== 'N/A' ? \`\${topDiagnosisCases} total reported cases\` : 'No data yet'} color="rose" />
                  <StatCard label="Most Affected Area" value={topBarangay} sub={topBarangay !== 'N/A' ? \`\${topBarangayCases} cases in this barangay\` : 'No data yet'} color="amber" />
                  <StatCard label="Primary Demo" value={topDemo} sub="Highest case concentration" color="sky" />
                  <StatCard label="Barangays Covered" value={totalBarangays} sub="Areas with active patients" color="emerald" />
                </div>
              );
            })()}
`;
  
  f = f.slice(0, insertIndex) + newStats + f.slice(insertIndex);
  fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', f);
  console.log('Added stat cards to Epidemiology tab');
} else {
  console.log('Could not find epidemiology tab');
}
