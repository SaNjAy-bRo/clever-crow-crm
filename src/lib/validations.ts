import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Client Name is required"),
  phoneNumber: z.string().min(1, "Phone Number is required"),
  businessName: z.string().min(1, "Business Name is required"),
  address: z.string().min(1, "Address is required"),
  notes: z.string().optional().default(""),
  serviceDetails: z.string().min(1, "Service Details are required"),
  status: z.enum(["lead", "active", "completed", "inactive"]).default("lead"),
  value: z.coerce.number().nonnegative("Value must be a positive number").default(0),
  currency: z.enum(["INR", "USD", "EUR", "GBP"]).default("INR"),
});

export const whitelistSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional().default(""),
  role: z.enum(["admin", "user"]).default("user"),
});
