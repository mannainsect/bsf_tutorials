import { z } from 'zod'

export const createCompanyEditSchema = (t: (key: string) => string) =>
  z.object({
    name: z
      .string()
      .min(1, t('validation.company.nameRequired'))
      .max(200)
      .optional(),
    street: z.string().max(200).optional(),
    city: z.string().max(100).optional(),
    country: z
      .string()
      .length(2, t('validation.company.countryFormat'))
      .regex(/^[A-Z]{2}$/, t('validation.company.countryFormat'))
      .optional(),
    timezone: z.string().optional(),
    business_id: z.string().max(50).optional()
  })

export type CompanyEditForm = {
  name?: string
  street?: string
  city?: string
  country?: string
  timezone?: string
  business_id?: string
}
