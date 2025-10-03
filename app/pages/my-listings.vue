<template>
  <div class="ion-padding">
      <div>

            <ion-text class="ion-text-center">
              <h1>{{ t('menu.myListings') }}</h1>
              <p>{{ t('marketplace.myListingsDescription') }}</p>
            </ion-text>

            <!-- Products Section -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ t('marketplace.myProducts') }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <!-- Loading State -->
                <div
                  v-if="isLoadingProducts"
                  class="ion-text-center ion-padding"
                >
                  <ion-spinner name="crescent" />
                  <p>{{ t('common.loading') }}</p>
                </div>

                <!-- Error State -->
                <ion-text
                  v-else-if="productsError"
                  color="danger"
                  class="ion-padding"
                >
                  <p>{{ productsError }}</p>
                </ion-text>

                <!-- Products List -->
                <ion-list v-else-if="products.length > 0" lines="none">
                  <ion-item
                    v-for="product in products"
                    :key="product.id"
                    class="listing-item"
                  >
                    <ion-label>
                      <h3>{{ product.title }}</h3>
                      <p>
                        {{ product.price_currency }}
                        {{ product.price.toFixed(2) }}
                      </p>
                    </ion-label>
                    <ion-button
                      slot="end"
                      fill="clear"
                      size="small"
                      :aria-label="t('common.edit')"
                      @click="editProduct(product.id)"
                    >
                      <ion-icon slot="icon-only" :icon="icons.create" />
                    </ion-button>
                    <ion-button
                      slot="end"
                      fill="clear"
                      size="small"
                      color="danger"
                      :aria-label="t('common.delete')"
                      @click="confirmDeleteProduct(product)"
                    >
                      <ion-icon slot="icon-only" :icon="icons.trash" />
                    </ion-button>
                  </ion-item>
                </ion-list>

                <!-- Empty State -->
                <div v-else class="empty-state ion-text-center ion-padding">
                  <ion-icon
                    :icon="icons.bag"
                    color="medium"
                    class="empty-icon"
                  />
                  <ion-text color="medium">
                    <p>{{ t('common.noListings') }}</p>
                  </ion-text>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Wanted Items Section -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ t('marketplace.myWantedItems') }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <!-- Loading State -->
                <div
                  v-if="isLoadingWanted"
                  class="ion-text-center ion-padding"
                >
                  <ion-spinner name="crescent" />
                  <p>{{ t('common.loading') }}</p>
                </div>

                <!-- Error State -->
                <ion-text
                  v-else-if="wantedError"
                  color="danger"
                  class="ion-padding"
                >
                  <p>{{ wantedError }}</p>
                </ion-text>

                <!-- Wanted Items List -->
                <ion-list v-else-if="wantedItems.length > 0" lines="none">
                  <ion-item
                    v-for="item in wantedItems"
                    :key="item.id"
                    class="listing-item"
                  >
                    <ion-label>
                      <h3>{{ item.title }}</h3>
                    </ion-label>
                    <ion-button
                      slot="end"
                      fill="clear"
                      size="small"
                      :aria-label="t('common.edit')"
                      @click="editWantedItem(item.id)"
                    >
                      <ion-icon slot="icon-only" :icon="icons.create" />
                    </ion-button>
                    <ion-button
                      slot="end"
                      fill="clear"
                      size="small"
                      color="danger"
                      :aria-label="t('common.delete')"
                      @click="confirmDeleteWanted(item)"
                    >
                      <ion-icon slot="icon-only" :icon="icons.trash" />
                    </ion-button>
                  </ion-item>
                </ion-list>

                <!-- Empty State -->
                <div v-else class="empty-state ion-text-center ion-padding">
                  <ion-icon
                    :icon="icons.search"
                    color="medium"
                    class="empty-icon"
                  />
                  <ion-text color="medium">
                    <p>{{ t('common.noListings') }}</p>
                  </ion-text>
                </div>
              </ion-card-content>
            </ion-card>
      </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { alertController } from '@ionic/vue'
import type { Product } from '../../shared/types/models/MarketplaceProduct'
import type { Wanted } from '../../shared/types/models/MarketplaceWanted'

const { $i18n } = useNuxtApp()
const t = $i18n.t
const localePath = useLocalePath()
const router = useRouter()
const icons = useIcons()
const toast = useToast()

const {
  products,
  wantedItems,
  isLoadingProducts,
  isLoadingWanted,
  productsError,
  wantedError,
  fetchAll,
  deleteProduct,
  deleteWantedItem
} = useMyListings()

const editProduct = (productId: string) => {
  router.push(localePath(`/create/product?edit=${productId}`))
}

const editWantedItem = (itemId: string) => {
  router.push(localePath(`/create/wanted?edit=${itemId}`))
}

const confirmDeleteProduct = async (product: Product) => {
  const alert = await alertController.create({
    header: t('common.confirm'),
    message: t('marketplace.confirm_delete_product', {
      title: product.title
    }),
    buttons: [
      {
        text: t('common.cancel'),
        role: 'cancel'
      },
      {
        text: t('common.delete'),
        role: 'destructive',
        handler: async () => {
          try {
            await deleteProduct(product.id)
            await toast.showSuccess(t('marketplace.product_deleted'))
          } catch (error) {
            await toast.showError(
              error instanceof Error
                ? error.message
                : t('errors.delete_failed')
            )
          }
        }
      }
    ]
  })

  await alert.present()
}

const confirmDeleteWanted = async (item: Wanted) => {
  const alert = await alertController.create({
    header: t('common.confirm'),
    message: t('marketplace.confirm_delete_wanted', {
      title: item.title
    }),
    buttons: [
      {
        text: t('common.cancel'),
        role: 'cancel'
      },
      {
        text: t('common.delete'),
        role: 'destructive',
        handler: async () => {
          try {
            await deleteWantedItem(item.id)
            await toast.showSuccess(t('marketplace.wanted_item_deleted'))
          } catch (error) {
            await toast.showError(
              error instanceof Error
                ? error.message
                : t('errors.delete_failed')
            )
          }
        }
      }
    ]
  })

  await alert.present()
}

onMounted(() => {
  fetchAll()
})
</script>

<style scoped>
ion-card {
  margin-bottom: 16px;
}

.listing-item {
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.listing-item ion-label h3 {
  font-weight: 600;
  margin-bottom: 4px;
}

.listing-item ion-label p {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.empty-state {
  padding: 2rem 0;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

ion-spinner {
  display: block;
  margin: 0 auto 1rem;
}
</style>