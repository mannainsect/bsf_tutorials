import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuth } from '~/composables/useAuth'
describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  it('should initialize properly', () => {
    const auth = useAuth()
    expect(auth).toBeDefined()
    expect(auth.user).toBeDefined()
    expect(auth.isAuthenticated).toBeDefined()
  })
  it('should have isAuthenticated as false initially', () => {
    const auth = useAuth()
    expect(auth.isAuthenticated.value.value).toBe(false)
  })
  it('should have user as null initially', () => {
    const auth = useAuth()
    expect(auth.user.value.value).toBe(null)
  })
})