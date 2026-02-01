import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function AnalyticsReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/analytics"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Detailed shipment reports and exports</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reports Coming Soon</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Export shipment data, generate custom reports, and schedule automated reports.
        </p>
        <Link
          to="/shipments"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Shipments
        </Link>
      </div>
    </div>
  );
}
