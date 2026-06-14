export const metadata = {
  title: "馬賑韓国語教室 ・ ご予約",
  description: "韓国語教室の予約・チケット・決済システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, background: "#f6f7fb" }}>{children}</body>
    </html>
  );
}
