import Fastify from 'fastify'
import { Product, ProductUpdatePayload, priceTracker } from '../services/PriceTrackerService'

export const initRest = () => {
  const fastify = Fastify({
    logger: true
  })
  
  // Hook endpoint for price tracker backend to call
  fastify.post('/price-tracker', async (request, reply) => {
    console.log("Received price tracker hook call");
    const body = request.body;
  
  
    await priceTracker.handleProductUpdate(body as ProductUpdatePayload);
    reply.send()
  })
  
  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) throw err
  })
}