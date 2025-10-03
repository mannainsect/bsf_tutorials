import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

type TranslateFn = (key: string, params?: Record<string, unknown>) => string

type MessageTree = Record<string, unknown>

const fallbackMessages: MessageTree = {
  validation: {
    listing: {
      titleRequired: 'Title is required',
      titleMax: 'Title must be less than 200 characters',
      categoryRequired: 'Category is required',
      categoryInvalid: "Invalid category '{value}'. Valid categories are: {categories}",
      subcategoryRequired: 'Subcategory is required',
      descriptionRequired: 'Description is required',
      descriptionMax: 'Description must be less than 5000 characters',
      priceRequired: 'Price is required',
      priceType: 'Price must be a number',
      priceMin: 'Price must be 0 or greater',
      priceFinite: 'Price must be a valid number',
      currencyLength: 'Currency code must be exactly 3 characters',
      currencyFormat: 'Currency code must be a valid ISO 4217 code (3 uppercase letters)',
      quantityRequired: 'Quantity is required',
      quantityType: 'Quantity must be a number',
      quantityMin: 'Quantity must be 0 or greater',
      quantityFinite: 'Quantity must be a valid number',
      unitRequired: 'Unit is required',
      unitMax: 'Unit must be less than 20 characters',
      countryLength: 'Country code must be ISO 3166-1 alpha-2',
      countryFormat: 'Invalid country code',
      countryMin: 'At least one country must be selected',
      countryMax: 'Maximum 250 countries allowed',
      additionalInfoMax: 'Additional info must be less than 2000 characters',
      invalidImages: 'Invalid images (max {maxFiles} files, {maxSizeMb}MB each, {maxTotalMb}MB total)',
      invalidSubcategory: 'Invalid subcategory for the selected category'
    },
    profile: {
      nameRequired: 'Name is required'
    }
  }
}

const resolveMessage = (key: string, source: MessageTree = fallbackMessages): string | undefined => {
  const segments = key.split('.')
  let current: unknown = source

  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in current) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}

const interpolate = (message: string, params?: Record<string, unknown>): string => {
  if (!params) {
    return message
  }

  return message.replace(/\{(\w+)\}/g, (_, param) => {
    const value = params[param]
    return value != null ? String(value) : ''
  })
}

export const createFallbackTranslator = (source: MessageTree = fallbackMessages): TranslateFn => {
  return (key, params) => {
    const msg = resolveMessage(key, source)
    if (!msg) {
      return key
    }
    return interpolate(msg, params)
  }
}

const fallbackT = createFallbackTranslator()

const VALID_CATEGORIES = {
  bsf: ['live_larvae', 'whole_dried_larvae', 'defatted_meal', 'eggs', 'neonates', '5dol', 'pupae', 'oil', 'chitin', 'other'],
  frass: ['unprocessed', 'dried', 'ready_to_use', 'other'],
  substrate: ['municipal_waste', 'supermarket_waste', 'fruits_and_vegetables', 'industrial_sidestream', 'manure', 'other'],
  equipment: ['trays', 'bsf_led', 'siever', 'crusher', 'mixer', 'heater', 'ac', 'humidifier', 'dehumidifier', 'dryer', 'oil_press', 'other'],
  services: ['training', 'work', 'consulting', 'sales', 'other']
} as const

export const VALID_CATEGORIES_EXPORT = VALID_CATEGORIES

const VALID_CATEGORY_KEYS = Object.keys(VALID_CATEGORIES) as ReadonlyArray<string>

const createTitleSchema = (t: TranslateFn) => z.string().trim()
  .min(1, t('validation.listing.titleRequired'))
  .max(200, t('validation.listing.titleMax'))

const createCategorySchema = (t: TranslateFn) => z.string().trim()
  .min(1, t('validation.listing.categoryRequired'))
  .refine(
    (val) => VALID_CATEGORY_KEYS.includes(val),
    (val) => ({
      message: t('validation.listing.categoryInvalid', {
        value: val,
        categories: VALID_CATEGORY_KEYS.join(', ')
      })
    })
  )

const createSubcategorySchema = (t: TranslateFn) => z.string().trim()
  .min(1, t('validation.listing.subcategoryRequired'))

const createDescriptionSchema = (t: TranslateFn) => z.string().trim()
  .min(1, t('validation.listing.descriptionRequired'))
  .max(5000, t('validation.listing.descriptionMax'))

const createPriceSchema = (t: TranslateFn) => z.number({
  required_error: t('validation.listing.priceRequired'),
  invalid_type_error: t('validation.listing.priceType')
})
  .nonnegative(t('validation.listing.priceMin'))
  .finite(t('validation.listing.priceFinite'))

const createPriceCurrencySchema = (t: TranslateFn) => z.string()
  .length(3, t('validation.listing.currencyLength'))
  .regex(/^[A-Z]{3}$/, t('validation.listing.currencyFormat'))

const createQuantitySchema = (t: TranslateFn) => z.number({
  required_error: t('validation.listing.quantityRequired'),
  invalid_type_error: t('validation.listing.quantityType')
})
  .nonnegative(t('validation.listing.quantityMin'))
  .finite(t('validation.listing.quantityFinite'))

const createQuantityUnitSchema = (t: TranslateFn) => z.string().trim()
  .min(1, t('validation.listing.unitRequired'))
  .max(20, t('validation.listing.unitMax'))

const createCountriesSchema = (t: TranslateFn) => z.array(
  z.string()
    .length(2, t('validation.listing.countryLength'))
    .regex(/^[A-Z]{2}$/, t('validation.listing.countryFormat'))
)
  .min(1, t('validation.listing.countryMin'))
  .max(250, t('validation.listing.countryMax'))

const createAdditionalInfoSchema = (t: TranslateFn) => z.string().trim()
  .max(2000, t('validation.listing.additionalInfoMax'))
  .optional()

const createContactEmailSchema = (t: TranslateFn) => z.union([
  z.string().trim().email(t('validation.invalidEmail')),
  z.literal('')
]).optional()

const createImageSchema = (t: TranslateFn) => {
  const MAX_FILES = 5
  const MAX_SIZE_PER_FILE = 10 * 1024 * 1024 // 10MB
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  return z.custom<File[]>((files) => {
    if (!files) return true
    if (!Array.isArray(files)) return false

    if (files.length > MAX_FILES) {
      return false
    }

    let totalSize = 0
    for (const file of files) {
      if (!(file instanceof File)) return false
      if (!ALLOWED_TYPES.includes(file.type)) return false
      if (file.size > MAX_SIZE_PER_FILE) return false
      totalSize += file.size
    }

    return totalSize <= MAX_TOTAL_SIZE
  }, {
    message: t('validation.listing.invalidImages', {
      maxFiles: MAX_FILES,
      maxSizeMb: MAX_SIZE_PER_FILE / (1024 * 1024),
      maxTotalMb: MAX_TOTAL_SIZE / (1024 * 1024)
    })
  })
}

const createProductSchemaInternal = (t: TranslateFn) => {
  const schema = z.object({
    title: createTitleSchema(t),
    category: createCategorySchema(t),
    subcategory: createSubcategorySchema(t),
    description: createDescriptionSchema(t),
    price: createPriceSchema(t),
    price_currency: createPriceCurrencySchema(t),
    quantity: createQuantitySchema(t),
    quantity_unit: createQuantityUnitSchema(t),
    countries: createCountriesSchema(t),
    images: createImageSchema(t).optional(),
    additional_info: createAdditionalInfoSchema(t),
    contact_email: createContactEmailSchema(t)
  }).refine(
    (data) => {
      if (!data.category || !data.subcategory) return true
      const validSubcategories = VALID_CATEGORIES[data.category as keyof typeof VALID_CATEGORIES]
      return validSubcategories &&
        validSubcategories.includes(data.subcategory as typeof validSubcategories[number])
    },
    {
      message: t('validation.listing.invalidSubcategory'),
      path: ['subcategory']
    }
  )

  return schema
}

const createWantedSchemaInternal = (t: TranslateFn) => {
  const schema = z.object({
    title: createTitleSchema(t),
    category: createCategorySchema(t),
    subcategory: createSubcategorySchema(t),
    description: createDescriptionSchema(t),
    countries: createCountriesSchema(t),
    additional_info: createAdditionalInfoSchema(t),
    contact_email: createContactEmailSchema(t)
  }).refine(
    (data) => {
      if (!data.category || !data.subcategory) return true
      const validSubcategories = VALID_CATEGORIES[data.category as keyof typeof VALID_CATEGORIES]
      return validSubcategories &&
        validSubcategories.includes(data.subcategory as typeof validSubcategories[number])
    },
    {
      message: t('validation.listing.invalidSubcategory'),
      path: ['subcategory']
    }
  )

  return schema
}

export const productSchema = createProductSchemaInternal(fallbackT)
export const wantedSchema = createWantedSchemaInternal(fallbackT)

export const createProductSchema = createProductSchemaInternal
export const createWantedSchema = createWantedSchemaInternal

export const productValidationSchema = toTypedSchema(productSchema)
export const wantedValidationSchema = toTypedSchema(wantedSchema)

export const createProductValidationSchema = (t: TranslateFn) => toTypedSchema(createProductSchemaInternal(t))
export const createWantedValidationSchema = (t: TranslateFn) => toTypedSchema(createWantedSchemaInternal(t))

export const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', nameKey: 'currencies.USD' },
  { code: 'EUR', symbol: '€', nameKey: 'currencies.EUR' },
  { code: 'GBP', symbol: '£', nameKey: 'currencies.GBP' },
  { code: 'JPY', symbol: '¥', nameKey: 'currencies.JPY' },
  { code: 'CNY', symbol: '¥', nameKey: 'currencies.CNY' },
  { code: 'CAD', symbol: '$', nameKey: 'currencies.CAD' },
  { code: 'AUD', symbol: '$', nameKey: 'currencies.AUD' },
  { code: 'CHF', symbol: 'Fr', nameKey: 'currencies.CHF' },
  { code: 'HKD', symbol: '$', nameKey: 'currencies.HKD' },
  { code: 'SEK', symbol: 'kr', nameKey: 'currencies.SEK' },
  { code: 'NOK', symbol: 'kr', nameKey: 'currencies.NOK' },
  { code: 'DKK', symbol: 'kr', nameKey: 'currencies.DKK' },
  { code: 'NZD', symbol: '$', nameKey: 'currencies.NZD' },
  { code: 'SGD', symbol: '$', nameKey: 'currencies.SGD' },
  { code: 'INR', symbol: '₹', nameKey: 'currencies.INR' },
  { code: 'BRL', symbol: 'R$', nameKey: 'currencies.BRL' },
  { code: 'RUB', symbol: '₽', nameKey: 'currencies.RUB' },
  { code: 'ZAR', symbol: 'R', nameKey: 'currencies.ZAR' },
  { code: 'MXN', symbol: '$', nameKey: 'currencies.MXN' },
  { code: 'KRW', symbol: '₩', nameKey: 'currencies.KRW' }
] as const

export const getCommonCurrencies = (t: TranslateFn) => COMMON_CURRENCIES.map(currency => ({
  code: currency.code,
  symbol: currency.symbol,
  name: t(currency.nameKey)
}))

export const QUANTITY_UNITS = [
  { value: 'piece', labelKey: 'units.piece' },
  { value: 'kg', labelKey: 'units.kg' },
  { value: 'g', labelKey: 'units.g' },
  { value: 'lb', labelKey: 'units.lb' },
  { value: 'oz', labelKey: 'units.oz' },
  { value: 'ton', labelKey: 'units.ton' },
  { value: 'mt', labelKey: 'units.mt' },
  { value: 'l', labelKey: 'units.l' },
  { value: 'ml', labelKey: 'units.ml' },
  { value: 'gal', labelKey: 'units.gal' },
  { value: 'm', labelKey: 'units.m' },
  { value: 'cm', labelKey: 'units.cm' },
  { value: 'ft', labelKey: 'units.ft' },
  { value: 'in', labelKey: 'units.in' },
  { value: 'sqm', labelKey: 'units.sqm' },
  { value: 'sqft', labelKey: 'units.sqft' },
  { value: 'box', labelKey: 'units.box' },
  { value: 'container', labelKey: 'units.container' },
  { value: 'pallet', labelKey: 'units.pallet' },
  { value: 'bag', labelKey: 'units.bag' }
] as const

export const getQuantityUnits = (t: TranslateFn) => QUANTITY_UNITS.map(unit => ({
  value: unit.value,
  label: t(unit.labelKey)
}))
