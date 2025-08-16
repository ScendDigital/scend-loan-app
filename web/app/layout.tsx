// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Scend Tools',
  description: 'Scend — SARS PAYE Calculator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
