import { z } from 'zod'
import type { ZodSchema } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

// Common validation schemas
export const validationSchemas = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  required: z.string().min(1, 'This field is required'),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),
  url: z.string().url('Please enter a valid URL')
}

// Auth form schemas
export const loginSchema = toTypedSchema(
  z.object({
    email: validationSchemas.email,
    password: validationSchemas.password
  })
)

export const registerSchema = toTypedSchema(
  z
    .object({
      name: validationSchemas.required,
      email: validationSchemas.email,
      password: validationSchemas.password,
      confirmPassword: validationSchemas.password
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    })
)

// Profile form schema
export const profileSchema = toTypedSchema(
  z.object({
    name: validationSchemas.required,
    email: validationSchemas.email,
    phone: validationSchemas.phone.optional(),
    website: validationSchemas.url.optional()
  })
)

// Generic form validation composable
export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T> | ReturnType<typeof toTypedSchema>,
  initialValues?: Partial<T>
) {
  const form = useForm<T>({
    validationSchema:
      schema instanceof z.ZodType ? toTypedSchema(schema) : schema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialValues: initialValues as any
  })

  return {
    ...form,
    // Helper to check if form is valid and ready to submit
    isValid: computed(() => form.meta.value.valid),
    // Helper to get all errors
    allErrors: computed(() => {
      const errors: string[] = []
      Object.values(form.errors.value).forEach(error => {
        if (error) errors.push(error)
      })
      return errors
    })
  }
}
