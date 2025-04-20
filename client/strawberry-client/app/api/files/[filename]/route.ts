import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params
        const filePath = path.join(process.cwd(), "../../server/data", filename)

        // Read the file content
        const fileContent = fs.readFileSync(filePath, "utf-8")
        const ticketData = JSON.parse(fileContent)

        return NextResponse.json(ticketData)
    } catch (error) {
        console.error("Error reading file:", error)
        return NextResponse.json(
            { error: "Failed to read file" },
            { status: 500 }
        )
    }
}
