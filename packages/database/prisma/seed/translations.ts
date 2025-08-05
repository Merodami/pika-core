import type { PrismaClient } from '@prisma/client'

const INITIAL_LANGUAGES = [
  {
    code: 'es',
    name: 'Español',
    direction: 'ltr',
    isDefault: true,
    isActive: true,
  },
  {
    code: 'en',
    name: 'English',
    direction: 'ltr',
    isDefault: false,
    isActive: true,
  },
  {
    code: 'gn',
    name: 'Guaraní',
    direction: 'ltr',
    isDefault: false,
    isActive: true,
  },
] as const

export async function seedLanguages(prisma: PrismaClient): Promise<void> {
  console.log('🌐 Seeding languages...')

  for (const language of INITIAL_LANGUAGES) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: language,
      create: language,
    })
  }

  console.log('✅ Languages seeded successfully')
}

export async function seedInitialTranslations(
  prisma: PrismaClient,
): Promise<void> {
  console.log('🔤 Seeding initial translations...')

  const translations = [
    // Email translations
    {
      key: 'email.welcome.subject',
      en: 'Welcome to Pika!',
      es: '¡Bienvenido a Pika!',
      gn: 'Tereg̃ua Pika-pe!',
    },
    {
      key: 'email.welcome.greeting',
      en: 'Hello {name}!',
      es: '¡Hola {name}!',
      gn: "Mba'éichapa {name}!",
    },
    {
      key: 'email.welcome.body',
      en: 'Welcome to our fitness platform.',
      es: 'Bienvenido a nuestra plataforma de fitness.',
      gn: 'Tereg̃ua ore plataforma de ejercicio-pe.',
    },

    // Common notifications
    {
      key: 'notification.payment.success',
      en: 'Payment successful',
      es: 'Pago exitoso',
      gn: "Jehepyme'ẽ oĩ porã",
    },
    {
      key: 'notification.payment.failed',
      en: 'Payment failed',
      es: 'Pago fallido',
      gn: "Jehepyme'ẽ ndoikói",
    },

    // Error messages
    {
      key: 'error.not_found',
      en: 'Not found',
      es: 'No encontrado',
      gn: 'Ndojejuhúi',
    },
    {
      key: 'error.unauthorized',
      en: 'Unauthorized',
      es: 'No autorizado',
      gn: 'Ndaikatúi',
    },
    {
      key: 'error.server_error',
      en: 'Server error',
      es: 'Error del servidor',
      gn: 'Servidor jejavy',
    },
  ]

  for (const translation of translations) {
    const { key, en, es, gn } = translation

    // Create translations for each language
    await prisma.translation.upsert({
      where: { key_languageCode: { key, languageCode: 'en' } },
      update: { value: en },
      create: { key, value: en, languageCode: 'en' },
    })

    await prisma.translation.upsert({
      where: { key_languageCode: { key, languageCode: 'es' } },
      update: { value: es },
      create: { key, value: es, languageCode: 'es' },
    })

    await prisma.translation.upsert({
      where: { key_languageCode: { key, languageCode: 'gn' } },
      update: { value: gn },
      create: { key, value: gn, languageCode: 'gn' },
    })
  }

  console.log('✅ Initial translations seeded successfully')
}

export async function seedTranslationData(prisma: PrismaClient): Promise<void> {
  await seedLanguages(prisma)
  await seedInitialTranslations(prisma)
}
