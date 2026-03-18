// GA4 Data API reporting script for beatthebotsdaily.com
// Usage: GA4_PROPERTY_ID=<numeric_id> node ga4-report.js
// Or: node ga4-report.js <numeric_property_id>
//
// Find your GA4 Property ID: GA4 Admin → Property Settings → Property ID (number at top)
// Example: 123456789 (NOT the G-XXXXXXX measurement ID)

const { google } = require('googleapis');

const KEY_FILE = process.env.GA4_KEY_FILE ||
  '/Users/jlusenhop/JanovaAI/product_lines/ai-wordgames/pipeline-490616-b662a94ce4e0.json';
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || process.argv[2];

if (!PROPERTY_ID) {
  console.error('Error: GA4 numeric property ID required.');
  console.error('Usage: GA4_PROPERTY_ID=123456789 node ga4-report.js');
  console.error('Find it: GA4 → Admin → Property Settings → Property ID');
  process.exit(1);
}

async function runReport() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  const authClient = await auth.getClient();
  const token = await authClient.getAccessToken();
  const headers = {
    'Authorization': `Bearer ${token.token}`,
    'Content-Type': 'application/json',
  };

  const property = `properties/${PROPERTY_ID}`;
  const baseUrl = `https://analyticsdata.googleapis.com/v1beta/${property}:runReport`;

  // Report 1: Daily Active Users (last 7 days)
  const dauReport = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    }),
  }).then(r => r.json());

  // Report 2: Top traffic sources
  const sourceReport = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    }),
  }).then(r => r.json());

  // Report 3: Most visited pages
  const pageReport = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    }),
  }).then(r => r.json());

  console.log('\n=== GA4 BASELINE REPORT — beatthebotsdaily.com ===\n');

  // DAU table
  console.log('## Daily Active Users (last 7 days)\n');
  if (dauReport.rows) {
    dauReport.rows.forEach(row => {
      const date = row.dimensionValues[0].value;
      const users = row.metricValues[0].value;
      const formatted = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`;
      console.log(`  ${formatted}: ${users} users`);
    });
  } else {
    console.log('  No data yet (GA4 may still be in 24-48h propagation window)');
    if (dauReport.error) console.log('  Error:', dauReport.error.message);
  }

  // Traffic sources
  console.log('\n## Top Traffic Sources\n');
  if (sourceReport.rows) {
    sourceReport.rows.slice(0, 5).forEach(row => {
      const source = row.dimensionValues[0].value;
      const medium = row.dimensionValues[1].value;
      const sessions = row.metricValues[0].value;
      console.log(`  ${source} / ${medium}: ${sessions} sessions`);
    });
  } else {
    console.log('  No data yet');
    if (sourceReport.error) console.log('  Error:', sourceReport.error.message);
  }

  // Top pages
  console.log('\n## Most Visited Pages\n');
  if (pageReport.rows) {
    pageReport.rows.slice(0, 5).forEach(row => {
      const page = row.dimensionValues[0].value;
      const views = row.metricValues[0].value;
      console.log(`  ${page}: ${views} views`);
    });
  } else {
    console.log('  No data yet');
    if (pageReport.error) console.log('  Error:', pageReport.error.message);
  }

  return { dauReport, sourceReport, pageReport };
}

runReport().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
