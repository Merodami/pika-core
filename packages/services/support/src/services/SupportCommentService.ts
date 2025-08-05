import type { ICacheService } from '@pika/redis'
import type {
  CreateSupportCommentDTO,
  SupportCommentDomain,
  UpdateSupportCommentDTO,
} from '@pika/sdk'
import { SupportCommentMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types'

import type {
  CommentSearchParams,
  CreateSupportCommentInput,
  ISupportCommentRepository,
  UpdateSupportCommentInput,
} from '../repositories/SupportCommentRepository.js'

export interface ISupportCommentService {
  getCommentsByProblemId(
    params: CommentSearchParams,
  ): Promise<PaginatedResult<SupportCommentDomain>>
  getCommentById(id: string): Promise<SupportCommentDomain>
  createComment(
    userId: string,
    data: CreateSupportCommentDTO,
  ): Promise<SupportCommentDomain>
  updateComment(
    id: string,
    userId: string,
    data: UpdateSupportCommentDTO,
  ): Promise<SupportCommentDomain>
  deleteComment(id: string, userId: string): Promise<void>
}

export class SupportCommentService implements ISupportCommentService {
  constructor(
    private readonly repository: ISupportCommentRepository,
    private readonly cache: ICacheService,
  ) {}

  async getCommentsByProblemId(
    params: CommentSearchParams,
  ): Promise<PaginatedResult<SupportCommentDomain>> {
    logger.info('Fetching comments for problem', { params })

    return this.repository.findByProblemId(params)
  }

  async getCommentById(id: string): Promise<SupportCommentDomain> {
    logger.info('Fetching comment by id', { id })

    const comment = await this.repository.findById(id)

    if (!comment) {
      throw ErrorFactory.resourceNotFound('SupportComment', id)
    }

    return comment
  }

  async createComment(
    userId: string,
    data: CreateSupportCommentDTO,
  ): Promise<SupportCommentDomain> {
    logger.info('Creating new comment', {
      problemId: data.problemId,
      userId,
      contentLength: data.content.length,
    })

    // Convert DTO to domain
    const domainData = SupportCommentMapper.fromCreateDTO(data)

    const createInput: CreateSupportCommentInput = {
      problemId: domainData.problemId!,
      userId,
      content: domainData.content!,
      isInternal: domainData.isInternal,
    }

    const comment = await this.repository.create(createInput)

    // Invalidate cache for problem comments
    await this.cache.del(`problem-comments:${data.problemId}`)

    return comment
  }

  async updateComment(
    id: string,
    userId: string,
    data: UpdateSupportCommentDTO,
  ): Promise<SupportCommentDomain> {
    logger.info('Updating comment', { id, userId })

    // Check if comment exists and user owns it
    const existingComment = await this.repository.findById(id)

    if (!existingComment) {
      throw ErrorFactory.resourceNotFound('SupportComment', id)
    }

    // Only allow the comment author to update their comment
    if (existingComment.userId !== userId) {
      throw ErrorFactory.forbidden('You can only update your own comments')
    }

    // Convert DTO to domain
    const domainData = SupportCommentMapper.fromUpdateDTO(data)

    const updateInput: UpdateSupportCommentInput = {
      content: domainData.content,
      isInternal: domainData.isInternal,
    }

    const comment = await this.repository.update(id, updateInput)

    // Invalidate cache for problem comments
    await this.cache.del(`problem-comments:${existingComment.problemId}`)

    return comment
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    logger.info('Deleting comment', { id, userId })

    // Check if comment exists and user owns it
    const existingComment = await this.repository.findById(id)

    if (!existingComment) {
      throw ErrorFactory.resourceNotFound('SupportComment', id)
    }

    // Only allow the comment author to delete their comment
    if (existingComment.userId !== userId) {
      throw ErrorFactory.forbidden('You can only delete your own comments')
    }

    await this.repository.delete(id)

    // Invalidate cache for problem comments
    await this.cache.del(`problem-comments:${existingComment.problemId}`)
  }
}
