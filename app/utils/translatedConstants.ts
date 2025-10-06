import { useI18n } from '#imports'

export function getTranslatedUnits() {
  const { t } = useI18n()

  return [
    { value: 'piece', label: t('units.piece') },
    { value: 'kg', label: t('units.kg') },
    { value: 'g', label: t('units.g') },
    { value: 'lb', label: t('units.lb') },
    { value: 'oz', label: t('units.oz') },
    { value: 'ton', label: t('units.ton') },
    { value: 'mt', label: t('units.mt') },
    { value: 'l', label: t('units.l') },
    { value: 'ml', label: t('units.ml') },
    { value: 'gal', label: t('units.gal') },
    { value: 'm', label: t('units.m') },
    { value: 'cm', label: t('units.cm') },
    { value: 'mm', label: t('units.mm') },
    { value: 'ft', label: t('units.ft') },
    { value: 'in', label: t('units.in') },
    { value: 'unit', label: t('units.unit') },
    { value: 'box', label: t('units.box') },
    { value: 'pack', label: t('units.pack') },
    { value: 'container', label: t('units.container') },
    { value: 'pallet', label: t('units.pallet') }
  ]
}
