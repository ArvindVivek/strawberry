"use client"

import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts"

const ticketData = [
    { name: "Mon", tickets: 45 },
    { name: "Tue", tickets: 52 },
    { name: "Wed", tickets: 38 },
    { name: "Thu", tickets: 65 },
    { name: "Fri", tickets: 48 },
    { name: "Sat", tickets: 32 },
    { name: "Sun", tickets: 25 },
]

const responseTimeData = [
    { name: "Mon", time: 8.2 },
    { name: "Tue", time: 7.5 },
    { name: "Wed", time: 6.8 },
    { name: "Thu", time: 7.1 },
    { name: "Fri", time: 6.5 },
    { name: "Sat", time: 5.9 },
    { name: "Sun", time: 5.2 },
]

const ticketStatusData = [
    { name: "Open", value: 35 },
    { name: "Pending", value: 25 },
    { name: "Closed", value: 40 },
]

const COLORS = ["#FF5252", "#FF8A80", "#FFE5E5"]

export default function AnalyticsPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[#2C1810] md:text-3xl">
                        Analytics
                    </h1>
                </div>
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="bg-[#FFE5E5]">
                        <TabsTrigger
                            value="overview"
                            className="data-[state=active]:bg-[#FF5252] data-[state=active]:text-[#FFF5F5]"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="tickets"
                            className="data-[state=active]:bg-[#FF5252] data-[state=active]:text-[#FFF5F5]"
                        >
                            Tickets
                        </TabsTrigger>
                        <TabsTrigger
                            value="customers"
                            className="data-[state=active]:bg-[#FF5252] data-[state=active]:text-[#FFF5F5]"
                        >
                            Customers
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <Card className="border-[#FF5252]/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Total Tickets
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#2C1810]">
                                        1,234
                                    </div>
                                    <p className="text-xs text-[#2C1810]">
                                        +12% from last month
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-[#FF5252]/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Resolution Rate
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#2C1810]">
                                        92%
                                    </div>
                                    <p className="text-xs text-[#2C1810]">
                                        +2% from last month
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-[#FF5252]/20">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Average Response Time
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-[#2C1810]">
                                        5m 23s
                                    </div>
                                    <p className="text-xs text-[#2C1810]">
                                        -12% from last month
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card className="border-[#FF5252]/20">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Weekly Ticket Volume
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <BarChart data={ticketData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#FFE5E5"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#2C1810"
                                                />
                                                <YAxis stroke="#2C1810" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor:
                                                            "#FFF5F5",
                                                        border: "1px solid #FF5252",
                                                        borderRadius: "8px",
                                                    }}
                                                />
                                                <Bar
                                                    dataKey="tickets"
                                                    fill="#FF5252"
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-[#FF5252]/20">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                        Response Time Trend
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                        >
                                            <LineChart data={responseTimeData}>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#FFE5E5"
                                                />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="#2C1810"
                                                />
                                                <YAxis stroke="#2C1810" />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor:
                                                            "#FFF5F5",
                                                        border: "1px solid #FF5252",
                                                        borderRadius: "8px",
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="time"
                                                    stroke="#FF5252"
                                                    strokeWidth={2}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="tickets" className="space-y-4">
                        <Card className="border-[#FF5252]/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                    Ticket Status Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={ticketStatusData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={150}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) =>
                                                    `${name} ${(
                                                        percent * 100
                                                    ).toFixed(0)}%`
                                                }
                                            >
                                                {ticketStatusData.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    index %
                                                                        COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#FFF5F5",
                                                    border: "1px solid #FF5252",
                                                    borderRadius: "8px",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="customers" className="space-y-4">
                        <Card className="border-[#FF5252]/20">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-[#2C1810]">
                                    Customer Analytics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-[#2C1810]">
                                    Detailed customer analytics coming soon.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
