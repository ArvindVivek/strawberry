import { useState, useEffect } from "react"
import { checkForNewFiles } from "@/lib/data/loadTickets"

interface FileInfo {
    filename: string
    path: string
    last_modified: string
}

export function useFileMonitor() {
    const [files, setFiles] = useState<FileInfo[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchFiles = async () => {
        try {
            const currentFiles = checkForNewFiles()
            setFiles(
                currentFiles.map((filename) => ({
                    filename,
                    path: `/data/${filename}`,
                    last_modified: new Date().toISOString(),
                }))
            )
            setIsLoading(false)
        } catch (error) {
            console.error("Error fetching files:", error)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Initial fetch
        fetchFiles()

        // Poll every 5 seconds
        const interval = setInterval(fetchFiles, 5000)

        return () => clearInterval(interval)
    }, [])

    return { files, isLoading }
}
