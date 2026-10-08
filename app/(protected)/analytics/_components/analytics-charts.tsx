"use client"

// Composants de graphiques isolés dans leur propre module afin que recharts
// soit chargé via next/dynamic (voir page.tsx) et sorte du First Load JS de
// la route /analytics, au lieu d'être importé statiquement sur la page.
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts"

type Slice = { name: string; value: number; color: string }

const fmt = (value: number) => value.toLocaleString("fr-FR")

export function EvolutionAreaChart({ data }: { data: { month: string; value: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1f53cc" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#1f53cc" stopOpacity={0.16} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8ebf2" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#72809a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#72809a", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value: number) => [fmt(value), "CV analysés"]} />
                <Area type="monotone" dataKey="value" stroke="#1241bd" strokeWidth={2} fill="url(#evolutionGradient)" />
            </AreaChart>
        </ResponsiveContainer>
    )
}

export function ActivityPieChart({ data }: { data: Slice[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="52%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                >
                    {data.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
            </PieChart>
        </ResponsiveContainer>
    )
}

export function MonthlyBarChart({ data }: { data: { month: string; cv: number; entretiens: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#eceff5" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: "#72809a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#72809a", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cv" name="CV analysés" fill="#23b27e" maxBarSize={26} />
                <Bar dataKey="entretiens" name="Entretiens simulés" fill="#f39c12" maxBarSize={26} />
            </BarChart>
        </ResponsiveContainer>
    )
}

export function UserDistributionPieChart({ data }: { data: Slice[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} cx="50%" cy="52%" outerRadius={68} dataKey="value" stroke="none">
                    {data.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
            </PieChart>
        </ResponsiveContainer>
    )
}
