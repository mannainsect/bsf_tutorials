import {
  MarketplaceRepository
} from '~/composables/api/repositories/MarketplaceRepository'
import {
  WantedRepository
} from '~/composables/api/repositories/WantedRepository'
import type {
  Product
} from '../../shared/types/models/MarketplaceProduct'
import type {
  Wanted
} from '../../shared/types/models/MarketplaceWanted'

export const useMyListings = () => {
  const { t } = useI18n()
  const { companyId } = useProfile()
  const marketplaceRepo = new MarketplaceRepository()
  const wantedRepo = new WantedRepository()

  const products = ref<Product[]>([])
  const wantedItems = ref<Wanted[]>([])
  const isLoadingProducts = ref(false)
  const isLoadingWanted = ref(false)
  const productsError = ref<string | null>(null)
  const wantedError = ref<string | null>(null)

  const fetchProducts = async () => {
    if (!companyId.value) return

    isLoadingProducts.value = true
    productsError.value = null

    try {
      const response = await marketplaceRepo.getProducts({
        company_id: companyId.value?.toString() ?? ""
      })
      products.value = response.items as Product[]
    } catch (error) {
      productsError.value = error instanceof Error
        ? error.message
        : t('errors.market.loadProductsFailed')
    } finally {
      isLoadingProducts.value = false
    }
  }

  const fetchWantedItems = async () => {
    if (!companyId.value) return

    isLoadingWanted.value = true
    wantedError.value = null

    try {
      const response = await wantedRepo.getWantedItems({
        company_id: companyId.value?.toString() ?? ""
      })
      wantedItems.value = response.items as Wanted[]
    } catch (error) {
      wantedError.value = error instanceof Error
        ? error.message
        : t('errors.wanted.loadFailed')
    } finally {
      isLoadingWanted.value = false
    }
  }

  const deleteProduct = async (productId: string): Promise<boolean> => {
    try {
      await marketplaceRepo.deleteProduct(productId)
      await fetchProducts()
      return true
    } catch (error) {
      console.error(t('errors.product.deleteFailedLog'), error)
      throw error
    }
  }

  const deleteWantedItem = async (itemId: string): Promise<boolean> => {
    try {
      await wantedRepo.deleteWanted(itemId)
      await fetchWantedItems()
      return true
    } catch (error) {
      console.error(t('errors.wanted.deleteFailedLog'), error)
      throw error
    }
  }

  const fetchAll = async () => {
    await Promise.all([
      fetchProducts(),
      fetchWantedItems()
    ])
  }

  return {
    products: readonly(products),
    wantedItems: readonly(wantedItems),
    isLoadingProducts: readonly(isLoadingProducts),
    isLoadingWanted: readonly(isLoadingWanted),
    productsError: readonly(productsError),
    wantedError: readonly(wantedError),
    fetchProducts,
    fetchWantedItems,
    fetchAll,
    deleteProduct,
    deleteWantedItem
  }
}
