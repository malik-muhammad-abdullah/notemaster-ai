import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./auth/Provider";
import MainNavigation from "./components/MainNavigation";
import { LoadingProvider } from "./components/LoadingProvider";
import MainContentWrapper from "./components/MainContentWrapper";
import NavigationEvents from "./components/NavigationEvents";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoteMaster AI",
  description: "Your AI-powered note-taking and learning assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <AuthProvider>
          <LoadingProvider>
            <div className="flex flex-col h-full">
              <MainNavigation />
              <NavigationEvents />
              <div className="flex-grow">
                <main id="main-content" className="h-fulllll">
                  <MainContentWrapper>
                    {children}
                  </MainContentWrapper>
                </main>
              </div>
            </div>
          </LoadingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
