import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

// Public API: Frankfurter.app - free, no API key required
const API_URL = 'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP';

interface Rates {
  [key: string]: number;
}

interface ApiResponse {
  rates: Rates;
  base: string;
  date: string;
}

export default function ExchangeRateWidget() {
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setRates(data.rates);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch rates');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 animate-pulse" />
          Loading exchange rates...
        </p>
      </div>
    );
  }

  if (error || !rates) {
    return (
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <p className="text-sm text-amber-800">Exchange rates temporarily unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-4 shadow-sm">
      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5" />
        Live Exchange Rates (USD)
      </p>
      <div className="space-y-1.5">
        {Object.entries(rates).map(([currency, rate]) => (
          <div key={currency} className="flex text-sm">
            <span className="text-gray-600">1 USD =</span>
            <span className="font-semibold text-gray-900">
              {rate.toFixed(4)} {currency}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">Source: Frankfurter.app (public API)</p>
    </div>
  );
}
