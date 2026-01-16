import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Smart Task - Welcome Screen',
  description: 'Elevate your productivity with clarity and modern workflow design.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;700&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="font-display antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}