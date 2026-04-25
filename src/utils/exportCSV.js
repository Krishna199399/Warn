/**
 * Exports an array of objects as a CSV file download.
 * @param {Object[]} data  - Array of flat objects
 * @param {string}   filename - e.g. 'commissions_export'
 * @param {string[]} columns  - Optional: ordered list of keys to include
 */
export function exportCSV(data, filename = 'export', columns) {
  if (!data?.length) return;

  const keys = columns || Object.keys(data[0]);
  const header = keys.map(k => `"${k}"`).join(',');
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k] ?? '';
      // Escape quotes in values
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default exportCSV;
