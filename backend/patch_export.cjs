const fs = require('fs');
let f = fs.readFileSync('../frontend/src/pages/dashboard/Analytics.jsx', 'utf-8');

// Fix Total Consultations bug
f = f.replace(
  /\$\{kpiCard\('Total Consultations', formatNumber\(summary\.registered_patients\), '#0ea5e9'\)\}/,
  "${kpiCard('Registered Patients', formatNumber(summary.registered_patients), '#0ea5e9')}"
);

// We should create a new KPI grid for Epidemiology
const kpiEpi = `
    const topDiagnosis = (reportStats.top_diseases && reportStats.top_diseases.length > 0) ? reportStats.top_diseases[0].diagnosis : 'N/A';
    const topBarangay = (reportStats.cases_by_barangay && reportStats.cases_by_barangay.length > 0) ? reportStats.cases_by_barangay[0].barangay : 'N/A';
    const topDemo = (reportStats.demographics_by_age && reportStats.demographics_by_age.length > 0) ? reportStats.demographics_by_age[0].category : 'N/A';
    const totalBarangays = (reportStats.cases_by_barangay || []).length;

    const epiKpiGrid = \`
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;table-layout:fixed;">
        <tr>
          \${kpiCard('Top Diagnosis', topDiagnosis, '#f43f5e')}
          \${kpiCard('Most Affected Area', topBarangay, '#f59e0b')}
          \${kpiCard('Primary Demo', topDemo, '#0ea5e9')}
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-top:3px solid #10b981;background:#f8fafc;">
              <tr><td style="padding:12px 14px;">
                <div style="font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;">Barangays Covered</div>
                <div style="font-size:18px;font-weight:800;color:#10b981;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">\${totalBarangays}</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>\`;
`;

// Inject before `const volumeRows = ...`
const insertionPoint = f.indexOf('const volumeRows  = reportStats.time_based_volume');
f = f.slice(0, insertionPoint) + kpiEpi + '\n    ' + f.slice(insertionPoint);

// Add epiKpiGrid to Page 3
const page3 = "wrap(`\n        ${miniHeader('Epidemiology & Pharmacy Report')}\n        ${sectionHeader('Population Health Summary', '#8b5cf6')}\n        ${epiKpiGrid}";
f = f.replace(/wrap\(`\n\s*\$\{miniHeader\('Epidemiology & Pharmacy Report'\)\}/, page3);

fs.writeFileSync('../frontend/src/pages/dashboard/Analytics.jsx', f);
console.log('Fixed export');
