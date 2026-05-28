import type { Metadata } from "next";
import { DM_Sans, Noto_Sans_Thai } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReleaseNotesModal } from "@/components/ReleaseNotesModal";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "JobTracker — Your AI-Powered Job Hunt",
  description:
    "Track applications, tailor your resume, and prep for interviews — all in one place.",
  manifest: "/manifest.json",
  applicationName: "JobTracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JobTracker",
  },
};

export const viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${notoSansThai.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col font-sans">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          {children}
          <ReleaseNotesModal />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
