import { ProductController } from '@payment/controllers/ProductController.js'
import type { IProductService } from '@payment/services/ProductService.js'
import { paymentPublic } from '@pika/api'
import {
  requireServiceAuth,
  validateBody,
  validateParams,
  validateQuery,
} from '@pika/http'
import { Router } from 'express'

export function createProductRouter(productService: IProductService): Router {
  const router = Router()
  const controller = new ProductController(productService)

  // IMPORTANT: Apply service authentication to ALL routes
  // As per AUTHENTICATION_ARCHITECTURE.md, internal routes need explicit authentication
  router.use(requireServiceAuth())

  // Product management
  router.post(
    '/products',
    validateBody(paymentPublic.CreateProductRequest),
    controller.createProduct,
  )
  router.put(
    '/products/:id',
    validateParams(paymentPublic.ProductIdParam),
    validateBody(paymentPublic.UpdateProductRequest),
    controller.updateProduct,
  )
  router.get(
    '/products',
    validateQuery(paymentPublic.ListProductsQuery),
    controller.listProducts,
  )

  // Price management
  router.post(
    '/prices',
    validateBody(paymentPublic.CreatePriceRequest),
    controller.createPrice,
  )
  router.put(
    '/prices/:id/deactivate',
    validateParams(paymentPublic.PriceIdParam),
    controller.deactivatePrice,
  )
  router.get(
    '/prices',
    validateQuery(paymentPublic.ListPricesQuery),
    controller.listPrices,
  )

  return router
}
