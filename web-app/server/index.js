import 'dotenv/config'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const app = express()
const port = process.env.PORT || 3001
const cacheDuration = 24 * 60 * 60 * 1000 // Cache expiration duration set to 24 hours

// Convert file URL to absolute path for file-system operations in ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CACHE_FILE_PATH = path.join(__dirname, 'rate_cache.json')

// Explicit dictionary of the 33 major currencies officially supported by freecurrencyapi.com
const SUPPORTED_CURRENCIES = new Set([
  'EUR', 'USD', 'JPY', 'BGN', 'CZK', 'DKK', 'GBP', 'HUF', 'PLN', 'RON', 
  'SEK', 'CHF', 'ISK', 'NOK', 'HRK', 'RUB', 'TRY', 'AUD', 'BRL', 'CAD', 
  'CNY', 'HKD', 'IDR', 'ILS', 'INR', 'KRW', 'MXN', 'MYR', 'NZD', 'PHP', 
  'SGD', 'THB', 'ZAR'
])

/**
 * Reads and parses the persistent JSON file cache from the disk.
 * Returns an empty object if the file does not exist or is empty.
 */
function readDiskCache() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const fileData = fs.readFileSync(CACHE_FILE_PATH, 'utf-8').trim()
      if (!fileData) return {}
      return JSON.parse(fileData)
    }
  } catch (error) {
    console.error('Disk cache read failed:', error.message)
  }
  return {}
}

/**
 * Writes the updated cache mapping back to the persistent JSON file.
 */
function writeDiskCache(cacheObject) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheObject, null, 2), 'utf-8')
  } catch (error) {
    console.error('Disk cache write failed:', error.message)
  }
}

/**
 * GET /api/rates/:base
 * Retrieves daily exchange rates for the requested base currency.
 * Prioritizes local disk cache before executing external API requests.
 */
app.get('/api/rates/:base', async (req, res) => {
  const base = req.params.base.toUpperCase()
  const apiKey = process.env.FREECURRENCY_API_KEY

  // Validate the presence of the required system API key
  if (!apiKey) {
    console.error("BACKEND CONFIG ERROR: FREECURRENCY_API_KEY is missing in your .env file!")
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' })
  }

  // Validate currency code length and provider support scope
  if (base.length !== 3 || !SUPPORTED_CURRENCIES.has(base)) {
    return res.status(400).json({ error: 'Unsupported or invalid three-letter currency code.' })
  }

  // Check disk cache freshness
  const fileCache = readDiskCache()
  const cachedRecord = fileCache[base]

  if (cachedRecord && Date.now() - cachedRecord.savedAt < cacheDuration) {
    return res.json(cachedRecord.data)
  }

  try {
    console.log(`Fetching rates via Axios for base: ${base}`)
    
    // Request parameters explicitly mapped to avoid headers or string template conversion failures
    const response = await axios.get('https://api.freecurrencyapi.com/v1/latest', {
      params: {
        apikey: apiKey.trim(),
        base_currency: base
      },
      timeout: 10000 // 10-second request timeout threshold boundary
    })

    const payload = response.data
    
    // Verify payload integrity and structure schema
    if (!payload || !payload.data) {
      console.log("Raw API Response received:", payload)
      throw new Error('Malformed or empty payload returned from API provider.')
    }

    // Standardize data layout mapping for UI component consumption
    const result = {
      base: base,
      rates: payload.data,
      updatedAt: new Date().toUTCString(), 
    }
    
    // Update local cache records and save to disk storage path
    fileCache[base] = { data: result, savedAt: Date.now() }
    writeDiskCache(fileCache)

    return res.json(result)

  } catch (error) {
    // Resilient fallback: if the live API call drops, serve expired disk cache data as a recovery measure
    if (cachedRecord) {
      console.warn(`API network drop. Serving historical cache storage safely for: ${base}`)
      return res.json(cachedRecord.data)
    }
    
    console.error("CRITICAL AXIOS FETCH ERROR:", error.response?.data || error.message)
    return res.status(502).json({ error: 'Unable to load currency rates.' })
  }
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
