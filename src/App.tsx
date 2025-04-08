import { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// 📌 Tipos
type AssetData = {
  totalNetInflow: number;
  bigVolumeNetInflow: number;
  buyMakerBigVolume: number;
  buyTakerBigVolume: number;
  mediumVolumeNetInflow: number;
  smallVolumeNetInflow: number;
  updateTimestamp: number;
};

type HistoryItem = {
  time: string;
  value: number;
};

type AssetCardProps = {
  title: string;
  data: AssetData | null;
  history: HistoryItem[];
};

// 🔢 Formatea números
function formatNumber(num: number) {
  return Number(num).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// 💰 Total Net Inflow destacado
function TotalInflow({ value }: { value: number }) {
  const isPositive = value > 0;
  return (
    <div className={`p-4 rounded-xl text-center font-bold text-2xl shadow-inner ${
      isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      💰 Total Net Inflow: {formatNumber(value)}
    </div>
  );
}

// 📈 Valor con tooltip
function FlowValue({ label, value, tooltip }: { label: string; value: number; tooltip: string }) {
  const isPositive = value > 0;
  return (
    <div className="flex justify-between text-lg text-gray-700">
      <span className="font-medium" title={tooltip}>{label}:</span>
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {formatNumber(value)}
      </span>
    </div>
  );
}

// 🧾 Componente con gráfico y datos
function AssetCard({ title, data, history }: AssetCardProps) {
  if (!data) {
    return (
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full text-center text-gray-500 text-xl">
        Cargando {title}...
      </div>
    );
  }

  return (
    <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-xl space-y-6 transition hover:scale-[1.01]">
      <h3 className="text-3xl font-bold text-gray-800 mb-2">{title}</h3>
      
      <TotalInflow value={data.totalNetInflow} />

      {/* 📊 Gráfico en tiempo real */}
      <div className="w-full h-64">
        <ResponsiveContainer>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke={data.totalNetInflow > 0 ? "#16a34a" : "#dc2626"}
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <FlowValue
        label="Big Volume Net Inflow"
        value={data.bigVolumeNetInflow}
        tooltip="Flujo neto de grandes órdenes"
      />
      <FlowValue
        label="Buy Maker Big Volume"
        value={data.buyMakerBigVolume}
        tooltip="Grandes órdenes de compra (limit orders)"
      />
      <FlowValue
        label="Buy Taker Big Volume"
        value={data.buyTakerBigVolume}
        tooltip="Grandes órdenes de compra (market orders)"
      />
      <FlowValue
        label="Medium Volume Net Inflow"
        value={data.mediumVolumeNetInflow}
        tooltip="Flujo neto de órdenes medianas"
      />
      <FlowValue
        label="Small Volume Net Inflow"
        value={data.smallVolumeNetInflow}
        tooltip="Flujo neto de órdenes pequeñas"
      />

      <div className="text-sm text-gray-400 pt-2 border-t border-gray-200">
        Última actualización: {new Date(data.updateTimestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

function App() {
  const [ethData, setEthData] = useState<AssetData | null>(null);
  const [btcData, setBtcData] = useState<AssetData | null>(null);

  const ethHistoryRef = useRef<HistoryItem[]>([]);
  const btcHistoryRef = useRef<HistoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ethRes, btcRes] = await Promise.all([
          fetch("https://www.binance.com/bapi/earn/v1/public/indicator/capital-flow/info?period=MINUTE_15&symbol=ETHUSDT"),
          fetch("https://www.binance.com/bapi/earn/v1/public/indicator/capital-flow/info?period=MINUTE_15&symbol=BTCUSDT")
        ]);

        const ethJson = await ethRes.json();
        const btcJson = await btcRes.json();

        const now = new Date().toLocaleTimeString();

        ethHistoryRef.current = [
          ...ethHistoryRef.current.slice(-19),
          { time: now, value: ethJson.data.totalNetInflow }
        ];
        btcHistoryRef.current = [
          ...btcHistoryRef.current.slice(-19),
          { time: now, value: btcJson.data.totalNetInflow }
        ];

        setEthData(ethJson.data);
        setBtcData(btcJson.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-6">
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-12">📊 Capital Flow Dashboard</h1>

      <div className="flex flex-col md:flex-row justify-center items-stretch gap-8">
        <AssetCard title="Ethereum (ETHUSDT)" data={ethData} history={ethHistoryRef.current} />
        <AssetCard title="Bitcoin (BTCUSDT)" data={btcData} history={btcHistoryRef.current} />
      </div>
    </div>
  );
}

export default App;
