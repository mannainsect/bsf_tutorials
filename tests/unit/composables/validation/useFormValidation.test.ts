import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { z } from 'zod'
import {
  useFormValidation,
  validationSchemas,
  loginSchema,
  registerSchema,
  profileSchema,
  registerEmailPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  createProfileSchema,
  createRegisterEmailPasswordSchema,
  createProfileEditSchema,
  createResetPasswordRequestSchema,
  createResetPasswordConfirmSchema
} from '~/composables/validation/useFormValidation'

describe('useFormValidation', () => {
  describe('validationSchemas', () => {
    it('should validate email correctly', () => {
      expect(validationSchemas.email.safeParse('test@example.com').success).toBe(true)
      expect(validationSchemas.email.safeParse('invalid').success).toBe(false)
      expect(validationSchemas.email.safeParse('').success).toBe(false)
    })

    it('should validate password with min 8 chars', () => {
      expect(validationSchemas.password.safeParse('12345678').success).toBe(true)
      expect(validationSchemas.password.safeParse('1234567').success).toBe(false)
      const result = validationSchemas.password.safeParse('short')
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8 characters')
      }
    })

    it('should validate required field', () => {
      expect(validationSchemas.required.safeParse('value').success).toBe(true)
      expect(validationSchemas.required.safeParse('').success).toBe(false)
      const result = validationSchemas.required.safeParse('')
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('This field is required')
      }
    })

    it('should validate phone number', () => {
      expect(validationSchemas.phone.safeParse('+1234567890').success).toBe(true)
      expect(validationSchemas.phone.safeParse('123-456-7890').success).toBe(true)
      expect(validationSchemas.phone.safeParse('(123) 456-7890').success).toBe(true)
      expect(validationSchemas.phone.safeParse('abc').success).toBe(false)
    })

    it('should validate URL', () => {
      expect(validationSchemas.url.safeParse('https://example.com').success).toBe(true)
      expect(validationSchemas.url.safeParse('http://example.com').success).toBe(true)
      expect(validationSchemas.url.safeParse('not-a-url').success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: '12345678'
      })

      await nextTick()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should reject invalid email', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'invalid-email',
        password: '12345678'
      })

      await form.validate()
      expect(form.errors.value.email).toBeTruthy()
    })

    it('should reject short password', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: 'short'
      })

      await form.validate()
      expect(form.errors.value.password).toBeTruthy()
      expect(form.errors.value.password).toContain('8 characters')
    })

    it('should require both fields', async () => {
      const form = useFormValidation(loginSchema, {})

      await form.validate()
      expect(form.errors.value.email).toBeTruthy()
      expect(form.errors.value.password).toBeTruthy()
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', async () => {
      const form = useFormValidation(registerSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should reject when passwords do not match', async () => {
      const form = useFormValidation(registerSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      })

      await form.validate()
      expect(form.errors.value.confirmPassword).toBeTruthy()
      expect(form.errors.value.confirmPassword).toContain("Passwords don't match")
    })

    it('should require all mandatory fields', async () => {
      const form = useFormValidation(registerSchema, {})

      await form.validate()
      expect(form.errors.value.name).toBeTruthy()
      expect(form.errors.value.email).toBeTruthy()
      expect(form.errors.value.password).toBeTruthy()
    })

    it('should validate name field', async () => {
      const form = useFormValidation(registerSchema, {
        name: '',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      })

      await form.validate()
      expect(form.errors.value.name).toBeTruthy()
    })
  })

  describe('profileSchema', () => {
    it('should validate complete profile data', async () => {
      const form = useFormValidation(profileSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        website: 'https://example.com'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should validate with optional fields empty', async () => {
      const form = useFormValidation(profileSchema, {
        name: 'John Doe',
        email: 'john@example.com'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should reject invalid phone', async () => {
      const form = useFormValidation(profileSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        phone: 'invalid-phone'
      })

      await form.validate()
      expect(form.errors.value.phone).toBeTruthy()
      expect(form.errors.value.phone).toContain('valid phone number')
    })

    it('should reject invalid website URL', async () => {
      const form = useFormValidation(profileSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        website: 'not-a-url'
      })

      await form.validate()
      expect(form.errors.value.website).toBeTruthy()
      expect(form.errors.value.website).toContain('valid URL')
    })

    it('should require mandatory fields', async () => {
      const form = useFormValidation(profileSchema, {})

      await form.validate()
      expect(form.errors.value.name).toBeTruthy()
      expect(form.errors.value.email).toBeTruthy()
    })
  })

  describe('useFormValidation composable', () => {
    it('should initialize with initial values', () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: '12345678'
      })

      expect(form.values.email).toBe('test@example.com')
      expect(form.values.password).toBe('12345678')
    })

    it('should expose isValid computed property', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: '12345678'
      })

      await form.validate()
      expect(form.isValid.value).toBe(true)
    })

    it('should mark invalid form with isValid false', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'invalid',
        password: 'short'
      })

      await form.validate()
      expect(form.isValid.value).toBe(false)
    })

    it('should expose allErrors computed property', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'invalid',
        password: 'short'
      })

      await form.validate()
      expect(form.allErrors.value.length).toBeGreaterThan(0)
      expect(form.allErrors.value).toEqual(
        expect.arrayContaining([expect.stringContaining('email')])
      )
    })

    it('should collect all field errors in allErrors', async () => {
      const form = useFormValidation(loginSchema, {})

      await form.validate()
      const errors = form.allErrors.value
      expect(errors.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle Zod schema directly', async () => {
      const customSchema = z.object({
        username: z.string().min(3, 'Min 3 chars'),
        age: z.number().min(18, 'Must be 18+')
      })

      const form = useFormValidation(customSchema, {
        username: 'Jo',
        age: 16
      })

      await form.validate()
      expect(form.errors.value.username).toBeTruthy()
      expect(form.errors.value.age).toBeTruthy()
    })

    it('should handle typed schema', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: 'password123'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should update values reactively', async () => {
      const form = useFormValidation(loginSchema, {
        email: '',
        password: ''
      })

      await form.validate()
      expect(form.isValid.value).toBe(false)

      form.setFieldValue('email', 'test@example.com')
      form.setFieldValue('password', 'password123')

      // Need to wait for validation to complete
      await nextTick()
      await form.validate()
      await nextTick()

      expect(form.isValid.value).toBe(true)
    })

    it('should clear errors when fixed', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'invalid',
        password: '12345678'
      })

      await form.validate()
      expect(form.errors.value.email).toBeTruthy()

      form.setFieldValue('email', 'valid@example.com')
      await nextTick()
      await form.validate()
      await nextTick()

      // Email error should be cleared after valid value
      expect(form.isValid.value).toBe(true)
    })

    it('should handle empty initial values', () => {
      const form = useFormValidation(loginSchema)
      expect(form.values).toBeDefined()
    })

    it('should provide meta information', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: '12345678'
      })

      expect(form.meta).toBeDefined()
      expect(form.meta.value).toHaveProperty('valid')
      expect(form.meta.value).toHaveProperty('dirty')
    })
  })

  describe('field-level errors', () => {
    it('should show error for specific field', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'invalid-email',
        password: '12345678'
      })

      await form.validate()
      expect(form.errors.value.email).toContain('valid email')
      expect(form.errors.value.password).toBeFalsy()
    })

    it('should show multiple field errors', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'invalid',
        password: 'short'
      })

      await form.validate()
      expect(form.errors.value.email).toBeTruthy()
      expect(form.errors.value.password).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle whitespace-only required field', async () => {
      const form = useFormValidation(registerSchema, {
        name: '   ',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      })

      await form.validate()
      // Zod min(1) allows whitespace; this is expected behavior
      // The validation schema would need .trim() to reject whitespace
      expect(form.meta.value.valid).toBe(true)
    })

    it('should validate properly formatted email', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: '12345678'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should handle special characters in password', async () => {
      const form = useFormValidation(loginSchema, {
        email: 'test@example.com',
        password: 'p@ssw0rd!'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should validate international phone numbers', async () => {
      const form = useFormValidation(profileSchema, {
        name: 'John',
        email: 'john@example.com',
        phone: '+44 20 7946 0958'
      })

      await form.validate()
      expect(form.errors.value.phone).toBeFalsy()
    })

    it('should handle undefined optional fields', async () => {
      const form = useFormValidation(profileSchema, {
        name: 'John',
        email: 'john@example.com',
        phone: undefined,
        website: undefined
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })
  })

  describe('registerEmailPasswordSchema', () => {
    it('should validate correct data', async () => {
      const form = useFormValidation(registerEmailPasswordSchema, {
        email: 'test@example.com',
        password: 'password123'
      })

      await form.validate()
      expect(form.meta.value.valid).toBe(true)
    })

    it('should reject missing email', async () => {
      const form = useFormValidation(registerEmailPasswordSchema, {
        email: '',
        password: 'password123'
      })

      await form.validate()
      expect(form.errors.value.email).toBeTruthy()
    })

    it('should reject invalid email', async () => {
      const form = useFormValidation(registerEmailPasswordSchema, {
        email: 'not-an-email',
        password: 'password123'
      })

      await form.validate()
      expect(form.errors.value.email).toContain('valid email')
    })

    it('should reject short password', async () => {
      const form = useFormValidation(registerEmailPasswordSchema, {
        email: 'test@example.com',
        password: 'abc'
      })

      await form.validate()
      expect(form.errors.value.password).toContain('8 characters')
    })
  })

  describe('translator injection', () => {
    const stubT = (k: string, p?: Record<string, unknown>) => `T:${k}:${JSON.stringify(p ?? {})}`

    it('createLoginSchema uses translator', () => {
      const schema = createLoginSchema(stubT)
      const result = schema.safeParse({ email: '', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })

    it('createRegisterSchema uses translator', () => {
      const schema = createRegisterSchema(stubT)
      const result = schema.safeParse({ name: '', email: '', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })

    it('createProfileSchema uses translator', () => {
      const schema = createProfileSchema(stubT)
      const result = schema.safeParse({ name: '', email: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })

    it('createRegisterEmailPasswordSchema uses translator', () => {
      const schema = createRegisterEmailPasswordSchema(stubT)
      const result = schema.safeParse({ email: '', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })

    it('createResetPasswordRequestSchema uses translator', () => {
      const schema = createResetPasswordRequestSchema(stubT)
      const result = schema.safeParse({ email: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })

    it('createResetPasswordConfirmSchema uses translator', () => {
      const schema = createResetPasswordConfirmSchema(stubT)
      const result = schema.safeParse({ password: '', confirmPassword: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })

    it('createProfileEditSchema uses translator', () => {
      const schema = createProfileEditSchema(stubT)
      const result = schema.safeParse({ name: '', city: '', country: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const msgs = result.error.issues.map(i => i.message)
        expect(msgs.some(m => m.startsWith('T:'))).toBe(true)
      }
    })
  })

  describe('resetPasswordRequestSchema', () => {
    const stubT = (k: string, p?: Record<string, unknown>) => `T:${k}:${JSON.stringify(p ?? {})}`

    it('should accept valid email', () => {
      const schema = createResetPasswordRequestSchema(stubT)
      const result = schema.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const schema = createResetPasswordRequestSchema(stubT)
      const result = schema.safeParse({ email: 'not-an-email' })
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const schema = createResetPasswordRequestSchema(stubT)
      const result = schema.safeParse({ email: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordConfirmSchema', () => {
    const stubT = (k: string, p?: Record<string, unknown>) => `T:${k}:${JSON.stringify(p ?? {})}`

    it('should accept matching passwords >= 8 chars', () => {
      const schema = createResetPasswordConfirmSchema(stubT)
      const result = schema.safeParse({
        password: 'password123',
        confirmPassword: 'password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject short passwords', () => {
      const schema = createResetPasswordConfirmSchema(stubT)
      const result = schema.safeParse({
        password: 'short',
        confirmPassword: 'short'
      })
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const schema = createResetPasswordConfirmSchema(stubT)
      const result = schema.safeParse({
        password: 'password123',
        confirmPassword: 'different123'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map(i => i.path.join('.'))
        expect(paths).toContain('confirmPassword')
      }
    })

    it('should reject empty passwords', () => {
      const schema = createResetPasswordConfirmSchema(stubT)
      const result = schema.safeParse({
        password: '',
        confirmPassword: ''
      })
      expect(result.success).toBe(false)
    })
  })
})
