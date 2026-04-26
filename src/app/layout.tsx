import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PromptQuest - AI를 잘 쓰는 개발자가 점수로 증명되는 곳',
  description:
    '실제 업무 시나리오 기반 태스크를 AI와 함께 풀고, 4단계 채점 파이프라인이 당신의 AI 활용 능력을 정량화합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
