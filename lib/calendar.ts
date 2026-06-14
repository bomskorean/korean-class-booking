// Google Calendar 双方向同期（ダブルブッキング防止）— PRD 6.4
import { google } from "googleapis";

function client() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SA_EMAIL,
    key: (process.env.GOOGLE_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}
const CAL = process.env.GOOGLE_CALENDAR_ID ?? "primary";

// busy 区間を取得 → 予約スロット生成時に渡す（lib/slots.generateSlots）
export async function getBusy(timeMin: Date, timeMax: Date) {
  const cal = client();
  const r = await cal.freebusy.query({
    requestBody: { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(), items: [{ id: CAL }] },
  });
  const busy = r.data.calendars?.[CAL]?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start!), end: new Date(b.end!) }));
}

// 予約確定 → カレンダーに占有イベント作成（block長 60/70分）。gcalEventId を保存。
export async function createEvent(p: { summary: string; start: Date; end: Date }) {
  const cal = client();
  const r = await cal.events.insert({
    calendarId: CAL,
    requestBody: {
      summary: p.summary,
      start: { dateTime: p.start.toISOString() },
      end: { dateTime: p.end.toISOString() },
    },
  });
  return r.data.id!;
}

export async function deleteEvent(eventId: string) {
  await client().events.delete({ calendarId: CAL, eventId });
}
