import { useState, useCallback } from 'react'
import { logger } from '../lib/logger'

interface RequestOptions extends RequestInit {
  timeout?: number
}

interface ApiError extends Error {
  status?: number
  data?: any
}

export function useApiClient(baseUrl?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const request = useCallback(async <T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T | null> => {
    const { timeout = 10000, ...fetchOptions } = options
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint

    setLoading(true)
    setError(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      logger.debug('API Request', { url, method: options.method || 'GET' })

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const apiError: ApiError = new Error(
          errorData.message || `HTTP Error ${response.status}`
        )
        apiError.status = response.status
        apiError.data = errorData

        throw apiError
      }

      const data = await response.json()
      logger.debug('API Response', { url, status: response.status })
      
      setLoading(false)
      return data as T
    } catch (err) {
      clearTimeout(timeoutId)
      
      const apiError = err as ApiError
      
      if (apiError.name === 'AbortError') {
        apiError.message = 'Request timeout'
      }

      logger.error('API Error', apiError, { url, method: options.method })
      setError(apiError)
      setLoading(false)
      
      return null
    }
  }, [baseUrl])

  const get = useCallback(<T>(endpoint: string, options?: RequestOptions) => {
    return request<T>(endpoint, { ...options, method: 'GET' })
  }, [request])

  const post = useCallback(<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ) => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }, [request])

  const put = useCallback(<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ) => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }, [request])

  const del = useCallback(<T>(endpoint: string, options?: RequestOptions) => {
    return request<T>(endpoint, { ...options, method: 'DELETE' })
  }, [request])

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
  }
}
