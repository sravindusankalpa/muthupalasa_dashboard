import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Image from "next/image"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MongoDB Dashboard",
  description: "Event Registration & Kiosk Data Reports",
  generator: 'v0.dev'
}

// Navbar component with 4 logos
function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center">
          {/* 4 logos in columns */}
          <div className="flex items-center space-x-8 py-10">
            <Image 
              src="/logo1.png" 
              alt="Logo 1" 
              width={48} 
              height={48} 
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            <Image 
              src="/logo4.webp" 
              alt="Logo 2" 
              width={38} 
              height={38} 
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            <Image 
              src="/logo2.png" 
              alt="Logo 3" 
              width={48} 
              height={48} 
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
            <Image 
              src="/logo3.png" 
              alt="Logo 4" 
              width={48} 
              height={48} 
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}