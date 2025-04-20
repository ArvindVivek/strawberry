import { useEffect } from "react"
import { checkForNewFiles } from "@/lib/data/loadTickets"

export function useFileWatcher() {
    useEffect(() => {
        // Initial check
        checkForNewFiles()

        // Set up interval for periodic checks
        const interval = setInterval(checkForNewFiles, 1000)

        // Cleanup interval on unmount
        return () => clearInterval(interval)
    }, [])
}
