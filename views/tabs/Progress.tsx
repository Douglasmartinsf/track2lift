import React from 'react';
import { UserProfile } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for demonstration - in real app, fetch from Supabase
const data = [
  { name: 'Sem 1', weight: 80, load: 100 },
  { name: 'Sem 2', weight: 79.5, load: 105 },
  { name: 'Sem 3', weight: 79.2, load: 110 },
  { name: 'Sem 4', weight: 78.8, load: 112 },
  { name: 'Sem 5', weight: 78.5, load: 115 },
  { name: 'Sem 6', weight: 78.0, load: 120 },
];

const ProgressTab: React.FC<{ user: UserProfile }> = ({ user }) => {
    return (
        <div className="space-y-8 pb-24">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-6 text-destaque">Evolução de Carga (Média)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip contentStyle={{ backgroundColor: '#181818', borderColor: '#333' }} />
                            <Line type="monotone" dataKey="load" stroke="#DC2626" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-6 text-blue-500">Peso Corporal</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" />
                            <YAxis stroke="#666" domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ backgroundColor: '#181818', borderColor: '#333' }} />
                            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ProgressTab;