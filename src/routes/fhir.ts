'use strict'
import express, { Request, Response } from 'express'
import got from 'got'
import URI from 'urijs'
import config from '../lib/config'
import { invalidBundle, invalidBundleMessage } from '../lib/helpers'
import logger from '../lib/winston'
import { generateSimpleIpsBundle } from '../workflows/ipsWorkflows'
import { getResourceTypeEnum, isValidResourceType } from '../lib/validate'

export const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  return res.status(200).send(req.url)
})

router.get('/:resource/:id?/:operation?', async (req, res) => {
  let result = {}
  try {
    let uri = URI(config.get('fhirServer:baseURL'))

    if(isValidResourceType(req.params.resource)) {
      uri = uri.segment(getResourceTypeEnum(req.params.resource).toString())
    } else {
      return res.status(400).json({ message: `Invalid resource type ${req.params.resource}` })
    }

    if (req.params.id && /^[a-zA-Z0-9\-_]+$/.test(req.params.id)) {
      uri = uri.segment(encodeURIComponent(req.params.id))
    } else {
      return res.status(400).json({ message: `Invalid resource id ${req.params.id}` })
    }

    for (const param in req.query) {
      const value = req.query[param]
      if(value && /^[a-zA-Z0-9\-_]+$/.test(value.toString())) {
        uri.addQuery(param, encodeURIComponent(value.toString()))
      } else {
        return res.status(400).json({ message: `Invalid query parameter ${param}=${value}` })
      }
    }

    logger.info(`Getting ${uri.toString()}`)

    const options = {
      username: config.get('fhirServer:username'),
      password: config.get('fhirServer:password'),
    }

    if (
      req.params.id &&
      req.params.resource == 'Patient' &&
      (req.params.id == '$summary' || req.params.operation == '$summary')
    ) {
      // Handle IPS Generation.

      if (req.params.id && req.params.id.length > 0 && req.params.id[0] != '$') {
        // ** If using logical id of the Patient object, create summary from objects directly connected to the patient.
        result = await generateSimpleIpsBundle(req.params.id)
      } else if (req.params.id == '$summary') {
        /**
         * If not using logical id, use the Client Registry to resolve patient identity:
         * 1. Each time a Patient Object is Created or Updated, a copy is sent to the attached CR
         * 2. Assumption: The CR is set up to correctly match the Patient to other sources.
         * 3. When IPS is requested with an identifier query parameter and no logical id parameter:
         *   a. The Client Registry is queried with an $ihe-pix request to get identifiers cross-referenced with the given identifier.
         *   b. All Patient IDs from the SHR are filtered (in query or post-process)
         *   c. Patient data is composed of multiple patient resources, the golden record resource, and all owned data
         * */
      } else {
        // Unsupported Operation
      }
    } else {
      result = await got.get(uri.toString(), options).json()
    }

    res.status(200).json(result)
  } catch (error) {
    return res.status(500).json(error)
  }
})

// Post a bundle of resources
router.post('/', async (req, res) => {
  try {
    logger.info('Received a request to add a bundle of resources')
    const resource = req.body

    // Verify the bundle
    if (invalidBundle(resource)) {
      return res.status(400).json(invalidBundleMessage())
    }

    if (resource.entry.length === 0) {
      return res.status(400).json(invalidBundleMessage())
    }

    const uri = URI(config.get("fhirServer:baseURL"));


    const ret = await got.post(uri.toString(), { json: resource })

    res.status(ret.statusCode).json(ret.body)

  } catch (error) {
    return res.status(500).json(error)
  }
})

// Create resource
router.post('/:resourceType', (req, res) => {
  saveResource(req, res)
})

// Update resource
router.put('/:resourceType/:id', (req, res) => {
  saveResource(req, res)
})

/** Helpers */

async function saveResource(req: any, res: any) {
  const resource = req.body
  const resourceType = req.params.resourceType
  const id = req.params.id
  if (id && !resource.id) {
    resource.id = id
  }

  logger.info('Received a request to add resource type ' + resourceType + ' with id ' + id)

  const ret = await got.post(config.get('fhirServer:baseURL') + '/' + getResourceTypeEnum(resourceType).toString, { json: resource })

  res.status(ret.statusCode).json(ret.body)
}




export default router
