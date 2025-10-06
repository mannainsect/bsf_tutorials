export default defineNuxtPlugin(async () => {
  try {
    // Dynamically import swiper to handle potential missing module
    const { register } = await import('swiper/element/bundle')
    // Register Swiper custom elements globally
    register()
  } catch (error) {
    console.warn(
      'Swiper element bundle not found, skipping registration:',
      error
    )
  }
})
