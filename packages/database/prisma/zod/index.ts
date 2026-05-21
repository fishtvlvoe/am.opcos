import { Prisma } from "../generated/client";
/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'displayUsername', 'twoFactorEnabled', 'lastActiveOrganizationId', 'anismileTier', 'anismileTierUpdatedAt'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'verified', 'userId'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: LicenseScalarFieldEnum.schema.ts

export const LicenseScalarFieldEnumSchema = z.enum(['id', 'key', 'productId', 'planId', 'organizationId', 'status', 'maxDevices', 'createdAt', 'updatedAt'])

export type LicenseScalarFieldEnum = z.infer<typeof LicenseScalarFieldEnumSchema>;

// File: DeviceActivationScalarFieldEnum.schema.ts

export const DeviceActivationScalarFieldEnumSchema = z.enum(['id', 'licenseId', 'deviceFingerprint', 'deviceName', 'allowedIp', 'activatedAt', 'deactivatedAt', 'lastVerifiedAt', 'createdAt', 'updatedAt'])

export type DeviceActivationScalarFieldEnum = z.infer<typeof DeviceActivationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'priceId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'data', 'link', 'read', 'createdAt', 'updatedAt'])

export type NotificationScalarFieldEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: UserNotificationPreferenceScalarFieldEnum.schema.ts

export const UserNotificationPreferenceScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'target', 'createdAt'])

export type UserNotificationPreferenceScalarFieldEnum = z.infer<typeof UserNotificationPreferenceScalarFieldEnumSchema>;

// File: AnismileProductScalarFieldEnum.schema.ts

export const AnismileProductScalarFieldEnumSchema = z.enum(['id', 'supplierId', 'titleOriginal', 'titleTranslated', 'descriptionOriginal', 'descriptionTranslated', 'imageUrls', 'category', 'series', 'janCode', 'brand', 'franchise', 'discountRate', 'saleStatus', 'boxSpec', 'releaseDate', 'originalPrice', 'costPrice', 'markupOverride', 'sellingPrice', 'priceManualOverride', 'listingDate', 'orderDeadline', 'inStock', 'stockQuantity', 'lastSyncedAt', 'createdAt', 'updatedAt'])

export type AnismileProductScalarFieldEnum = z.infer<typeof AnismileProductScalarFieldEnumSchema>;

// File: AnismileCartItemScalarFieldEnum.schema.ts

export const AnismileCartItemScalarFieldEnumSchema = z.enum(['id', 'userId', 'productId', 'quantity', 'createdAt'])

export type AnismileCartItemScalarFieldEnum = z.infer<typeof AnismileCartItemScalarFieldEnumSchema>;

// File: AnismileWishlistItemScalarFieldEnum.schema.ts

export const AnismileWishlistItemScalarFieldEnumSchema = z.enum(['id', 'userId', 'productId', 'quantity', 'createdAt'])

export type AnismileWishlistItemScalarFieldEnum = z.infer<typeof AnismileWishlistItemScalarFieldEnumSchema>;

// File: AnismileOrderScalarFieldEnum.schema.ts

export const AnismileOrderScalarFieldEnumSchema = z.enum(['id', 'userId', 'status', 'totalAmount', 'shippingName', 'shippingPhone', 'shippingAddress', 'notes', 'createdAt', 'updatedAt'])

export type AnismileOrderScalarFieldEnum = z.infer<typeof AnismileOrderScalarFieldEnumSchema>;

// File: AnismileOrderItemScalarFieldEnum.schema.ts

export const AnismileOrderItemScalarFieldEnumSchema = z.enum(['id', 'orderId', 'productId', 'quantity', 'unitPrice', 'costPrice', 'itemStatus', 'tierDiscountRate', 'createdAt'])

export type AnismileOrderItemScalarFieldEnum = z.infer<typeof AnismileOrderItemScalarFieldEnumSchema>;

// File: AnismileSyncLogScalarFieldEnum.schema.ts

export const AnismileSyncLogScalarFieldEnumSchema = z.enum(['id', 'startedAt', 'finishedAt', 'status', 'productsSynced', 'productsAdded', 'productsUpdated', 'errorMessage'])

export type AnismileSyncLogScalarFieldEnum = z.infer<typeof AnismileSyncLogScalarFieldEnumSchema>;

// File: AnismileSettingScalarFieldEnum.schema.ts

export const AnismileSettingScalarFieldEnumSchema = z.enum(['key', 'value', 'updatedAt'])

export type AnismileSettingScalarFieldEnum = z.infer<typeof AnismileSettingScalarFieldEnumSchema>;

// File: AnismileAddressScalarFieldEnum.schema.ts

export const AnismileAddressScalarFieldEnumSchema = z.enum(['id', 'userId', 'label', 'name', 'phone', 'address', 'idNumber', 'lineId', 'isDefault', 'createdAt', 'updatedAt'])

export type AnismileAddressScalarFieldEnum = z.infer<typeof AnismileAddressScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: LicenseStatus.schema.ts

export const LicenseStatusSchema = z.enum(['ACTIVE', 'REVOKED', 'EXPIRED'])

export type LicenseStatus = z.infer<typeof LicenseStatusSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: NotificationType.schema.ts

export const NotificationTypeSchema = z.enum(['WELCOME', 'APP_UPDATE'])

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// File: NotificationTarget.schema.ts

export const NotificationTargetSchema = z.enum(['IN_APP', 'EMAIL'])

export type NotificationTarget = z.infer<typeof NotificationTargetSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  displayUsername: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
  lastActiveOrganizationId: z.string().nullish(),
  anismileTier: z.string().default("NORMAL").nullish(),
  anismileTierUpdatedAt: z.date().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  verified: z.boolean(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: License.schema.ts

export const LicenseSchema = z.object({
  id: z.string(),
  key: z.string(),
  productId: z.string().default("aire"),
  planId: z.string().default("vip"),
  organizationId: z.string(),
  status: LicenseStatusSchema.default("ACTIVE"),
  maxDevices: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LicenseType = z.infer<typeof LicenseSchema>;


// File: DeviceActivation.schema.ts

export const DeviceActivationSchema = z.object({
  id: z.string(),
  licenseId: z.string(),
  deviceFingerprint: z.string(),
  deviceName: z.string(),
  allowedIp: z.string(),
  activatedAt: z.date(),
  deactivatedAt: z.date().nullish(),
  lastVerifiedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DeviceActivationType = z.infer<typeof DeviceActivationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
  createdAt: z.date(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  priceId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: Notification.schema.ts

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  link: z.string().nullish(),
  read: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationModel = z.infer<typeof NotificationSchema>;

// File: UserNotificationPreference.schema.ts

export const UserNotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  target: NotificationTargetSchema,
  createdAt: z.date(),
});

export type UserNotificationPreferenceType = z.infer<typeof UserNotificationPreferenceSchema>;


// File: AnismileProduct.schema.ts

export const AnismileProductSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  titleOriginal: z.string(),
  titleTranslated: z.string(),
  descriptionOriginal: z.string().nullish(),
  descriptionTranslated: z.string().nullish(),
  imageUrls: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  category: z.string().nullish(),
  series: z.string().nullish(),
  janCode: z.string().nullish(),
  brand: z.string().nullish(),
  franchise: z.string().nullish(),
  discountRate: z.instanceof(Prisma.Decimal, {
  message: "Field 'discountRate' must be a Decimal. Location: ['Models', 'AnismileProduct']",
}).nullish(),
  saleStatus: z.string().nullish(),
  boxSpec: z.string().nullish(),
  releaseDate: z.date().nullish(),
  originalPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'originalPrice' must be a Decimal. Location: ['Models', 'AnismileProduct']",
}).nullish(),
  costPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'costPrice' must be a Decimal. Location: ['Models', 'AnismileProduct']",
}),
  markupOverride: z.instanceof(Prisma.Decimal, {
  message: "Field 'markupOverride' must be a Decimal. Location: ['Models', 'AnismileProduct']",
}).nullish(),
  sellingPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'sellingPrice' must be a Decimal. Location: ['Models', 'AnismileProduct']",
}),
  priceManualOverride: z.boolean(),
  listingDate: z.date().nullish(),
  orderDeadline: z.date().nullish(),
  inStock: z.boolean().default(true),
  stockQuantity: z.number().int().nullish(),
  lastSyncedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AnismileProductType = z.infer<typeof AnismileProductSchema>;


// File: AnismileCartItem.schema.ts

export const AnismileCartItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  quantity: z.number().int().default(1),
  createdAt: z.date(),
});

export type AnismileCartItemType = z.infer<typeof AnismileCartItemSchema>;


// File: AnismileWishlistItem.schema.ts

export const AnismileWishlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  createdAt: z.date(),
});

export type AnismileWishlistItemType = z.infer<typeof AnismileWishlistItemSchema>;


// File: AnismileOrder.schema.ts

export const AnismileOrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string().default("pending"),
  totalAmount: z.instanceof(Prisma.Decimal, {
  message: "Field 'totalAmount' must be a Decimal. Location: ['Models', 'AnismileOrder']",
}),
  shippingName: z.string(),
  shippingPhone: z.string(),
  shippingAddress: z.string(),
  notes: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AnismileOrderType = z.infer<typeof AnismileOrderSchema>;


// File: AnismileOrderItem.schema.ts

export const AnismileOrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  quantity: z.number().int(),
  unitPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'unitPrice' must be a Decimal. Location: ['Models', 'AnismileOrderItem']",
}),
  costPrice: z.instanceof(Prisma.Decimal, {
  message: "Field 'costPrice' must be a Decimal. Location: ['Models', 'AnismileOrderItem']",
}),
  itemStatus: z.string().default("pending"),
  tierDiscountRate: z.instanceof(Prisma.Decimal, {
  message: "Field 'tierDiscountRate' must be a Decimal. Location: ['Models', 'AnismileOrderItem']",
}).nullish(),
  createdAt: z.date(),
});

export type AnismileOrderItemType = z.infer<typeof AnismileOrderItemSchema>;


// File: AnismileSyncLog.schema.ts

export const AnismileSyncLogSchema = z.object({
  id: z.string(),
  startedAt: z.date(),
  finishedAt: z.date().nullish(),
  status: z.string().default("running"),
  productsSynced: z.number().int(),
  productsAdded: z.number().int(),
  productsUpdated: z.number().int(),
  errorMessage: z.string().nullish(),
});

export type AnismileSyncLogType = z.infer<typeof AnismileSyncLogSchema>;


// File: AnismileSetting.schema.ts

export const AnismileSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  updatedAt: z.date(),
});

export type AnismileSettingType = z.infer<typeof AnismileSettingSchema>;


// File: AnismileAddress.schema.ts

export const AnismileAddressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  label: z.string().nullish(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  idNumber: z.string().nullish(),
  lineId: z.string().nullish(),
  isDefault: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AnismileAddressType = z.infer<typeof AnismileAddressSchema>;

