import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('herway-api'),
  version: z.string()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1).max(80),
    message: z.string().max(500).optional(),
    requestId: z.string().max(128).optional()
  })
});

export const PublicConfigSchema = z.object({
  appMode: z.enum(['demo', 'live']),
  liveDispatchEnabled: z.boolean(),
  womenOnlyDefault: z.literal(true),
  pilotZones: z.array(z.string()),
  firebase: z
    .object({
      projectId: z.string(),
      authDomain: z.string(),
      webApiKey: z.string(),
      appId: z.string()
    })
    .optional()
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;

export const FareEstimateRequestSchema = z.object({
  pickup: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  dropoff: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  rideCategory: z.enum(['standard', 'premium', 'accessible'])
});

export type FareEstimateRequest = z.infer<typeof FareEstimateRequestSchema>;

export const FareEstimateResponseSchema = z.object({
  amountMin: z.number().nonnegative(),
  amountMax: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
  ratePerKm: z.literal(11),
  currency: z.literal('INR'),
  validitySeconds: z.number().int().positive(),
  explanation: z.string()
});

export type FareEstimateResponse = z.infer<typeof FareEstimateResponseSchema>;

export const ScheduledRideRequestSchema = z.object({
  pickup: z.string().trim().min(5).max(240),
  dropoff: z.string().trim().min(5).max(240),
  rideCategory: z.enum(['standard', 'premium', 'accessible']),
  scheduledAt: z.string().datetime({ offset: true }),
  locationUseConsent: z.literal(true),
  womenCaptainOnly: z.literal(true).default(true)
}).strict();
export type ScheduledRideRequest = z.infer<typeof ScheduledRideRequestSchema>;

export const ScheduledRideResponseSchema = z.object({
  requestId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  status: z.literal('AWAITING_OPERATOR_CONFIRMATION'),
  bookingConfirmed: z.literal(false),
  estimatedFareInr: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
  ratePerKm: z.literal(11),
  womenCaptainOnly: z.literal(true),
  message: z.string().min(1)
});
export type ScheduledRideResponse = z.infer<typeof ScheduledRideResponseSchema>;

export const ScheduledRideSummarySchema = z.object({
  requestId: z.string().min(1),
  pickup: z.string().trim().min(5).max(240),
  dropoff: z.string().trim().min(5).max(240),
  scheduledAt: z.string().datetime(),
  status: z.enum(['AWAITING_OPERATOR_CONFIRMATION', 'CANCELLED']),
  bookingConfirmed: z.literal(false),
  estimatedFareInr: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
  ratePerKm: z.literal(11),
  womenCaptainOnly: z.literal(true)
});

export const ScheduledRideListResponseSchema = z.object({
  requests: z.array(ScheduledRideSummarySchema).max(20)
});
export type ScheduledRideListResponse = z.infer<typeof ScheduledRideListResponseSchema>;

export const ScheduledRideCancellationResponseSchema = z.object({
  requestId: z.string().min(1),
  status: z.literal('CANCELLED'),
  bookingConfirmed: z.literal(false)
});

export const FirebaseAuthVerifyRequestSchema = z.object({
  idToken: z.string().min(20).max(4096)
}).strict();
export type FirebaseAuthVerifyRequest = z.infer<typeof FirebaseAuthVerifyRequestSchema>;

export const FirebaseAuthVerifyResponseSchema = z.object({
  firebaseUid: z.string().min(1),
  phoneVerified: z.boolean(),
  emailVerified: z.boolean()
}).strict();
export type FirebaseAuthVerifyResponse = z.infer<typeof FirebaseAuthVerifyResponseSchema>;

export const ProfileUpsertRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  preferredLanguage: z.enum(['en', 'hi', 'te']),
  accessibilityPreferences: z.array(z.string().max(80)).max(20).default([]),
  photoUrl: z.string().url().max(2048).nullable().optional()
}).strict();
export type ProfileUpsertRequest = z.infer<typeof ProfileUpsertRequestSchema>;


export const CloudinaryUploadSignatureRequestSchema = z.object({
  publicId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{8,128}$/)
    .optional()
}).strict();
export type CloudinaryUploadSignatureRequest = z.infer<
  typeof CloudinaryUploadSignatureRequestSchema
>;

export const CloudinaryUploadSignatureResponseSchema = z.object({
  cloudName: z.string().min(1).max(128),
  apiKey: z.string().min(1).max(128),
  timestamp: z.number().int().positive(),
  folder: z.string().min(1).max(256),
  publicId: z.string().min(1).max(256),
  signature: z.string().length(40)
});
export type CloudinaryUploadSignatureResponse = z.infer<
  typeof CloudinaryUploadSignatureResponseSchema
>;

export const ConsentRequestSchema = z.object({
  purpose: z.enum(['location_tracking', 'trip_sharing', 'incident_evidence', 'service_account']),
  consentVersion: z.string().min(1).max(40),
  status: z.enum(['granted', 'revoked'])
}).strict();
export type ConsentRequest = z.infer<typeof ConsentRequestSchema>;

export const PhoneE164Schema = z.string().regex(/^\+[1-9][0-9]{7,14}$/);
export type PhoneE164 = z.infer<typeof PhoneE164Schema>;

export const EmergencyContactRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  relationship: z.enum(['family', 'friend', 'partner', 'colleague', 'other']),
  phoneE164: z.string().regex(/^\+[1-9][0-9]{7,14}$/),
  isPrimary: z.boolean().default(false)
}).strict();
export type EmergencyContactRequest = z.infer<typeof EmergencyContactRequestSchema>;

export const OnboardingCompleteRequestSchema = z.object({
  profile: ProfileUpsertRequestSchema,
  consent: ConsentRequestSchema,
  emergencyContact: EmergencyContactRequestSchema
}).strict();
export type OnboardingCompleteRequest = z.infer<typeof OnboardingCompleteRequestSchema>;

export const CircleCreateRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    organizationDomain: z
      .string()
      .trim()
      .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
      .nullable()
      .optional(),
    inviteCode: z.string().trim().min(6).max(64).nullable().optional()
  })
  .strict()
  .refine((value) => Boolean(value.organizationDomain || value.inviteCode), {
    message: 'At least one verification method is required'
  });
export type CircleCreateRequest = z.infer<typeof CircleCreateRequestSchema>;

export const CircleReviewRequestSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  reviewNote: z.string().trim().max(500).optional()
}).strict();
export type CircleReviewRequest = z.infer<typeof CircleReviewRequestSchema>;

export const AvailableCircleSchema = z.object({
  circleId: z.string().min(1).max(128),
  name: z.string().min(1).max(120),
  membershipStatus: z.enum(['approved', 'pending', 'rejected', 'not_requested'])
});

export const AvailableCirclesResponseSchema = z.object({
  circles: z.array(AvailableCircleSchema).max(20)
});
export type AvailableCirclesResponse = z.infer<typeof AvailableCirclesResponseSchema>;

export const MembershipRequestResponseSchema = z.object({
  circleId: z.string().min(1).max(128),
  status: z.literal('pending'),
  message: z.string().min(1).max(240)
});

export const FcmDeviceRegistrationSchema = z.object({
  token: z.string().trim().min(20).max(4096),
  platform: z.enum(['android', 'ios', 'web']),
  appVariant: z.enum(['rider', 'driver'])
}).strict();
export type FcmDeviceRegistration = z.infer<typeof FcmDeviceRegistrationSchema>;

export const OpenStreetMapPlaceSchema = z.object({
  placeId: z.number().int().positive(),
  displayName: z.string().trim().min(1).max(300),
  lat: z.string().regex(/^[-+]?(?:\d+|\d*\.\d+)$/),
  lon: z.string().regex(/^[-+]?(?:\d+|\d*\.\d+)$/),
  type: z.string().max(80).optional()
});
export type OpenStreetMapPlace = z.infer<typeof OpenStreetMapPlaceSchema>;
