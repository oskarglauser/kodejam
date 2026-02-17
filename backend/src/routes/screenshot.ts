import { Router, Request, Response } from 'express'
import { chromium } from 'playwright'

export const screenshotRouter = Router()

function validateScreenshotUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return `Invalid URL scheme: ${parsed.protocol} — only http and https are allowed`
    }
    return null
  } catch {
    return 'Invalid URL format'
  }
}

// POST / - Capture a screenshot of a URL
screenshotRouter.post('/', async (req: Request, res: Response) => {
  const { url, width = 1280, height = 800, selector } = req.body

  if (!url) {
    return res.status(400).json({ error: 'url is required' })
  }

  const urlError = validateScreenshotUrl(url)
  if (urlError) {
    return res.status(400).json({ error: urlError })
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage({
      viewport: { width, height },
    })

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait a moment for any animations to settle
    await page.waitForTimeout(1000)

    let screenshotBuffer: Buffer

    if (selector) {
      const element = await page.$(selector)
      if (element) {
        screenshotBuffer = await element.screenshot() as Buffer
      } else {
        screenshotBuffer = await page.screenshot({ fullPage: false }) as Buffer
      }
    } else {
      screenshotBuffer = await page.screenshot({ fullPage: false }) as Buffer
    }

    const base64 = screenshotBuffer.toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    res.json({
      imageBase64: base64,
      dataUrl,
      width,
      height,
    })
  } catch (err: any) {
    res.status(500).json({
      error: `Screenshot failed: ${err.message}`,
    })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
})

// POST /batch - Capture screenshots of multiple URLs
screenshotRouter.post('/batch', async (req: Request, res: Response) => {
  const { urls, width = 1280, height = 800 } = req.body

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls array is required' })
  }

  for (const url of urls) {
    const urlError = validateScreenshotUrl(url)
    if (urlError) {
      return res.status(400).json({ error: `${urlError}: ${url}` })
    }
  }

  let browser
  try {
    browser = await chromium.launch({ headless: true })
    const results = []

    for (const url of urls) {
      const page = await browser.newPage({
        viewport: { width, height },
      })
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(500)

        const screenshotBuffer = await page.screenshot({ fullPage: false }) as Buffer
        const base64 = screenshotBuffer.toString('base64')

        results.push({
          url,
          imageBase64: base64,
          dataUrl: `data:image/png;base64,${base64}`,
          width,
          height,
          success: true,
        })
      } catch (err: any) {
        results.push({
          url,
          success: false,
          error: err.message,
        })
      } finally {
        await page.close()
      }
    }

    res.json({ results })
  } catch (err: any) {
    res.status(500).json({
      error: `Batch screenshot failed: ${err.message}`,
    })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
})
