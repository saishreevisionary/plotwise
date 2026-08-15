import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PLOTWISE AI - From Static Layouts to Intelligent 3D Land',
  description:
    'Transform static real-estate layout blueprints (PDF/JPG/PNG) into intelligent, interactive 2D digital site maps and dynamic 3D extruded land visualizations with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans selection:bg-indigo-500 selection:text-white min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
