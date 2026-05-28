import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReleaseNotesModal } from "@/components/ReleaseNotesModal";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          {children}
          <ReleaseNotesModal />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
