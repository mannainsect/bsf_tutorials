import { z } from 'zod'
import type { ZodSchema } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string

export type MessageTree = Record<string, unknown>

const fallbackMessages: MessageTree = {
  validation: {
    invalidEmail: 'Please enter a valid email address',
    minLength: 'Minimum length is {min} characters',
    required: 'This field is required',
    invalidPhone: 'Please enter a valid phone number',
    invalidUrl: 'Please enter a valid URL',
    passwordMatch: "Passwords don't match",
    profile: {
      nameRequired: 'Name is required'
    },
    company: {
      nameRequired: 'Company name is required',
      countryFormat: 'Country must be a 2-letter ISO code (e.g., FI)'
    }
  }
}

const resolveMessage = (
  key: string,
  source: MessageTree = fallbackMessages
): string | undefined => {
  const segments = key.split('.')
  let current: unknown = source

  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}

const interpolate = (message: string, params?: Record<string, unknown>): string => {
  if (!params) return message

  return message.replace(/\{(\w+)\}/g, (_, param) => {
    const value = params[param]
    return value != null ? String(value) : ''
  })
}

export const createFallbackTranslator = (source: MessageTree = fallbackMessages): TranslateFn => {
  return (key, params) => {
    const msg = resolveMessage(key, source)
    if (!msg) return key
    return interpolate(msg, params)
  }
}

const createValidationFragments = (t: TranslateFn) => ({
  email: z.string().email(t('validation.invalidEmail')),
  password: z.string().min(8, t('validation.minLength', { min: 8 })),
  required: z.string().min(1, t('validation.required')),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, t('validation.invalidPhone')),
  url: z.string().url(t('validation.invalidUrl'))
})

export const validationSchemas = createValidationFragments(createFallbackTranslator())

export const createLoginSchema = (t: TranslateFn) => {
  const f = createValidationFragments(t)
  return z.object({
    email: f.email,
    password: f.password
  })
}

export const createRegisterSchema = (t: TranslateFn) => {
  const f = createValidationFragments(t)
  return z
    .object({
      name: f.required,
      email: f.email,
      password: f.password,
      confirmPassword: f.password
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('validation.passwordMatch'),
      path: ['confirmPassword']
    })
}

export const createProfileSchema = (t: TranslateFn) => {
  const f = createValidationFragments(t)
  return z.object({
    name: f.required,
    email: f.email,
    phone: f.phone.optional(),
    website: f.url.optional()
  })
}

export const createRegisterEmailPasswordSchema = (t: TranslateFn) => {
  const f = createValidationFragments(t)
  return z.object({
    email: f.email,
    password: f.password
  })
}

export const createResetPasswordRequestSchema = (t: TranslateFn) => {
  const f = createValidationFragments(t)
  return z.object({
    email: f.email
  })
}

export const createResetPasswordConfirmSchema = (t: TranslateFn) => {
  const f = createValidationFragments(t)
  return z
    .object({
      password: f.password,
      confirmPassword: f.password
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('validation.passwordMatch'),
      path: ['confirmPassword']
    })
}

export const createProfileEditSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t('validation.profile.nameRequired')),
    city: z.string().optional(),
    country: z.string().optional()
  })

export const createCompanyEditSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t('validation.company.nameRequired')).max(200).optional(),
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

const fallbackT = createFallbackTranslator()

export const loginSchema = toTypedSchema(createLoginSchema(fallbackT))

export const registerSchema = toTypedSchema(createRegisterSchema(fallbackT))

export const profileSchema = toTypedSchema(createProfileSchema(fallbackT))

export const registerEmailPasswordSchema = toTypedSchema(
  createRegisterEmailPasswordSchema(fallbackT)
)

export const resetPasswordRequestSchema = toTypedSchema(createResetPasswordRequestSchema(fallbackT))

export const resetPasswordConfirmSchema = toTypedSchema(createResetPasswordConfirmSchema(fallbackT))

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T> | ReturnType<typeof toTypedSchema>,
  initialValues?: Partial<T>
) {
  const form = useForm<T>({
    validationSchema: schema instanceof z.ZodType ? toTypedSchema(schema) : schema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValues: initialValues as any
  })

  return {
    ...form,
    isValid: computed(() => form.meta.value.valid),
    allErrors: computed(() => {
      const errors: string[] = []
      Object.values(form.errors.value).forEach(error => {
        if (error) errors.push(error)
      })
      return errors
    })
  }
}
