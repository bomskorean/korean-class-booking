// LINE Messaging API (Push) ラッパー — PRD 3.5 / 6.1
import { messagingApi } from "@line/bot-sdk";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
});

export async function pushText(lineUserId: string, text: string) {
  if (!lineUserId) return;
  await client.pushMessage({ to: lineUserId, messages: [{ type: "text", text }] });
}

// 例：予約完了通知
export async function notifyBookingConfirmed(lineUserId: string, p: {
  date: string; course: string; teacher?: string; place?: string;
}) {
  await pushText(
    lineUserId,
    `【予約完了】\n${p.date}\nコース：${p.course}` +
      (p.teacher ? `\n講師：${p.teacher}` : "") +
      (p.place ? `\n場所：${p.place}` : "") +
      `\n\n変更・キャンセルは開始24時間前まで無料（1回限り）。`,
  );
}
