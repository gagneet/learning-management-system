import { Lexend, Inter, Atkinson_Hyperlegible } from 'next/font/google';

export const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const atkinson = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-atkinson',
  display: 'swap',
});
