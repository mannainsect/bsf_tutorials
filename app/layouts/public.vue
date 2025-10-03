<template>
  <div>
    <LayoutPublicMenu />
    
    <ion-page id="main-content">
      <LayoutPublicHeader />
      
      <ion-content class="ion-padding">
        <ion-grid fixed>
          <ion-row class="ion-justify-content-center">
            <ion-col size="12" size-md="10" size-lg="8">
              <slot />
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-content>
      
      <LayoutPublicFooter />
    </ion-page>
  </div>
</template>

<script setup lang="ts">
// Components are auto-imported by Nuxt
</script>