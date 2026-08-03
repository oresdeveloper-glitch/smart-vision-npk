interface ReportData {
  id: string;
  imageData: string;
  cropType: string;
  deficiency: string;
  confidence: number;
  severity: string;
  riskLevel: string;
  timestamp: number;
  recommendations: string[];
  treatmentSteps: string[];
  preventionMeasures: string[];
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export async function generatePDF(data: ReportData): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 190;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(46, 125, 50);
  doc.text('Smart Vision NPK', pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('AI-Powered Leaf Deficiency Detection System', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(46, 125, 50);
  doc.line(10, y, 200, y);
  y += 8;

  // Report ID & Date
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Report ID: ${data.id}`, 10, y);
  doc.text(`Generated: ${formatDate(Date.now())}`, pageW - 10, y, { align: 'right' });
  y += 5;
  doc.text(`Scan Date: ${formatDate(data.timestamp)}`, 10, y);
  y += 10;

  // Results box
  doc.setFillColor(240, 248, 235);
  doc.setDrawColor(46, 125, 50);
  doc.roundedRect(10, y, pageW, 35, 3, 3, 'FD');
  y += 7;

  doc.setFontSize(14);
  doc.setTextColor(46, 125, 50);
  const defLabel = data.deficiency === 'healthy' ? 'Healthy Leaf' : `${data.deficiency.charAt(0).toUpperCase() + data.deficiency.slice(1)} Deficiency`;
  doc.text(`Detection Result: ${defLabel}`, 16, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Crop Type: ${data.cropType.charAt(0).toUpperCase() + data.cropType.slice(1)}`, 16, y);
  y += 5;
  doc.text(`Confidence: ${data.confidence.toFixed(1)}%`, 16, y);
  y += 5;
  doc.text(`Severity: ${data.severity.charAt(0).toUpperCase() + data.severity.slice(1)}`, 16, y);
  y += 5;
  doc.text(`Risk Level: ${data.riskLevel}`, 16, y);
  y += 12;

  // Recommendations
  doc.setFontSize(12);
  doc.setTextColor(46, 125, 50);
  doc.text('Fertilizer Recommendations', 10, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  data.recommendations.slice(0, 4).forEach((rec, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${i + 1}. ${rec}`, 14, y);
    y += 5;
  });
  y += 5;

  // Treatment Steps
  doc.setFontSize(12);
  doc.setTextColor(46, 125, 50);
  doc.text('Treatment Steps', 10, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  data.treatmentSteps.slice(0, 5).forEach((step, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${i + 1}. ${step}`, 14, y);
    y += 5;
  });
  y += 5;

  // Prevention
  doc.setFontSize(12);
  doc.setTextColor(46, 125, 50);
  doc.text('Prevention Measures', 10, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  data.preventionMeasures.slice(0, 4).forEach((m, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${i + 1}. ${m}`, 14, y);
    y += 5;
  });

  // Footer
  y = 285;
  doc.setDrawColor(200, 200, 200);
  doc.line(10, y, 200, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Smart Vision NPK — © 2026 All Rights Reserved', pageW / 2, y, { align: 'center' });

  doc.save(`npk_report_${data.id}.pdf`);
}

export async function generateHistoryReport(scans: ReportData[]): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 190;
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(46, 125, 50);
  doc.text('Smart Vision NPK', pageW / 2, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Complete Analysis History Report', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setDrawColor(46, 125, 50);
  doc.line(10, y, 200, y);
  y += 8;

  const healthy = scans.filter(s => s.deficiency === 'healthy').length;
  const deficient = scans.length - healthy;
  const topDef = scans.reduce((acc, s) => {
    if (s.deficiency !== 'healthy') acc[s.deficiency] = (acc[s.deficiency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommon = Object.entries(topDef).sort((a, b) => b[1] - a[1])[0];

  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Total Analyses: ${scans.length}`, 10, y); y += 6;
  doc.text(`Healthy Crops: ${healthy}`, 10, y); y += 6;
  doc.text(`Deficiencies Detected: ${deficient}`, 10, y); y += 6;
  if (mostCommon) doc.text(`Most Common Deficiency: ${mostCommon[0]} (${mostCommon[1]} times)`, 10, y);
  y += 12;

  // Individual records
  doc.setFontSize(14);
  doc.setTextColor(46, 125, 50);
  doc.text('Individual Records', 10, y);
  y += 8;
  doc.setFontSize(8);

  scans.slice(0, 50).forEach((s, i) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(220, 220, 220);
    doc.line(10, y, 200, y);
    y += 4;
    doc.setTextColor(50, 50, 50);
    const def = s.deficiency === 'healthy' ? 'Healthy' : `${s.deficiency.charAt(0).toUpperCase() + s.deficiency.slice(1)} Deficiency`;
    doc.text(`${i + 1}. ${def} — ${s.confidence.toFixed(1)}% confidence (${s.cropType})`, 10, y);
    y += 4;
    doc.setTextColor(140, 140, 140);
    doc.text(`   ${formatDate(s.timestamp)}`, 10, y);
    y += 6;
  });

  doc.save('npk_history_report.pdf');
}
