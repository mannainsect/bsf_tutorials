// Form and validation related types
export interface FormField<T = string> {
  value: T
  error?: string
  touched?: boolean
  required?: boolean
  disabled?: boolean
}

export interface FormState<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FormField<T[K]>
  }
  isValid: boolean
  isSubmitting: boolean
  hasErrors: boolean
}

// Validation types
export type ValidatorFn<T = unknown> = (value: T) => string | null
export type AsyncValidatorFn<T = unknown> = (
  value: T
) => Promise<string | null>

export interface ValidationRule<T = unknown> {
  validator: ValidatorFn<T> | AsyncValidatorFn<T>
  message?: string
  trigger?: 'change' | 'blur' | 'submit'
}

export interface FieldValidation<T = unknown> {
  rules: ValidationRule<T>[]
  required?: boolean
  requiredMessage?: string
}

// Common form validation schemas
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name?: string
  beta_code?: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
  token: string
}

// Component prop types
export interface BaseInputProps {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: string
  helperText?: string
}

export interface BaseSelectProps {
  modelValue?: string | number | string[] | number[]
  options: SelectOption[]
  label?: string
  placeholder?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  error?: string
  helperText?: string
}

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}
