import "./globals.css";

export const metadata = {
  title: "가장의 안식 - 당신의 어깨를 보듬는 심리 케어",
  description: "대한민국 50대 가장들을 위한 매일의 위로와 심리적 안식처",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
