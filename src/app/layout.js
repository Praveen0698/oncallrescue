import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import PWARegister from "@/components/PWARegister";

export const viewport = {
  themeColor: "#C8372D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "OnCallRescue — Emergency Medical ID",
  description:
    "Your encrypted emergency identity — accessible when it matters most. ₹199 lifetime.",
  keywords: "emergency, medical id, qr code, vehicle safety, road safety",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OnCallRescue",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Google AdSense — loaded directly in head to avoid Next.js hydration conflict */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9588686587625852"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-surface-100 font-body antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "'Outfit', sans-serif",
              fontSize: "14px",
              borderRadius: "12px",
              padding: "12px 16px",
            },
            success: { iconTheme: { primary: "#2D8A56", secondary: "#fff" } },
            error: { iconTheme: { primary: "#C8372D", secondary: "#fff" } },
          }}
        />
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
