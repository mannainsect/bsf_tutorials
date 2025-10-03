export const useApiEndpoints = () => {
  const config = useRuntimeConfig()
  return config.public.apiEndpoints
}