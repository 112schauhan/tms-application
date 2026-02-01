import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CREATE_SHIPMENT, UPDATE_SHIPMENT, GET_SHIPMENT, GET_SHIPMENTS } from '../../graphql/operations';

interface LocationInput {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface DimensionsInput {
  length: number;
  width: number;
  height: number;
}

interface ShipmentFormData {
  shipperName: string;
  shipperPhone: string;
  shipperEmail: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeEmail: string;
  pickupLocation: LocationInput;
  deliveryLocation: LocationInput;
  carrierName: string;
  carrierPhone: string;
  weight: string;
  dimensions: DimensionsInput;
  rate: string;
  currency: string;
  pickupDate: string;
  estimatedDelivery: string;
  notes: string;
}

const initialFormData: ShipmentFormData = {
  shipperName: '',
  shipperPhone: '',
  shipperEmail: '',
  consigneeName: '',
  consigneePhone: '',
  consigneeEmail: '',
  pickupLocation: { address: '', city: '', state: '', country: 'USA', postalCode: '' },
  deliveryLocation: { address: '', city: '', state: '', country: 'USA', postalCode: '' },
  carrierName: '',
  carrierPhone: '',
  weight: '',
  dimensions: { length: 0, width: 0, height: 0 },
  rate: '',
  currency: 'USD',
  pickupDate: '',
  estimatedDelivery: '',
  notes: '',
};

export default function ShipmentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Type for shipment query response
  interface ShipmentResponse {
    shipment: {
      shipperName: string;
      shipperPhone: string | null;
      shipperEmail: string | null;
      consigneeName: string;
      consigneePhone: string | null;
      consigneeEmail: string | null;
      pickupLocation: LocationInput;
      deliveryLocation: LocationInput;
      carrierName: string | null;
      carrierPhone: string | null;
      weight: number | null;
      dimensions: DimensionsInput | null;
      rate: number | null;
      currency: string | null;
      pickupDate: string | null;
      estimatedDelivery: string | null;
      notes: string | null;
    };
  }

  // Fetch existing shipment if editing
  const { data: shipmentData, loading: fetchLoading } = useQuery<ShipmentResponse>(GET_SHIPMENT, {
    variables: { id },
    skip: !isEdit,
  });

  // Populate form when data is loaded
  useEffect(() => {
    if (shipmentData?.shipment) {
      const s = shipmentData.shipment;
      setFormData({
        shipperName: s.shipperName || '',
        shipperPhone: s.shipperPhone || '',
        shipperEmail: s.shipperEmail || '',
        consigneeName: s.consigneeName || '',
        consigneePhone: s.consigneePhone || '',
        consigneeEmail: s.consigneeEmail || '',
        pickupLocation: {
          address: s.pickupLocation?.address || '',
          city: s.pickupLocation?.city || '',
          state: s.pickupLocation?.state || '',
          country: s.pickupLocation?.country || 'USA',
          postalCode: s.pickupLocation?.postalCode || '',
        },
        deliveryLocation: {
          address: s.deliveryLocation?.address || '',
          city: s.deliveryLocation?.city || '',
          state: s.deliveryLocation?.state || '',
          country: s.deliveryLocation?.country || 'USA',
          postalCode: s.deliveryLocation?.postalCode || '',
        },
        carrierName: s.carrierName || '',
        carrierPhone: s.carrierPhone || '',
        weight: s.weight?.toString() || '',
        dimensions: {
          length: s.dimensions?.length || 0,
          width: s.dimensions?.width || 0,
          height: s.dimensions?.height || 0,
        },
        rate: s.rate?.toString() || '',
        currency: s.currency || 'USD',
        pickupDate: s.pickupDate ? s.pickupDate.split('T')[0] : '',
        estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.split('T')[0] : '',
        notes: s.notes || '',
      });
    }
  }, [shipmentData]);

  const [createShipment, { loading: createLoading }] = useMutation(CREATE_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENTS }],
  });

  const [updateShipment, { loading: updateLoading }] = useMutation(UPDATE_SHIPMENT, {
    refetchQueries: [{ query: GET_SHIPMENT, variables: { id } }],
  });

  const loading = createLoading || updateLoading;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.shipperName.trim()) newErrors.shipperName = 'Shipper name is required';
    if (!formData.consigneeName.trim()) newErrors.consigneeName = 'Consignee name is required';
    if (!formData.pickupLocation.address.trim()) newErrors.pickupAddress = 'Pickup address is required';
    if (!formData.pickupLocation.city.trim()) newErrors.pickupCity = 'Pickup city is required';
    if (!formData.pickupLocation.country.trim()) newErrors.pickupCountry = 'Pickup country is required';
    if (!formData.deliveryLocation.address.trim()) newErrors.deliveryAddress = 'Delivery address is required';
    if (!formData.deliveryLocation.city.trim()) newErrors.deliveryCity = 'Delivery city is required';
    if (!formData.deliveryLocation.country.trim()) newErrors.deliveryCountry = 'Delivery country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const input = {
      shipperName: formData.shipperName,
      shipperPhone: formData.shipperPhone || null,
      shipperEmail: formData.shipperEmail || null,
      consigneeName: formData.consigneeName,
      consigneePhone: formData.consigneePhone || null,
      consigneeEmail: formData.consigneeEmail || null,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      carrierName: formData.carrierName || null,
      carrierPhone: formData.carrierPhone || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      dimensions: formData.dimensions.length > 0 ? formData.dimensions : null,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      currency: formData.currency || 'USD',
      pickupDate: formData.pickupDate || null,
      estimatedDelivery: formData.estimatedDelivery || null,
      notes: formData.notes || null,
    };

    try {
      if (isEdit) {
        await updateShipment({ variables: { id, input } });
        navigate(`/shipments/${id}`);
      } else {
        const result = await createShipment({ variables: { input } }) as {
          data?: { createShipment: { id: string } }
        };
        if (result.data?.createShipment?.id) {
          navigate(`/shipments/${result.data.createShipment.id}`);
        }
      }
    } catch (err) {
      console.error('Failed to save shipment:', err);
    }
  };

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const updateLocation = (type: 'pickupLocation' | 'deliveryLocation', field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const updateDimension = (field: keyof DimensionsInput, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [field]: parseFloat(value) || 0 },
    }));
  };

  if (fetchLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/shipments" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center">
          ← Back to Shipments
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Shipment' : 'Create New Shipment'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shipper Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📦</span> Shipper Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.shipperName}
                onChange={(e) => updateField('shipperName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.shipperName ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="John Doe"
              />
              {errors.shipperName && <p className="text-red-500 text-xs mt-1">{errors.shipperName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.shipperPhone}
                onChange={(e) => updateField('shipperPhone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.shipperEmail}
                onChange={(e) => updateField('shipperEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Pickup Location */}
          <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">Pickup Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.pickupLocation.address}
                onChange={(e) => updateLocation('pickupLocation', 'address', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pickupAddress ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.pickupLocation.city}
                onChange={(e) => updateLocation('pickupLocation', 'city', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.pickupCity ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.pickupLocation.state}
                onChange={(e) => updateLocation('pickupLocation', 'state', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                value={formData.pickupLocation.country}
                onChange={(e) => updateLocation('pickupLocation', 'country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="USA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.pickupLocation.postalCode}
                onChange={(e) => updateLocation('pickupLocation', 'postalCode', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10001"
              />
            </div>
          </div>
        </div>

        {/* Consignee Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📍</span> Consignee Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.consigneeName}
                onChange={(e) => updateField('consigneeName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.consigneeName ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Jane Smith"
              />
              {errors.consigneeName && <p className="text-red-500 text-xs mt-1">{errors.consigneeName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.consigneePhone}
                onChange={(e) => updateField('consigneePhone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.consigneeEmail}
                onChange={(e) => updateField('consigneeEmail', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          {/* Delivery Location */}
          <h3 className="text-md font-medium text-gray-800 mt-6 mb-3">Delivery Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                value={formData.deliveryLocation.address}
                onChange={(e) => updateLocation('deliveryLocation', 'address', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deliveryAddress ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="456 Oak Avenue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={formData.deliveryLocation.city}
                onChange={(e) => updateLocation('deliveryLocation', 'city', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.deliveryCity ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Los Angeles"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.deliveryLocation.state}
                onChange={(e) => updateLocation('deliveryLocation', 'state', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                value={formData.deliveryLocation.country}
                onChange={(e) => updateLocation('deliveryLocation', 'country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="USA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.deliveryLocation.postalCode}
                onChange={(e) => updateLocation('deliveryLocation', 'postalCode', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="90001"
              />
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🚚</span> Shipment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Name</label>
              <input
                type="text"
                value={formData.carrierName}
                onChange={(e) => updateField('carrierName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="FedEx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Phone</label>
              <input
                type="tel"
                value={formData.carrierPhone}
                onChange={(e) => updateField('carrierPhone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (800) 463-3339"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
              <input
                type="number"
                step="0.01"
                value={formData.dimensions.length || ''}
                onChange={(e) => updateDimension('length', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <input
                type="number"
                step="0.01"
                value={formData.dimensions.width || ''}
                onChange={(e) => updateDimension('width', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                step="0.01"
                value={formData.dimensions.height || ''}
                onChange={(e) => updateDimension('height', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
              <div className="flex">
                <select
                  value={formData.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                  className="px-3 py-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50"
                >
                  <option value="USD">$</option>
                  <option value="EUR">€</option>
                  <option value="GBP">£</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={(e) => updateField('rate', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
              <input
                type="date"
                value={formData.pickupDate}
                onChange={(e) => updateField('pickupDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
              <input
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e) => updateField('estimatedDelivery', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about the shipment..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/shipments"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Shipment' : 'Create Shipment'}
          </button>
        </div>
      </form>
    </div>
  );
}
