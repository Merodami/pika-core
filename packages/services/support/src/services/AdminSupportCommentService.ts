import type { ICacheService } from '@pika/redis'
import type {
  CreateSupportCommentDTO,
  SupportCommentDomain,
  UpdateSupportCommentDTO,
} from '@pika/sdk'
import { SupportCommentMapper } from '@pika/sdk'
import { ErrorFactory, logger } from '@pika/shared'
import type { PaginatedResult, ParsedIncludes } from '@pika/types'

import type {
  CommentSearchParams,
  CreateSupportCommentInput,
  ISupportCommentRepository,
  UpdateSupportCommentInput,
} from '../repositories/SupportCommentRepository.js'

export interface IAdminSupportCommentService {
  getAllComments(
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain[]>
  getCommentsByProblemId(
    params: CommentSearchParams,
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<SupportCommentDomain>>
  createInternalComment(
    adminUserId: string,
    data: CreateSupportCommentDTO & { isInternal?: boolean },
  ): Promise<SupportCommentDomain>
  updateAnyComment(
    id: string,
    data: UpdateSupportCommentDTO,
  ): Promise<SupportCommentDomain>
  deleteAnyComment(id: string): Promise<void>
}

export class AdminSupportCommentService implements IAdminSupportCommentService {
  constructor(
    private readonly repository: ISupportCommentRepository,
    private readonly cache: ICacheService,
  ) {}

  /**
   * Get all comments in the system
   */
  async getAllComments(
    parsedIncludes?: ParsedIncludes,
  ): Promise<SupportCommentDomain[]> {
    logger.info('Admin fetching all comments')

    // TODO: Add pagination support
    return this.repository.findAll(parsedIncludes)
  }

  /**
   * Get all comments for a problem including internal notes
   */
  async getCommentsByProblemId(
    params: CommentSearchParams,
    parsedIncludes?: ParsedIncludes,
  ): Promise<PaginatedResult<SupportCommentDomain>> {
    logger.info('Admin fetching comments for problem', {
      problemId: params.problemId,
    })

    // Admin sees all comments including internal ones
    return this.repository.findByProblemId(params, parsedIncludes)
  }

  /**
   * Create internal comment/note
   */
  async createInternalComment(
    adminUserId: string,
    data: CreateSupportCommentDTO & { isInternal?: boolean },
  ): Promise<SupportCommentDomain> {
    logger.info('Admin creating internal comment', {
      adminUserId,
      problemId: data.problemId,
      isInternal: data.isInternal,
    })

    const input: CreateSupportCommentInput = {
      problemId: data.problemId,
      userId: adminUserId,
      content: data.content,
      isInternal: data.isInternal ?? true,
    }

    const comment = await this.repository.create(input)

    // Clear cache for this problem
    await this.cache.del(`problem-comments:${data.problemId}`)
    await this.cache.del(`admin-problem-comments:${data.problemId}`)

    return comment
  }

  /**
   * Update any comment as admin
   */
  async updateAnyComment(
    id: string,
    data: UpdateSupportCommentDTO,
  ): Promise<SupportCommentDomain> {
    logger.info('Admin updating comment', { id })

    const existingComment = await this.repository.findById(id)

    if (!existingComment) {
      throw ErrorFactory.resourceNotFound('Comment', id)
    }

    const input: UpdateSupportCommentInput =
      SupportCommentMapper.fromUpdateDTO(data)

    const updated = await this.repository.update(id, input)

    // Clear cache
    await this.cache.del(`comment:${id}`)
    await this.cache.del(`problem-comments:${existingComment.problemId}`)
    await this.cache.del(`admin-problem-comments:${existingComment.problemId}`)

    return updated
  }

  /**
   * Delete any comment as admin
   */
  async deleteAnyComment(id: string): Promise<void> {
    logger.info('Admin deleting comment', { id })

    const comment = await this.repository.findById(id)

    if (!comment) {
      throw ErrorFactory.resourceNotFound('Comment', id)
    }

    await this.repository.delete(id)

    // Clear cache
    await this.cache.del(`comment:${id}`)
    await this.cache.del(`problem-comments:${comment.problemId}`)
    await this.cache.del(`admin-problem-comments:${comment.problemId}`)
  }
}
