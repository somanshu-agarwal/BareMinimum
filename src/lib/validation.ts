// src/lib/validation.ts
import { z } from 'zod'

export const ExpenseSchema = z.object({
  amount: z.number()
    .min(1, "Amount must be at least ₹1")
    .max(10000000, "Amount cannot exceed ₹1 crore"),
  category: z.string().min(1, "Category is required"),
  paymentMethod: z.enum(['UPI', 'Cash', 'Netbanking', 'Card']),
  merchant: z.string().max(100, "Merchant name too long").optional(),
  description: z.string().max(500, "Description too long").optional()
})

export type ExpenseFormData = z.infer<typeof ExpenseSchema>