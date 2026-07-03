import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Contact Name is required"),
  businessName: z.string().min(1, "Business Name is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  whatsappNumber: z.string().optional().nullable().default(""),
  email: z.string().optional().nullable().default(""),
  website: z.string().optional().nullable().default(""),
  instagram: z.string().optional().nullable().default(""),
  googleMap: z.string().optional().nullable().default(""),
  city: z.string().optional().nullable().default(""),
  area: z.string().optional().nullable().default(""),
  industry: z.string().optional().nullable().default(""),
  category: z.string().optional().nullable().default("Other"),
  source: z.string().optional().nullable().default("Other"),
  serviceInterests: z.string().optional().default("[]"),
  status: z.string().default("New Prospect"),
  address: z.string().optional().nullable().default(""),
  notes: z.string().optional().nullable().default(""),
  serviceDetails: z.string().optional().nullable().default(""),
  
  // Deal & collection fields
  value: z.coerce.number().nonnegative().default(0),
  currency: z.string().default("INR"),
  dealValue: z.coerce.number().nonnegative().default(0),
  advanceAmount: z.coerce.number().nonnegative().default(0),
  balanceAmount: z.coerce.number().nonnegative().default(0),
  paymentStatus: z.string().default("Pending"),
  invoiceStatus: z.string().default("Draft"),
  gstRequired: z.boolean().default(false),
  collectionDate: z.string().optional().nullable(),
  expectedBalanceDate: z.string().optional().nullable(),
  dealOwnerEmail: z.string().optional().nullable(),
  incentiveEligible: z.boolean().default(false),
  dealStatus: z.string().optional().nullable(),

  // Scoring
  score: z.coerce.number().default(0),
  temperature: z.string().default("Cold"),
  lostReason: z.string().optional().nullable(),

  // Onboarding & Client flow
  isConvertedClient: z.boolean().default(false),
  clientStartDate: z.string().optional().nullable(),
  projectManager: z.string().optional().nullable(),
  projectStatus: z.string().optional().nullable(),
  renewalDate: z.string().optional().nullable(),
  onboardingChecklist: z.string().optional().default("{}")
});

export const whitelistSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional().default(""),
  role: z.enum(["admin", "manager", "bdm", "telecaller", "team_member"]).default("bdm"),
});
