import { useState, useEffect } from 'react'
import { notionClient } from '../../../lib/notion-client'

interface BillingRecord {
  id: string
  patient: string
  amount: number
  status: string
  date: string
  invoiceNumber?: string
}

export function BillingView({ databaseId }: { databaseId: string }) {
  const [records, setRecords] = useState<BillingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('pending')

  useEffect(() => {
    loadBilling()
  }, [databaseId, filter])

  async function loadBilling() {
    try {
      setLoading(true)
      const notionFilter = filter !== 'all' ? {
        property: 'Status',
        status: { equals: filter.charAt(0).toUpperCase() + filter.slice(1) }
      } : undefined

      const response = await notionClient.queryDatabase(databaseId, notionFilter, [
        { property: 'Date', direction: 'descending' }
      ])
      
      const mapped = response.results.map((page: any) => ({
        id: page.id,
        patient: page.properties.Patient?.relation?.[0]?.id || page.properties['Patient Name']?.rich_text?.[0]?.plain_text || 'Unknown',
        amount: page.properties.Amount?.number || 0,
        status: page.properties.Status?.status?.name || 'Pending',
        date: page.properties.Date?.date?.start || '',
        invoiceNumber: page.properties['Invoice Number']?.rich_text?.[0]?.plain_text
      }))
      
      setRecords(mapped)
    } catch (err) {
      console.error('Failed to load billing:', err)
    } finally {
      setLoading(false)
    }
  }

  const total = records.reduce((sum, r) => sum + r.amount, 0)
  const statusColors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Paid: 'bg-green-100 text-green-800',
    Overdue: 'bg-red-100 text-red-800'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Billing & Invoices</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'paid', 'overdue'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Total {filter !== 'all' ? filter : ''}</p>
            <p className="text-2xl font-bold text-blue-900">SAR {total.toLocaleString()}</p>
          </div>

          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.invoiceNumber || record.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.patient}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      SAR {record.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[record.status] || 'bg-gray-100 text-gray-800'}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
