"use client"

// Graphiques isolés pour permettre un import next/dynamic (ssr:false) depuis
// page.tsx : recharts sort ainsi du First Load JS de la route /comptabilite.
import {
    Line,
    LineChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

type TrendPoint = { month: string; value: number }

export function RevenueLineChart({ data }: { data: TrendPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#e8ebf2" strokeDasharray="3 3" vertical />
                <XAxis dataKey="month" tick={{ fill: "#7f8797", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                    tick={{ fill: "#7f8797", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                    tickFormatter={(value) => value.toLocaleString("fr-FR")}
                />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString("fr-FR")} FCFA`, "Revenus"]} />
                <Line type="monotone" dataKey="value" stroke="#2b78f6" strokeWidth={2.4} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    )
}

export function SubscriptionsBarChart({ data }: { data: TrendPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 6, left: 4, bottom: 0 }}>
                <CartesianGrid stroke="#e8ebf2" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#7f8797", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                    tick={{ fill: "#7f8797", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                />
                <Tooltip formatter={(value: number) => [value, "Abonnements"]} />
                <Bar dataKey="value" fill="#3b7ddd" radius={[2, 2, 0, 0]} maxBarSize={56} />
            </BarChart>
        </ResponsiveContainer>
    )
}
