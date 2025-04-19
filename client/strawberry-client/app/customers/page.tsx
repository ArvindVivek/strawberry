import { Search } from "lucide-react"
import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/layout/header"

export default function CustomersPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[#2C1810] md:text-3xl">
                        Customers
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#2C1810]" />
                            <Input
                                placeholder="Search customers..."
                                className="pl-8 w-[300px]"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-[#FF5252]/5 hover:bg-[#FF5252]/10 border-[#FF5252]/20 text-[#2C1810]"
                        >
                            Add Customer
                        </Button>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-[#FF5252]/20 hover:border-[#FF5252]/40 transition-colors">
                        <CardHeader className="p-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                                        alt="Sarah Johnson"
                                    />
                                    <AvatarFallback>SJ</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Sarah Johnson
                                    </CardTitle>
                                    <p className="text-sm text-[#2C1810]">
                                        sarah.j@example.com
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-[#FF5252] text-[#FFF5F5]">
                                    Premium
                                </Badge>
                                <Badge className="bg-[#FFE5E5] text-[#2C1810]">
                                    Active
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#FF5252]/20 hover:border-[#FF5252]/40 transition-colors">
                        <CardHeader className="p-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
                                        alt="Michael Chen"
                                    />
                                    <AvatarFallback>MC</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Michael Chen
                                    </CardTitle>
                                    <p className="text-sm text-[#2C1810]">
                                        m.chen@example.com
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-[#FF8A80] text-[#2C1810]">
                                    Basic
                                </Badge>
                                <Badge className="bg-[#FFE5E5] text-[#2C1810]">
                                    Active
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-[#FF5252]/20 hover:border-[#FF5252]/40 transition-colors">
                        <CardHeader className="p-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma"
                                        alt="Emma Wilson"
                                    />
                                    <AvatarFallback>EW</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Emma Wilson
                                    </CardTitle>
                                    <p className="text-sm text-[#2C1810]">
                                        emma.w@example.com
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-[#FF5252] text-[#FFF5F5]">
                                    Premium
                                </Badge>
                                <Badge className="bg-[#FFE5E5] text-[#2C1810]">
                                    Active
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}

interface CustomerItemProps {
    name: string
    email: string
    status: "active" | "inactive"
    subscription: "Basic" | "Premium"
    tickets: number
    lastActive: string
}

function CustomerItem({
    name,
    email,
    status,
    subscription,
    tickets,
    lastActive,
}: CustomerItemProps) {
    return (
        <div className="flex items-center gap-4 p-4 hover:bg-muted/50">
            <Avatar className="h-10 w-10">
                <AvatarImage
                    src={`/placeholder.svg?height=40&width=40`}
                    alt={name}
                />
                <AvatarFallback>
                    {name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium">{name}</p>
                    <span className="text-xs text-muted-foreground">
                        {email}
                    </span>
                    <Badge
                        variant="outline"
                        className={
                            status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {status}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span>
                        <span className="font-medium">{subscription}</span>
                    </span>
                    <span>•</span>
                    <span>
                        <span className="font-medium">{tickets}</span> open
                        tickets
                    </span>
                    <span>•</span>
                    <span className="text-muted-foreground">
                        Last active: {lastActive}
                    </span>
                </div>
            </div>
            <Button variant="ghost" size="sm">
                View
            </Button>
        </div>
    )
}
