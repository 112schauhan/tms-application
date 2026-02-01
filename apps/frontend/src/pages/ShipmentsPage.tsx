import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Link, useSearchParams } from 'react-router-dom';
import { GET_SHIPMENTS } from '../graphql/operations';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import ShipmentGrid from '../components/shipments/ShipmentGrid';
import ShipmentTile from '../components/shipments/ShipmentTile';
import ExchangeRateWidget from '../components/widgets/ExchangeRateWidget';

type ViewMode = 'grid' | 'tile';

interface Shipment {
  id: string;
  trackingNumber: string;
  shipperName: string;
  consigneeName: string;
  status: string;
  pickupLocation: { city: string; state: string; country: string };
  deliveryLocation: { city: string; state: string; country: string };
  carrierName: string | null;
  rate: number | null;
  currency: string | null;
  isFlagged: boolean;
  pickupDate: string | null;
  estimatedDelivery: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PICKED_UP', label: 'Picked Up' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const SORT_OPTIONS = [
  { field: 'CREATED_AT', order: 'DESC', label: 'Newest First' },
  { field: 'CREATED_AT', order: 'ASC', label: 'Oldest First' },
  { field: 'TRACKING_NUMBER', order: 'ASC', label: 'Tracking # (A-Z)' },
  { field: 'STATUS', order: 'ASC', label: 'Status' },
  { field: 'RATE', order: 'DESC', label: 'Highest Rate' },
  { field: 'RATE', order: 'ASC', label: 'Lowest Rate' },
];

export default function ShipmentsPage() {
  const { settings } = useSystemSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(settings.defaultShipmentView);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [sortIndex, setSortIndex] = useState(0);
  const [page, setPage] = useState(1);
  const limit = settings.paginationLimit;

  const sort = SORT_OPTIONS[sortIndex];

  interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalPages: number;
    totalCount: number;
    currentPage: number;
  }

  const { data, loading, fetchMore } = useQuery<{
    shipments: { edges: { node: Shipment }[]; pageInfo: PageInfo }
  }>(GET_SHIPMENTS, {
    variables: {
      filter: {
        ...(selectedStatus && { status: [selectedStatus] }),
        ...(searchTerm && { searchTerm }),
      },
      sort: { field: sort.field, order: sort.order },
      pagination: { page, limit },
    },
  });

  // Deduplicate by id to avoid "Encountered two children with the same key" (e.g. from Apollo merge)
  const shipments: Shipment[] = (() => {
    const nodes = data?.shipments?.edges?.map((edge) => edge.node) || [];
    const seen = new Set<string>();
    return nodes.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  })();
  const pageInfo = data?.shipments?.pageInfo;

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleLoadMore = () => {
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          pagination: { page: page + 1, limit },
        },
      });
      setPage(page + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Exchange Rate + New Shipment */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-500 mt-1">
            {pageInfo?.totalCount || 0} total shipments
          </p>
        </div>
        <div className="lg:w-72 flex flex-col gap-4 flex-shrink-0">
          {settings.showExchangeRate && <ExchangeRateWidget />}
          <Link
            to="/shipments/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Shipment
          </Link>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by tracking #, shipper, consignee, carrier..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortIndex}
            onChange={(e) => {
              setSortIndex(parseInt(e.target.value));
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map((option, index) => (
              <option key={index} value={index}>
                {option.label}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2.5 flex items-center gap-2 transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('tile')}
              className={`px-4 py-2.5 flex items-center gap-2 transition-colors ${
                viewMode === 'tile' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {viewMode === 'grid' ? (
          <ShipmentGrid shipments={shipments} loading={loading} />
        ) : (
          <div className="p-6">
            <ShipmentTile shipments={shipments} loading={loading} />
          </div>
        )}

        {/* Pagination */}
        {pageInfo && pageInfo.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {shipments.length} of {pageInfo.totalCount} shipments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={!pageInfo.hasPreviousPage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {pageInfo.currentPage} of {pageInfo.totalPages}
              </span>
              <button
                onClick={handleLoadMore}
                disabled={!pageInfo.hasNextPage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
