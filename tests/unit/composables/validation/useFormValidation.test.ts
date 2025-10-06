import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { z } from 'zod'
import {
  useFormValidation,
  validationSchemas,
  loginSchema,
  registerSchema,
  profileSchema
} from '~/composables/validation/useFormValidation'

describe('useFormValidation', () => {
  describe('validationSchemas', () => {
    it('should validate email correctly', () => {
      expect(
        validationSchemas.email.safeParse('test@example.com').success
      ).toBe(true)
      expect(validationSchemas.email.safeParse('invalid').success).toBe(false)
      expect(validationSchemas.email.safeParse('').success).toBe(false)
    })

    it('should validate password with min 8 chars', () => {
      expect(validationSchemas.password.safeParse('12345678').success).toBe(
        true
      )
      expect(validationSchemas.password.safeParse('1234567').success).toBe(
        false
      )
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
      expect(validationSchemas.phone.safeParse('+1234567890').success).toBe(
        true
      )
      expect(validationSchemas.phone.safeParse('123-456-7890').success).toBe(
        true
      )
      expect(validationSchemas.phone.safeParse('(123) 456-7890').success).toBe(
        true
      )
      expect(validationSchemas.phone.safeParse('abc').success).toBe(false)
    })

    it('should validate URL', () => {
      expect(
        validationSchemas.url.safeParse('https://example.com').success
      ).toBe(true)
      expect(
        validationSchemas.url.safeParse('http://example.com').success
      ).toBe(true)
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
      expect(form.errors.value.confirmPassword).toContain(
        "Passwords don't match"
      )
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
})
