import gql from 'graphql-tag';

export const typeDefs = gql`
  # ============== SCALARS ==============
  scalar DateTime

  # ============== ENUMS ==============
  enum UserRole {
    ADMIN
    EMPLOYEE
  }

  enum ShipmentStatus {
    PENDING
    PICKED_UP
    IN_TRANSIT
    OUT_FOR_DELIVERY
    DELIVERED
    CANCELLED
    ON_HOLD
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum ShipmentSortField {
    CREATED_AT
    UPDATED_AT
    TRACKING_NUMBER
    STATUS
    SHIPPER_NAME
    CONSIGNEE_NAME
    PICKUP_DATE
    ESTIMATED_DELIVERY
    RATE
  }

  # ============== TYPES ==============
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: UserRole!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Location {
    id: ID!
    address: String!
    city: String!
    state: String
    country: String!
    postalCode: String
    latitude: Float
    longitude: Float
  }

  type Dimensions {
    id: ID!
    length: Float!
    width: Float!
    height: Float!
  }

  type TrackingEvent {
    id: ID!
    shipmentId: String!
    status: String!
    timestamp: DateTime!
    location: Location
    description: String
  }

  type Shipment {
    id: ID!
    trackingNumber: String!
    shipperName: String!
    shipperPhone: String
    shipperEmail: String
    consigneeName: String!
    consigneePhone: String
    consigneeEmail: String
    pickupLocation: Location!
    deliveryLocation: Location!
    carrierName: String
    carrierPhone: String
    weight: Float
    dimensions: Dimensions
    rate: Float
    currency: String
    status: ShipmentStatus!
    isFlagged: Boolean!
    flagReason: String
    pickupDate: DateTime
    estimatedDelivery: DateTime
    actualDelivery: DateTime
    notes: String
    trackingEvents: [TrackingEvent!]!
    createdBy: User
    updatedBy: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ============== PAGINATION ==============
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalPages: Int!
    totalCount: Int!
    currentPage: Int!
  }

  type ShipmentConnection {
    edges: [ShipmentEdge!]!
    pageInfo: PageInfo!
  }

  type ShipmentEdge {
    node: Shipment!
    cursor: String!
  }

  type ShipmentStats {
    total: Int!
    pending: Int!
    inTransit: Int!
    delivered: Int!
    cancelled: Int!
    averageRate: Float!
  }

  # ============== INPUTS ==============
  input ShipmentFilterInput {
    status: [ShipmentStatus!]
    carrierName: String
    dateRange: DateRangeInput
    rateRange: RateRangeInput
    isFlagged: Boolean
    searchTerm: String
  }

  input DateRangeInput {
    from: DateTime
    to: DateTime
  }

  input RateRangeInput {
    min: Float
    max: Float
  }

  input SortInput {
    field: ShipmentSortField!
    order: SortOrder!
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
    cursor: String
  }

  input LocationInput {
    address: String!
    city: String!
    state: String
    country: String!
    postalCode: String
    latitude: Float
    longitude: Float
  }

  input DimensionsInput {
    length: Float!
    width: Float!
    height: Float!
  }

  input CreateShipmentInput {
    trackingNumber: String
    shipperName: String!
    shipperPhone: String
    shipperEmail: String
    consigneeName: String!
    consigneePhone: String
    consigneeEmail: String
    pickupLocation: LocationInput!
    deliveryLocation: LocationInput!
    carrierName: String
    carrierPhone: String
    weight: Float
    dimensions: DimensionsInput
    rate: Float
    currency: String
    pickupDate: DateTime
    estimatedDelivery: DateTime
    notes: String
  }

  input UpdateShipmentInput {
    shipperName: String
    shipperPhone: String
    shipperEmail: String
    consigneeName: String
    consigneePhone: String
    consigneeEmail: String
    pickupLocation: LocationInput
    deliveryLocation: LocationInput
    carrierName: String
    carrierPhone: String
    weight: Float
    dimensions: DimensionsInput
    rate: Float
    currency: String
    status: ShipmentStatus
    pickupDate: DateTime
    estimatedDelivery: DateTime
    actualDelivery: DateTime
    notes: String
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  # ============== AUTH TYPES ==============
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  # ============== QUERIES ==============
  type Query {
    # Shipments
    shipments(
      filter: ShipmentFilterInput
      sort: SortInput
      pagination: PaginationInput
    ): ShipmentConnection!
    
    shipment(id: ID!): Shipment
    
    shipmentByTrackingNumber(trackingNumber: String!): Shipment
    
    shipmentStats: ShipmentStats!

    # Users
    me: User
    
    users: [User!]!
    
    user(id: ID!): User
  }

  # ============== MUTATIONS ==============
  type Mutation {
    # Shipments
    createShipment(input: CreateShipmentInput!): Shipment!
    
    updateShipment(id: ID!, input: UpdateShipmentInput!): Shipment!
    
    deleteShipment(id: ID!): Boolean!
    
    updateShipmentStatus(id: ID!, status: ShipmentStatus!): Shipment!
    
    flagShipment(id: ID!, reason: String!): Shipment!
    
    unflagShipment(id: ID!): Shipment!

    # Auth
    register(input: RegisterInput!): AuthPayload!
    
    login(input: LoginInput!): AuthPayload!
    
    logout: Boolean!
    
    refreshToken(token: String!): AuthPayload!
  }
`;
