import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
    title: "Strawberry",
    description: "A modern support desk platform",
    generator: "Strawberry",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
