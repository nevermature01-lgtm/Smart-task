import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import SupabaseAuthProvider from '@/context/SupabaseAuthProvider';

export const metadata: Metadata = {
  title: 'Smart Task - Welcome Screen',
  description: 'Evolve the way you manage productivity.',
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
      <body className="font-display antialiased m-0 p-0 mesh-background text-white" suppressHydrationWarning>
        <SupabaseAuthProvider>
          {children}
        </SupabaseAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
