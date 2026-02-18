export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export class HttpError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

interface RequestOptions {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  timeoutMs?: number
}

export async function httpJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 15000,
  } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })

    const text = await res.text()
    const parsed = text ? safeJsonParse(text) : null

    if (!res.ok) {
      throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status, parsed)
    }

    return parsed as T
  } finally {
    clearTimeout(timer)
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
