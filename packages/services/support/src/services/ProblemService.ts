import { REDIS_DEFAULT_TTL } from '@pika/environment'
import type { ICacheService } from '@pika/redis'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import type {
  CreateProblemDTO,
  ProblemDomain,
  UpdateProblemDTO,
} from '@pika/sdk'
import { ProblemMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { ParsedIncludes } from '@pika/types'

import type {
  CreateProblemInput,
  IProblemRepository,
  ProblemSearchParams,
  UpdateProblemInput,
} from '../repositories/ProblemRepository.js'

export interface IProblemService {
  getAllProblems(params: ProblemSearchParams): Promise<{
    data: ProblemDomain[]
    pagination: any
  }>
  searchProblems(params: ProblemSearchParams): Promise<{
    data: ProblemDomain[]
    pagination: any
  }>
  getUserProblems(params: ProblemSearchParams): Promise<{
    data: ProblemDomain[]
    pagination: any
  }>
  getProblemById(
    id: string,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain>
  getProblemsByUserId(userId: string): Promise<ProblemDomain[]>
  createProblem(data: CreateProblemDTO): Promise<ProblemDomain>
  updateProblem(
    id: string,
    data: UpdateProblemDTO,
    parsedIncludes?: ParsedIncludes,
  ): Promise<ProblemDomain>
  deleteProblem(id: string): Promise<void>
}

export class ProblemService implements IProblemService {
  constructor(
    private readonly repository: IProblemRepository,
    private readonly cache: ICacheService,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'problems-list',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllProblems(params: ProblemSearchParams) {
    logger.info('Fetching all problems', { params })

    return this.repository.findAll(params)
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'problems-search',
    keyGenerator: httpRequestKeyGenerator,
  })
  async searchProblems(params: ProblemSearchParams) {
    logger.info('Searching problems', { params })

    return this.repository.findAll(params)
  }

  async getProblemById(id: string, parsedIncludes?: ParsedIncludes) {
    logger.info('Fetching problem by id', { id })

    const problem = await this.repository.findById(id, parsedIncludes)

    if (!problem) {
      throw ErrorFactory.resourceNotFound('Problem', id)
    }

    return problem
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user-problems-paginated',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserProblems(params: ProblemSearchParams) {
    logger.info('Fetching user problems with pagination', { params })

    return this.repository.findAll(params)
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'problems-by-user',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getProblemsByUserId(userId: string) {
    logger.info('Fetching problems by user id', { userId })

    return this.repository.findByUserId(userId)
  }

  async createProblem(data: CreateProblemDTO) {
    logger.info('Creating new problem', {
      title: data.title,
      userId: data.userId,
    })

    // Convert DTO to domain
    const domainData = ProblemMapper.fromCreateDTO(data)

    const createInput: CreateProblemInput = {
      userId: domainData.userId!,
      title: domainData.title!,
      description: domainData.description!,
      priority: domainData.priority,
    }

    const problem = await this.repository.create(createInput)

    // Invalidate cache
    await this.cache.delPattern('problems-list:*')
    await this.cache.delPattern(`problems-by-user:${problem.userId}:*`)

    return problem
  }

  async updateProblem(
    id: string,
    data: UpdateProblemDTO,
    parsedIncludes?: ParsedIncludes,
  ) {
    logger.info('Updating problem', { id })

    // Check if problem exists
    const existingProblem = await this.repository.findById(id)

    if (!existingProblem) {
      throw ErrorFactory.resourceNotFound('Problem', id)
    }

    // Convert DTO to domain
    const domainData = ProblemMapper.fromUpdateDTO(data)

    const updateInput: UpdateProblemInput = {
      title: domainData.title,
      description: domainData.description,
      status: domainData.status,
      priority: domainData.priority,
      type: domainData.type,
      assignedTo: domainData.assignedTo,
      files: domainData.files,
      resolvedAt: domainData.resolvedAt,
    }

    const problem = await this.repository.update(
      id,
      updateInput,
      parsedIncludes,
    )

    // Invalidate cache
    await this.cache.delPattern('problems-list:*')
    await this.cache.delPattern(`problems-by-user:${existingProblem.userId}:*`)

    return problem
  }

  async deleteProblem(id: string) {
    logger.info('Deleting problem', { id })

    // Check if problem exists
    const problem = await this.repository.findById(id)

    if (!problem) {
      throw ErrorFactory.resourceNotFound('Problem', id)
    }

    await this.repository.delete(id)

    // Invalidate cache
    await this.cache.delPattern('problems-list:*')
    await this.cache.delPattern(`problems-by-user:${problem.userId}:*`)
  }
}
