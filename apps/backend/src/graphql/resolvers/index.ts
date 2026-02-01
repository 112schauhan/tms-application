import { GraphQLContext } from '../../types/context.js';
import { GraphQLError } from 'graphql';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ShipmentStatus as PrismaShipmentStatus } from '@prisma/client';
import { env } from '../../config/environment.js';

// Helper to generate tracking number
function generateTrackingNumber(): string {
  const prefix = 'TMS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Helper to check authentication
function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('You must be logged in to perform this action', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check admin role
function requireAdmin(context: GraphQLContext) {
  const user = requireAuth(context);
  if (user.role !== 'ADMIN') {
    throw new GraphQLError('You must be an admin to perform this action', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

export const resolvers = {
  // Custom scalar for DateTime
  DateTime: {
    __serialize(value: Date | string): string {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return new Date(value).toISOString();
    },
    __parseValue(value: string): Date {
      return new Date(value);
    },
    __parseLiteral(ast: any): Date | null {
      if (ast.kind === 'StringValue') {
        return new Date(ast.value);
      }
      return null;
    },
  },

  Query: {
    // Get shipments with filtering, sorting, and pagination
    shipments: async (
      _: unknown,
      args: {
        filter?: {
          status?: string[];
          carrierName?: string;
          dateRange?: { from?: string; to?: string };
          rateRange?: { min?: number; max?: number };
          isFlagged?: boolean;
          searchTerm?: string;
        };
        sort?: { field: string; order: 'ASC' | 'DESC' };
        pagination?: { page?: number; limit?: number };
      },
      context: GraphQLContext
    ) => {
      requireAuth(context);

      const { filter, sort, pagination } = args;
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 10, 100);
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filter?.status?.length) {
        where.status = { in: filter.status };
      }

      if (filter?.carrierName) {
        where.carrierName = { contains: filter.carrierName, mode: 'insensitive' };
      }

      if (filter?.isFlagged !== undefined) {
        where.isFlagged = filter.isFlagged;
      }

      if (filter?.dateRange) {
        where.createdAt = {};
        if (filter.dateRange.from) {
          where.createdAt.gte = new Date(filter.dateRange.from);
        }
        if (filter.dateRange.to) {
          where.createdAt.lte = new Date(filter.dateRange.to);
        }
      }

      if (filter?.rateRange) {
        where.rate = {};
        if (filter.rateRange.min !== undefined) {
          where.rate.gte = filter.rateRange.min;
        }
        if (filter.rateRange.max !== undefined) {
          where.rate.lte = filter.rateRange.max;
        }
      }

      if (filter?.searchTerm) {
        where.OR = [
          { trackingNumber: { contains: filter.searchTerm, mode: 'insensitive' } },
          { shipperName: { contains: filter.searchTerm, mode: 'insensitive' } },
          { consigneeName: { contains: filter.searchTerm, mode: 'insensitive' } },
          { carrierName: { contains: filter.searchTerm, mode: 'insensitive' } },
        ];
      }

      // Build order by
      const orderBy: any = {};
      if (sort?.field) {
        const fieldMap: Record<string, string> = {
          CREATED_AT: 'createdAt',
          UPDATED_AT: 'updatedAt',
          TRACKING_NUMBER: 'trackingNumber',
          STATUS: 'status',
          SHIPPER_NAME: 'shipperName',
          CONSIGNEE_NAME: 'consigneeName',
          PICKUP_DATE: 'pickupDate',
          ESTIMATED_DELIVERY: 'estimatedDelivery',
          RATE: 'rate',
        };
        const field = fieldMap[sort.field] || 'createdAt';
        orderBy[field] = sort.order?.toLowerCase() || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Execute queries - exclude createdBy, pickupLocation, deliveryLocation to use DataLoader (N+1 optimization)
      const [shipments, totalCount] = await Promise.all([
        context.prisma.shipment.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            dimensions: true,
            trackingEvents: {
              include: { location: true },
              orderBy: { timestamp: 'desc' },
            },
          },
        }),
        context.prisma.shipment.count({ where }),
      ]);

      // Load relations via DataLoader (batches N loads into 1 query per type)
      const pickupIds = [...new Set(shipments.map((s) => s.pickupLocationId))];
      const deliveryIds = [...new Set(shipments.map((s) => s.deliveryLocationId))];
      const createdByIds = [...new Set(shipments.map((s) => s.createdById))];
      const updatedByIds = [...new Set(shipments.map((s) => s.updatedById))];

      await Promise.all([
        ...pickupIds.map((id) => context.locationLoader.load(id)),
        ...deliveryIds.map((id) => context.locationLoader.load(id)),
        ...createdByIds.map((id) => context.userLoader.load(id)),
        ...updatedByIds.map((id) => context.userLoader.load(id)),
      ]);

      // Attach relations for response (DataLoader cached)
      const withRelations = shipments.map((s) => ({
        ...s,
        pickupLocation: context.locationLoader.load(s.pickupLocationId),
        deliveryLocation: context.locationLoader.load(s.deliveryLocationId),
        createdBy: context.userLoader.load(s.createdById),
        updatedBy: context.userLoader.load(s.updatedById),
      }));

      const shipmentsWithData = await Promise.all(
        withRelations.map(async (s) => ({
          ...s,
          pickupLocation: await s.pickupLocation,
          deliveryLocation: await s.deliveryLocation,
          createdBy: await s.createdBy,
          updatedBy: await s.updatedBy,
        }))
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        edges: shipmentsWithData.map((shipment) => ({
          node: shipment,
          cursor: Buffer.from(shipment.id).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          totalPages,
          totalCount,
          currentPage: page,
        },
      };
    },

    // Get single shipment by ID
    shipment: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAuth(context);

      const shipment = await context.prisma.shipment.findUnique({
        where: { id },
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: {
            include: { location: true },
            orderBy: { timestamp: 'desc' },
          },
          createdBy: true,
          updatedBy: true,
        },
      });

      return shipment;
    },

    // Get shipment by tracking number
    shipmentByTrackingNumber: async (
      _: unknown,
      { trackingNumber }: { trackingNumber: string },
      context: GraphQLContext
    ) => {
      // This can be public for tracking purposes
      const shipment = await context.prisma.shipment.findUnique({
        where: { trackingNumber },
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: {
            include: { location: true },
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      return shipment;
    },

    // Get shipment statistics (single source of truth for counts)
    // Uses groupBy to avoid querying enum values that may not exist in the DB yet
    shipmentStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAuth(context);

      const [total, statusCounts, avgRate] = await Promise.all([
        context.prisma.shipment.count(),
        context.prisma.shipment.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        context.prisma.shipment.aggregate({ _avg: { rate: true } }),
      ]);

      const byStatus = Object.fromEntries(
        statusCounts.map((r) => [r.status, r._count.status])
      );
      const get = (s: string) => byStatus[s] ?? 0;

      return {
        total,
        pending: get('PENDING'),
        pickedUp: get('PICKED_UP'),
        inTransit: get('IN_TRANSIT'),
        outForDelivery: get('OUT_FOR_DELIVERY'),
        delivered: get('DELIVERED'),
        cancelled: get('CANCELLED'),
        onHold: get('ON_HOLD'),
        averageRate: avgRate._avg.rate || 0,
      };
    },

    // Get current user
    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      if (!context.user) return null;

      return context.prisma.user.findUnique({
        where: { id: context.user.id },
      });
    },

    // Get all users (admin only)
    users: async (_: unknown, __: unknown, context: GraphQLContext) => {
      requireAdmin(context);

      return context.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },

    // Get single user
    user: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);

      return context.prisma.user.findUnique({
        where: { id },
      });
    },
  },

  Mutation: {
    // Create new shipment
    createShipment: async (
      _: unknown,
      { input }: { input: any },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      // Create pickup location
      const pickupLocation = await context.prisma.location.create({
        data: input.pickupLocation,
      });

      // Create delivery location
      const deliveryLocation = await context.prisma.location.create({
        data: input.deliveryLocation,
      });

      // Create dimensions if provided
      let dimensionsId = null;
      if (input.dimensions) {
        const dimensions = await context.prisma.dimensions.create({
          data: input.dimensions,
        });
        dimensionsId = dimensions.id;
      }

      // Create shipment
      const shipment = await context.prisma.shipment.create({
        data: {
          trackingNumber: input.trackingNumber || generateTrackingNumber(),
          shipperName: input.shipperName,
          shipperPhone: input.shipperPhone,
          shipperEmail: input.shipperEmail,
          consigneeName: input.consigneeName,
          consigneePhone: input.consigneePhone,
          consigneeEmail: input.consigneeEmail,
          pickupLocationId: pickupLocation.id,
          deliveryLocationId: deliveryLocation.id,
          carrierName: input.carrierName || 'TBD',
          carrierPhone: input.carrierPhone,
          weight: input.weight,
          dimensionsId,
          rate: input.rate ?? 0,
          currency: input.currency || 'USD',
          status: 'PENDING',
          pickupDate: input.pickupDate ? new Date(input.pickupDate) : null,
          estimatedDelivery: input.estimatedDelivery ? new Date(input.estimatedDelivery) : null,
          notes: input.notes,
          createdById: user.id,
          updatedById: user.id,
        },
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: true,
          createdBy: true,
          updatedBy: true,
        },
      });

      // Create initial tracking event
      await context.prisma.trackingEvent.create({
        data: {
          shipmentId: shipment.id,
          status: 'Shipment Created',
          timestamp: new Date(),
          locationId: pickupLocation.id,
          description: 'Shipment has been created and is pending pickup',
        },
      });

      return shipment;
    },

    // Update shipment
    updateShipment: async (
      _: unknown,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      const existingShipment = await context.prisma.shipment.findUnique({
        where: { id },
        include: { createdBy: true },
      });

      if (!existingShipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Check permissions (admin can edit all, employees only their own)
      if (user.role !== 'ADMIN' && existingShipment.createdById !== user.id) {
        throw new GraphQLError('You do not have permission to edit this shipment', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Update locations if provided
      if (input.pickupLocation) {
        await context.prisma.location.update({
          where: { id: existingShipment.pickupLocationId },
          data: input.pickupLocation,
        });
      }

      if (input.deliveryLocation) {
        await context.prisma.location.update({
          where: { id: existingShipment.deliveryLocationId },
          data: input.deliveryLocation,
        });
      }

      // Update dimensions if provided
      if (input.dimensions) {
        if (existingShipment.dimensionsId) {
          await context.prisma.dimensions.update({
            where: { id: existingShipment.dimensionsId },
            data: input.dimensions,
          });
        } else {
          const dimensions = await context.prisma.dimensions.create({
            data: input.dimensions,
          });
          input.dimensionsId = dimensions.id;
        }
      }

      // Build update data
      const updateData: any = {
        updatedById: user.id,
      };

      const directFields = [
        'shipperName', 'shipperPhone', 'shipperEmail',
        'consigneeName', 'consigneePhone', 'consigneeEmail',
        'carrierName', 'carrierPhone', 'weight', 'rate',
        'currency', 'status', 'notes',
      ];

      for (const field of directFields) {
        if (input[field] !== undefined) {
          updateData[field] = input[field];
        }
      }

      // Handle dates
      if (input.pickupDate !== undefined) {
        updateData.pickupDate = input.pickupDate ? new Date(input.pickupDate) : null;
      }
      if (input.estimatedDelivery !== undefined) {
        updateData.estimatedDelivery = input.estimatedDelivery ? new Date(input.estimatedDelivery) : null;
      }
      if (input.actualDelivery !== undefined) {
        updateData.actualDelivery = input.actualDelivery ? new Date(input.actualDelivery) : null;
      }

      // Update shipment
      const shipment = await context.prisma.shipment.update({
        where: { id },
        data: updateData,
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: {
            include: { location: true },
            orderBy: { timestamp: 'desc' },
          },
          createdBy: true,
          updatedBy: true,
        },
      });

      return shipment;
    },

    // Delete shipment (admin only)
    deleteShipment: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);

      const shipment = await context.prisma.shipment.findUnique({
        where: { id },
      });

      if (!shipment) {
        throw new GraphQLError('Shipment not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Delete related tracking events first
      await context.prisma.trackingEvent.deleteMany({
        where: { shipmentId: id },
      });

      // Delete shipment
      await context.prisma.shipment.delete({
        where: { id },
      });

      return true;
    },

    // Update shipment status
    updateShipmentStatus: async (
      _: unknown,
      { id, status }: { id: string; status: string },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      const shipment = await context.prisma.shipment.update({
        where: { id },
        data: {
          status: status as PrismaShipmentStatus,
          updatedById: user.id,
          actualDelivery: status === 'DELIVERED' ? new Date() : undefined,
        },
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: {
            include: { location: true },
            orderBy: { timestamp: 'desc' },
          },
          createdBy: true,
          updatedBy: true,
        },
      });

      // Add tracking event for status change
      await context.prisma.trackingEvent.create({
        data: {
          shipmentId: id,
          status: status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
          timestamp: new Date(),
          locationId: shipment.deliveryLocationId,
          description: `Status updated to ${status}`,
        },
      });

      return shipment;
    },

    // Flag shipment
    flagShipment: async (
      _: unknown,
      { id, reason }: { id: string; reason: string },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      return context.prisma.shipment.update({
        where: { id },
        data: {
          isFlagged: true,
          flagReason: reason,
          updatedById: user.id,
        },
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: {
            include: { location: true },
            orderBy: { timestamp: 'desc' },
          },
          createdBy: true,
          updatedBy: true,
        },
      });
    },

    // Unflag shipment
    unflagShipment: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const user = requireAuth(context);

      return context.prisma.shipment.update({
        where: { id },
        data: {
          isFlagged: false,
          flagReason: null,
          updatedById: user.id,
        },
        include: {
          pickupLocation: true,
          deliveryLocation: true,
          dimensions: true,
          trackingEvents: {
            include: { location: true },
            orderBy: { timestamp: 'desc' },
          },
          createdBy: true,
          updatedBy: true,
        },
      });
    },

    // Register new user
    register: async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
      const { email, password, firstName, lastName } = input;

      // Check if user exists
      const existingUser = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await context.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'EMPLOYEE', // Default role
          isActive: true,
        },
      });

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        env.jwtSecret,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        env.refreshTokenSecret,
        { expiresIn: '7d' }
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };
    },

    // Login
    login: async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
      try {
        const { email, password } = input;

        const user = await context.prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        if (!user.isActive) {
          throw new GraphQLError('Your account has been deactivated', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.jwtSecret,
          { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
          { userId: user.id },
          env.refreshTokenSecret,
          { expiresIn: '7d' }
        );

        return {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        };
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        console.error('Login error:', error);
        throw new GraphQLError('Authentication failed. Please check database connection.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    // Logout
    logout: async () => {
      // In a real app, you might want to blacklist the token
      return true;
    },

    // Refresh token
    refreshToken: async (
      _: unknown,
      { token }: { token: string },
      context: GraphQLContext
    ) => {
      try {
        const decoded = jwt.verify(
          token,
          env.refreshTokenSecret
        ) as { userId: string };

        const user = await context.prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user || !user.isActive) {
          throw new GraphQLError('Invalid refresh token', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        // Generate new tokens
        const accessToken = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          env.jwtSecret,
          { expiresIn: '15m' }
        );

        const newRefreshToken = jwt.sign(
          { userId: user.id },
          env.refreshTokenSecret,
          { expiresIn: '7d' }
        );

        return {
          accessToken,
          refreshToken: newRefreshToken,
          user,
        };
      } catch (error) {
        throw new GraphQLError('Invalid refresh token', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
    },

    // Create user (admin only)
    createUser: async (_: unknown, { input }: { input: any }, context: GraphQLContext) => {
      requireAdmin(context);

      const { email, password, firstName, lastName, role = 'EMPLOYEE' } = input;

      const existingUser = await context.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new GraphQLError('User with this email already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      return context.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role as 'ADMIN' | 'EMPLOYEE',
          isActive: true,
        },
      });
    },

    // Update user (admin only)
    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: any },
      context: GraphQLContext
    ) => {
      requireAdmin(context);

      const existingUser = await context.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const updateData: any = {};
      if (input.firstName !== undefined) updateData.firstName = input.firstName;
      if (input.lastName !== undefined) updateData.lastName = input.lastName;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      return context.prisma.user.update({
        where: { id },
        data: updateData,
      });
    },

    // Delete user (admin only)
    deleteUser: async (_: unknown, { id }: { id: string }, context: GraphQLContext) => {
      const admin = requireAdmin(context);

      if (id === admin.id) {
        throw new GraphQLError('You cannot delete your own account', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const existingUser = await context.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.user.delete({
        where: { id },
      });

      return true;
    },
  },
};
