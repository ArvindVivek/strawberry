import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
    try {
        // Path to the server/data folder
        const dataFolder = path.join(process.cwd(), "../../server/data")

        // Read all files in the directory
        const files = fs.readdirSync(dataFolder)

        // Filter for JSON files
        const jsonFiles = files.filter((file) => file.endsWith(".json"))

        return NextResponse.json(jsonFiles)
    } catch (error) {
        console.error("Error reading files:", error)
        return NextResponse.json(
            { error: "Failed to read files" },
            { status: 500 }
        )
    }
}
