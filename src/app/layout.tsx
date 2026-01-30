import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Lato } from "next/font/google";
import { Urbanist } from "next/font/google";
import { Lexend } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });
const urbanist = Urbanist({ subsets: ["latin"], weight: ["400", "700"] });
const lexend = Lexend({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "WIG",
  description: "Discover local events and connect with your community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={urbanist.className}>
          <TRPCProvider>
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
