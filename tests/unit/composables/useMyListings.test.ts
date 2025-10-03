import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useMyListings } from '~/composables/useMyListings'
const mockGetProducts = vi.fn()
const mockDeleteProduct = vi.fn()
const mockGetWantedItems = vi.fn()
const mockDeleteWanted = vi.fn()
vi.mock('~/composables/api/repositories/MarketplaceRepository', () => ({
  MarketplaceRepository: vi.fn(() => ({
    getProducts: mockGetProducts,
    deleteProduct: mockDeleteProduct
  }))
}))
vi.mock('~/composables/api/repositories/WantedRepository', () => ({
  WantedRepository: vi.fn(() => ({
    getWantedItems: mockGetWantedItems,
    deleteWanted: mockDeleteWanted
  }))
}))
const mockCompanyId = ref<string | null>(null)
global.useProfile = vi.fn(() => ({
  companyId: mockCompanyId
}))
describe('useMyListings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCompanyId.value = 'company-123'
  })
  afterEach(() => {
    vi.clearAllMocks()
  })
  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const {
        products,
        wantedItems,
        isLoadingProducts,
        isLoadingWanted,
        productsError,
        wantedError
      } = useMyListings()
      expect(products.value).toEqual([])
      expect(wantedItems.value).toEqual([])
      expect(isLoadingProducts.value).toBe(false)
      expect(isLoadingWanted.value).toBe(false)
      expect(productsError.value).toBeNull()
      expect(wantedError.value).toBeNull()
    })
  })
  describe('fetchProducts', () => {
    it('should fetch products with company_id filter', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          title: 'Product 1',
          price: 100,
          price_currency: 'USD'
        },
        {
          id: 'prod-2',
          title: 'Product 2',
          price: 200,
          price_currency: 'EUR'
        }
      ]
      mockGetProducts.mockResolvedValue({
        items: mockProducts
      })
      const { fetchProducts, products, isLoadingProducts } = useMyListings()
      await fetchProducts()
      expect(mockGetProducts).toHaveBeenCalledWith({
        company_id: 'company-123'
      })
      expect(products.value).toEqual(mockProducts)
      expect(isLoadingProducts.value).toBe(false)
    })
    it('should handle empty product list', async () => {
      mockGetProducts.mockResolvedValue({
        items: []
      })
      const { fetchProducts, products } = useMyListings()
      await fetchProducts()
      expect(products.value).toEqual([])
    })
    it('should not fetch products when no company_id', async () => {
      mockCompanyId.value = null
      const { fetchProducts } = useMyListings()
      await fetchProducts()
      expect(mockGetProducts).not.toHaveBeenCalled()
    })
    it('should handle API errors when fetching products', async () => {
      const error = new Error('Network error')
      mockGetProducts.mockRejectedValue(error)
      const { fetchProducts, productsError, products } = useMyListings()
      await fetchProducts()
      expect(productsError.value).toBe('Network error')
      expect(products.value).toEqual([])
    })
    it('should handle non-Error exceptions', async () => {
      mockGetProducts.mockRejectedValue('String error')
      const { fetchProducts, productsError } = useMyListings()
      await fetchProducts()
      expect(productsError.value).toBe('errors.market.loadProductsFailed')
    })
    it('should set loading state correctly', async () => {
      const loadingStatesDuringFetch: boolean[] = []
      mockGetProducts.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { items: [] }
      })
      const { fetchProducts, isLoadingProducts } = useMyListings()
      const fetchPromise = fetchProducts()
      loadingStatesDuringFetch.push(isLoadingProducts.value)
      await fetchPromise
      loadingStatesDuringFetch.push(isLoadingProducts.value)
      expect(loadingStatesDuringFetch[0]).toBe(true)
      expect(loadingStatesDuringFetch[1]).toBe(false)
    })
  })
  describe('fetchWantedItems', () => {
    it('should fetch wanted items with company_id filter', async () => {
      const mockWantedItems = [
        {
          id: 'wanted-1',
          title: 'Wanted Item 1',
          budget_min: 50,
          budget_max: 150,
          budget_currency: 'USD'
        },
        {
          id: 'wanted-2',
          title: 'Wanted Item 2',
          budget_min: 100,
          budget_max: 300,
          budget_currency: 'EUR'
        }
      ]
      mockGetWantedItems.mockResolvedValue({
        items: mockWantedItems
      })
      const { fetchWantedItems, wantedItems, isLoadingWanted } =
        useMyListings()
      await fetchWantedItems()
      expect(mockGetWantedItems).toHaveBeenCalledWith({
        company_id: 'company-123'
      })
      expect(wantedItems.value).toEqual(mockWantedItems)
      expect(isLoadingWanted.value).toBe(false)
    })
    it('should handle empty wanted items list', async () => {
      mockGetWantedItems.mockResolvedValue({
        items: []
      })
      const { fetchWantedItems, wantedItems } = useMyListings()
      await fetchWantedItems()
      expect(wantedItems.value).toEqual([])
    })
    it('should not fetch wanted items when no company_id', async () => {
      mockCompanyId.value = null
      const { fetchWantedItems } = useMyListings()
      await fetchWantedItems()
      expect(mockGetWantedItems).not.toHaveBeenCalled()
    })
    it('should handle API errors when fetching wanted items', async () => {
      const error = new Error('API Error')
      mockGetWantedItems.mockRejectedValue(error)
      const { fetchWantedItems, wantedError, wantedItems } = useMyListings()
      await fetchWantedItems()
      expect(wantedError.value).toBe('API Error')
      expect(wantedItems.value).toEqual([])
    })
    it('should handle non-Error exceptions', async () => {
      mockGetWantedItems.mockRejectedValue({
        message: 'Object error'
      })
      const { fetchWantedItems, wantedError } = useMyListings()
      await fetchWantedItems()
      expect(wantedError.value).toBe('errors.wanted.loadFailed')
    })
    it('should set loading state correctly', async () => {
      const loadingStatesDuringFetch: boolean[] = []
      mockGetWantedItems.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return { items: [] }
      })
      const { fetchWantedItems, isLoadingWanted } = useMyListings()
      const fetchPromise = fetchWantedItems()
      loadingStatesDuringFetch.push(isLoadingWanted.value)
      await fetchPromise
      loadingStatesDuringFetch.push(isLoadingWanted.value)
      expect(loadingStatesDuringFetch[0]).toBe(true)
      expect(loadingStatesDuringFetch[1]).toBe(false)
    })
  })
  describe('deleteProduct', () => {
    it('should delete product and refresh list', async () => {
      const mockProducts = [
        { id: 'prod-1', title: 'Product 1' },
        { id: 'prod-2', title: 'Product 2' }
      ]
      mockDeleteProduct.mockResolvedValue(undefined)
      mockGetProducts
        .mockResolvedValueOnce({ items: mockProducts })
        .mockResolvedValueOnce({
          items: [{ id: 'prod-2', title: 'Product 2' }]
        })
      const { deleteProduct, fetchProducts, products } = useMyListings()
      
      await fetchProducts()
      expect(products.value).toHaveLength(2)
      
      const result = await deleteProduct('prod-1')
      expect(result).toBe(true)
      expect(mockDeleteProduct).toHaveBeenCalledWith('prod-1')
      expect(mockGetProducts).toHaveBeenCalledTimes(2)
      expect(products.value).toHaveLength(1)
      expect(products.value[0].id).toBe('prod-2')
    })
    it('should throw error on delete failure', async () => {
      const error = new Error('Delete failed')
      mockDeleteProduct.mockRejectedValue(error)
      const { deleteProduct } = useMyListings()
      await expect(deleteProduct('prod-1')).rejects.toThrow('Delete failed')
      expect(mockGetProducts).not.toHaveBeenCalled()
    })
    it('should console.error on delete failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Delete error')
      mockDeleteProduct.mockRejectedValue(error)
      const { deleteProduct } = useMyListings()
      try {
        await deleteProduct('prod-1')
      } catch (e) {
        
      }
      expect(consoleSpy).toHaveBeenCalledWith(
        'errors.product.deleteFailedLog',
        error
      )
      consoleSpy.mockRestore()
    })
  })
  describe('deleteWantedItem', () => {
    it('should delete wanted item and refresh list', async () => {
      const mockWantedItems = [
        { id: 'wanted-1', title: 'Wanted 1' },
        { id: 'wanted-2', title: 'Wanted 2' }
      ]
      mockDeleteWanted.mockResolvedValue(undefined)
      mockGetWantedItems
        .mockResolvedValueOnce({ items: mockWantedItems })
        .mockResolvedValueOnce({
          items: [{ id: 'wanted-2', title: 'Wanted 2' }]
        })
      const { deleteWantedItem, fetchWantedItems, wantedItems } =
        useMyListings()
      
      await fetchWantedItems()
      expect(wantedItems.value).toHaveLength(2)
      
      const result = await deleteWantedItem('wanted-1')
      expect(result).toBe(true)
      expect(mockDeleteWanted).toHaveBeenCalledWith('wanted-1')
      expect(mockGetWantedItems).toHaveBeenCalledTimes(2)
      expect(wantedItems.value).toHaveLength(1)
      expect(wantedItems.value[0].id).toBe('wanted-2')
    })
    it('should throw error on delete failure', async () => {
      const error = new Error('Delete failed')
      mockDeleteWanted.mockRejectedValue(error)
      const { deleteWantedItem } = useMyListings()
      await expect(deleteWantedItem('wanted-1')).rejects.toThrow(
        'Delete failed'
      )
      expect(mockGetWantedItems).not.toHaveBeenCalled()
    })
    it('should console.error on delete failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Delete error')
      mockDeleteWanted.mockRejectedValue(error)
      const { deleteWantedItem } = useMyListings()
      try {
        await deleteWantedItem('wanted-1')
      } catch (e) {
        
      }
      expect(consoleSpy).toHaveBeenCalledWith(
        'errors.wanted.deleteFailedLog',
        error
      )
      consoleSpy.mockRestore()
    })
  })
  describe('fetchAll', () => {
    it('should fetch both products and wanted items in parallel', async () => {
      const mockProducts = [{ id: 'prod-1', title: 'Product 1' }]
      const mockWantedItemsList = [{ id: 'wanted-1', title: 'Wanted 1' }]
      mockGetProducts.mockResolvedValue({
        items: mockProducts
      })
      mockGetWantedItems.mockResolvedValue({
        items: mockWantedItemsList
      })
      const { fetchAll, products, wantedItems } = useMyListings()
      await fetchAll()
      expect(mockGetProducts).toHaveBeenCalled()
      expect(mockGetWantedItems).toHaveBeenCalled()
      expect(products.value).toEqual(mockProducts)
      expect(wantedItems.value).toEqual(mockWantedItemsList)
    })
    it('should handle partial failures gracefully', async () => {
      const mockWantedItemsList = [{ id: 'wanted-1', title: 'Wanted 1' }]
      mockGetProducts.mockRejectedValue(
        new Error('Products error')
      )
      mockGetWantedItems.mockResolvedValue({
        items: mockWantedItemsList
      })
      const { fetchAll, productsError, wantedItems, wantedError } =
        useMyListings()
      await fetchAll()
      expect(productsError.value).toBe('Products error')
      expect(wantedError.value).toBeNull()
      expect(wantedItems.value).toEqual(mockWantedItemsList)
    })
    it('should not fetch when no company_id', async () => {
      mockCompanyId.value = null
      const { fetchAll } = useMyListings()
      await fetchAll()
      expect(mockGetProducts).not.toHaveBeenCalled()
      expect(mockGetWantedItems).not.toHaveBeenCalled()
    })
  })
  describe('Readonly properties', () => {
    it('should return readonly refs', () => {
      const {
        products,
        wantedItems,
        isLoadingProducts,
        isLoadingWanted,
        productsError,
        wantedError
      } = useMyListings()
      const initialProducts = products.value
      const initialWantedItems = wantedItems.value
      const initialLoadingProducts = isLoadingProducts.value
      const initialLoadingWanted = isLoadingWanted.value
      const initialProductsError = productsError.value
      const initialWantedError = wantedError.value
      
      products.value = [{ id: 'test', title: 'test' }]
      expect(products.value).toBe(initialProducts)
      
      wantedItems.value = [{ id: 'test', title: 'test' }]
      expect(wantedItems.value).toBe(initialWantedItems)
      
      isLoadingProducts.value = true
      expect(isLoadingProducts.value).toBe(initialLoadingProducts)
      
      isLoadingWanted.value = true
      expect(isLoadingWanted.value).toBe(initialLoadingWanted)
      
      productsError.value = 'error'
      expect(productsError.value).toBe(initialProductsError)
      
      wantedError.value = 'error'
      expect(wantedError.value).toBe(initialWantedError)
    })
  })
  describe('Edge cases', () => {
    it('should handle undefined company_id conversion to string', async () => {
      mockCompanyId.value = undefined as any
      const { fetchProducts } = useMyListings()
      await fetchProducts()
      expect(mockGetProducts).not.toHaveBeenCalled()
    })
    it('should handle numeric company_id', async () => {
      mockCompanyId.value = 12345 as any
      mockGetProducts.mockResolvedValue({ items: [] })
      const { fetchProducts } = useMyListings()
      await fetchProducts()
      expect(mockGetProducts).toHaveBeenCalledWith({
        company_id: '12345'
      })
    })
    it('should clear error on successful fetch after error', async () => {
      mockGetProducts
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ items: [] })
      const { fetchProducts, productsError } = useMyListings()
      
      await fetchProducts()
      expect(productsError.value).toBe('First error')
      
      await fetchProducts()
      expect(productsError.value).toBeNull()
    })
    it('should handle concurrent delete operations', async () => {
      mockDeleteProduct.mockResolvedValue(undefined)
      mockGetProducts.mockResolvedValue({ items: [] })
      mockDeleteWanted.mockResolvedValue(undefined)
      mockGetWantedItems.mockResolvedValue({ items: [] })
      const { deleteProduct, deleteWantedItem } = useMyListings()
      const results = await Promise.all([
        deleteProduct('prod-1'),
        deleteWantedItem('wanted-1')
      ])
      expect(results).toEqual([true, true])
      expect(mockDeleteProduct).toHaveBeenCalled()
      expect(mockDeleteWanted).toHaveBeenCalled()
    })
  })
})