// app/page.tsx
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Scend Tools',
  description: 'Tax calculator',
};

export default function Home() {
  redirect('/tax');
}
