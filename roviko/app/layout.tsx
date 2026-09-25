import type { Metadata } from 'next';
import { BRAND } from '@/lib/config';
import './globals.css';
import './revamp.css';
import './atelier.css';
import './rank.css';
import './playful.css';
import './competition.css';
import './polish.css';
import './design.css';
export const metadata: Metadata = { title: BRAND.name + ' — The world is your playground', description: 'A little curiosity. A whole world of play. Play original geography games, take the daily expedition and challenge friends in live private rooms.', manifest: '/manifest.webmanifest', icons: { icon: '/favicon.png', apple: '/icon-192.png' }, openGraph: { title: BRAND.name + ' — Hello, world. Let’s play.', description: 'Five daily games, surprising country rankings and six classic geography games. Play solo or with friends.', type: 'website' } };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="en" data-theme="light" suppressHydrationWarning><body>{children}</body></html>; }
