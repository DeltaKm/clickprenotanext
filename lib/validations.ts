import { z } from 'zod'
import { UserRole, AppointmentStatus, DiscountType } from '@prisma/client'

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  tenantSlug: z.string().min(3).max(30).regex(/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/),
  tenantName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

// ============================================
// SERVICE SCHEMAS
// ============================================

export const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(5).max(480), // 5 min to 8 hours
  price: z.number().min(0),
  currency: z.string().length(3).default('EUR'),
})

export const updateServiceSchema = createServiceSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ============================================
// STAFF SCHEMAS
// ============================================

export const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
})

export const updateStaffSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().optional(),
})

export const workingHoursSchema = z.object({
  staffId: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:mm format
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  breakStart: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  breakEnd: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
})

// ============================================
// CUSTOMER SCHEMAS
// ============================================

export const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

// ============================================
// APPOINTMENT SCHEMAS
// ============================================

export const createAppointmentSchema = z.object({
  customerId: z.string().optional(), // Optional if creating new customer inline
  customerEmail: z.string().email().optional(),
  customerName: z.string().min(2).max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  staffId: z.string(),
  serviceId: z.string(),
  startTime: z.string().datetime(),
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional(),
}).refine(
  (data) => data.customerId || (data.customerEmail && data.customerName),
  {
    message: 'Either customerId or customer details (email + name) must be provided',
  }
)

export const rescheduleAppointmentSchema = z.object({
  startTime: z.string().datetime(),
})

export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
})

// ============================================
// COUPON SCHEMAS
// ============================================

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().min(0),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  maxUses: z.number().int().min(1).optional(),
})

export const updateCouponSchema = createCouponSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ============================================
// TAX RULE SCHEMAS
// ============================================

export const createTaxRuleSchema = z.object({
  name: z.string().min(2).max(100),
  rate: z.number().min(0).max(100), // Percentage
})

export const updateTaxRuleSchema = createTaxRuleSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// ============================================
// QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})
