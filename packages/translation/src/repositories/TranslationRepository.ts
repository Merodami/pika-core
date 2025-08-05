import type {
  Language,
  Translation,
  UserLanguagePreference,
} from '@prisma/client'
import { type PrismaClient } from '@prisma/client'

export interface ITranslationRepository {
  findByKeyAndLanguage(
    key: string,
    languageCode: string,
  ): Promise<Translation | null>
  findByKeysAndLanguage(
    keys: string[],
    languageCode: string,
  ): Promise<Translation[]>
  create(data: {
    key: string
    value: string
    languageCode: string
    context?: string
    service?: string
  }): Promise<Translation>
  createMany(
    data: Array<{
      key: string
      value: string
      languageCode: string
      context?: string
      service?: string
    }>,
  ): Promise<void>
  upsertMany(
    data: Array<{
      key: string
      value: string
      languageCode: string
      context?: string
      service?: string
    }>,
  ): Promise<void>
  update(id: string, data: Partial<Translation>): Promise<Translation>
  delete(id: string): Promise<void>
  findLanguageByCode(code: string): Promise<Language | null>
  findActiveLanguages(): Promise<Language[]>
  findDefaultLanguage(): Promise<Language | null>
  findUserLanguagePreference(
    userId: string,
  ): Promise<UserLanguagePreference | null>
  setUserLanguagePreference(
    userId: string,
    languageCode: string,
  ): Promise<UserLanguagePreference>
}

export class TranslationRepository implements ITranslationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKeyAndLanguage(
    key: string,
    languageCode: string,
  ): Promise<Translation | null> {
    return this.prisma.translation.findUnique({
      where: {
        key_languageCode: {
          key,
          languageCode,
        },
      },
    })
  }

  async findByKeysAndLanguage(
    keys: string[],
    languageCode: string,
  ): Promise<Translation[]> {
    return this.prisma.translation.findMany({
      where: {
        key: {
          in: keys,
        },
        languageCode,
      },
    })
  }

  async create(data: {
    key: string
    value: string
    languageCode: string
    context?: string
    service?: string
  }): Promise<Translation> {
    return this.prisma.translation.create({
      data,
    })
  }

  async createMany(
    data: Array<{
      key: string
      value: string
      languageCode: string
      context?: string
      service?: string
    }>,
  ): Promise<void> {
    await this.prisma.translation.createMany({
      data,
      skipDuplicates: true,
    })
  }

  async upsertMany(
    data: Array<{
      key: string
      value: string
      languageCode: string
      context?: string
      service?: string
    }>,
  ): Promise<void> {
    // Prisma doesn't have native upsertMany, so we use a transaction
    // This is still more efficient than individual queries
    await this.prisma.$transaction(
      data.map((item) =>
        this.prisma.translation.upsert({
          where: {
            key_languageCode: {
              key: item.key,
              languageCode: item.languageCode,
            },
          },
          create: item,
          update: {
            value: item.value,
            context: item.context,
            service: item.service,
          },
        }),
      ),
    )
  }

  async update(id: string, data: Partial<Translation>): Promise<Translation> {
    return this.prisma.translation.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await this.prisma.translation.delete({
      where: { id },
    })
  }

  async findLanguageByCode(code: string): Promise<Language | null> {
    return this.prisma.language.findUnique({
      where: { code },
    })
  }

  async findActiveLanguages(): Promise<Language[]> {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { isDefault: 'desc' },
    })
  }

  async findDefaultLanguage(): Promise<Language | null> {
    return this.prisma.language.findFirst({
      where: { isDefault: true },
    })
  }

  async findUserLanguagePreference(
    userId: string,
  ): Promise<UserLanguagePreference | null> {
    return this.prisma.userLanguagePreference.findUnique({
      where: { userId },
      include: { language: true },
    })
  }

  async setUserLanguagePreference(
    userId: string,
    languageCode: string,
  ): Promise<UserLanguagePreference> {
    return this.prisma.userLanguagePreference.upsert({
      where: { userId },
      create: {
        userId,
        languageCode,
      },
      update: {
        languageCode,
      },
    })
  }
}
