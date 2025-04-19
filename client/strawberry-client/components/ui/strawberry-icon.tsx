import { cn } from "@/lib/utils"

interface StrawberryIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string
}

export function StrawberryIcon({ className, ...props }: StrawberryIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("h-8 w-8", className)}
            {...props}
        >
            {/* Strawberry body */}
            <path
                d="M12 2C8.5 2 6 4.5 6 8C6 11.5 8.5 14 12 14C15.5 14 18 11.5 18 8C18 4.5 15.5 2 12 2Z"
                fill="url(#strawberry-gradient)"
            />
            {/* Leaf */}
            <path
                d="M12 2C12 2 10 4 10 6C10 8 12 10 12 10C12 10 14 8 14 6C14 4 12 2 12 2Z"
                fill="#E8F5E9"
            />
            {/* Seeds */}
            <circle cx="9" cy="7" r="0.5" fill="#FFCDD2" />
            <circle cx="11" cy="5" r="0.5" fill="#FFCDD2" />
            <circle cx="13" cy="7" r="0.5" fill="#FFCDD2" />
            <circle cx="15" cy="5" r="0.5" fill="#FFCDD2" />
            <circle cx="11" cy="9" r="0.5" fill="#FFCDD2" />
            <circle cx="13" cy="11" r="0.5" fill="#FFCDD2" />
            <defs>
                <linearGradient
                    id="strawberry-gradient"
                    x1="6"
                    y1="2"
                    x2="18"
                    y2="14"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset="0%" stopColor="#FF8A80" />
                    <stop offset="100%" stopColor="#FF5252" />
                </linearGradient>
            </defs>
        </svg>
    )
}
