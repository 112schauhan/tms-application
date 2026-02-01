import { gql } from '@apollo/client';

// Fragments
export const SHIPMENT_FRAGMENT = gql`
  fragment ShipmentFragment on Shipment {
    id
    trackingNumber
    shipperName
    shipperPhone
    shipperEmail
    consigneeName
    consigneePhone
    consigneeEmail
    pickupLocation {
      id
      address
      city
      state
      country
      postalCode
    }
    deliveryLocation {
      id
      address
      city
      state
      country
      postalCode
    }
    carrierName
    carrierPhone
    weight
    dimensions {
      id
      length
      width
      height
    }
    rate
    currency
    status
    isFlagged
    flagReason
    pickupDate
    estimatedDelivery
    actualDelivery
    notes
    trackingEvents {
      id
      status
      timestamp
      description
      location {
        city
        state
        country
      }
    }
    createdBy {
      id
      firstName
      lastName
    }
    createdAt
    updatedAt
  }
`;

export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    email
    firstName
    lastName
    role
    isActive
    createdAt
  }
`;

// Queries
export const GET_SHIPMENTS = gql`
  ${SHIPMENT_FRAGMENT}
  query GetShipments(
    $filter: ShipmentFilterInput
    $sort: SortInput
    $pagination: PaginationInput
  ) {
    shipments(filter: $filter, sort: $sort, pagination: $pagination) {
      edges {
        node {
          ...ShipmentFragment
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        totalPages
        totalCount
        currentPage
      }
    }
  }
`;

export const GET_SHIPMENT = gql`
  ${SHIPMENT_FRAGMENT}
  query GetShipment($id: ID!) {
    shipment(id: $id) {
      ...ShipmentFragment
    }
  }
`;

export const GET_SHIPMENT_BY_TRACKING = gql`
  ${SHIPMENT_FRAGMENT}
  query GetShipmentByTracking($trackingNumber: String!) {
    shipmentByTrackingNumber(trackingNumber: $trackingNumber) {
      ...ShipmentFragment
    }
  }
`;

export const GET_SHIPMENT_STATS = gql`
  query GetShipmentStats {
    shipmentStats {
      total
      pending
      pickedUp
      inTransit
      outForDelivery
      delivered
      cancelled
      onHold
      averageRate
    }
  }
`;

export const GET_ME = gql`
  ${USER_FRAGMENT}
  query GetMe {
    me {
      ...UserFragment
    }
  }
`;

export const GET_USERS = gql`
  ${USER_FRAGMENT}
  query GetUsers {
    users {
      ...UserFragment
    }
  }
`;

export const GET_USER = gql`
  ${USER_FRAGMENT}
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserFragment
    }
  }
`;

// Mutations
export const LOGIN = gql`
  ${USER_FRAGMENT}
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFragment
      }
    }
  }
`;

export const REGISTER = gql`
  ${USER_FRAGMENT}
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        ...UserFragment
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH_TOKEN = gql`
  ${USER_FRAGMENT}
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
      user {
        ...UserFragment
      }
    }
  }
`;

export const CREATE_SHIPMENT = gql`
  ${SHIPMENT_FRAGMENT}
  mutation CreateShipment($input: CreateShipmentInput!) {
    createShipment(input: $input) {
      ...ShipmentFragment
    }
  }
`;

export const UPDATE_SHIPMENT = gql`
  ${SHIPMENT_FRAGMENT}
  mutation UpdateShipment($id: ID!, $input: UpdateShipmentInput!) {
    updateShipment(id: $id, input: $input) {
      ...ShipmentFragment
    }
  }
`;

export const DELETE_SHIPMENT = gql`
  mutation DeleteShipment($id: ID!) {
    deleteShipment(id: $id)
  }
`;

export const UPDATE_SHIPMENT_STATUS = gql`
  ${SHIPMENT_FRAGMENT}
  mutation UpdateShipmentStatus($id: ID!, $status: ShipmentStatus!) {
    updateShipmentStatus(id: $id, status: $status) {
      ...ShipmentFragment
    }
  }
`;

export const FLAG_SHIPMENT = gql`
  ${SHIPMENT_FRAGMENT}
  mutation FlagShipment($id: ID!, $reason: String!) {
    flagShipment(id: $id, reason: $reason) {
      ...ShipmentFragment
    }
  }
`;

export const UNFLAG_SHIPMENT = gql`
  ${SHIPMENT_FRAGMENT}
  mutation UnflagShipment($id: ID!) {
    unflagShipment(id: $id) {
      ...ShipmentFragment
    }
  }
`;

export const CREATE_USER = gql`
  ${USER_FRAGMENT}
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserFragment
    }
  }
`;

export const UPDATE_USER = gql`
  ${USER_FRAGMENT}
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      ...UserFragment
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;
