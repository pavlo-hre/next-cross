import { google } from "googleapis";
import { getTabNames } from '@/app/lib/getTabNames';



export async function GET() {
  // 1️⃣ Fetch table info from database
  const tabNames = await getTabNames();

  const ranges = tabNames.map((t) => `${t}!A2:F`);

  // 2️⃣ Authenticate with Google
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 3️⃣ Fetch all tables in one batch
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    ranges,
  });

  // 4️⃣ Map response back to table names
  const result = {};
  response.data.valueRanges?.forEach((vr, i) => {
    (result as any)[tabNames[i]] = vr.values ?? [];
  });

  return Response.json(result);
}
