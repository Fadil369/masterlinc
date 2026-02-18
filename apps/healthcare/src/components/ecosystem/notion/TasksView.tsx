import { useState, useEffect } from 'react'
import { notionClient } from '../../../lib/notion-client'

interface Task {
  id: string
  title: string
  status: string
  priority?: string
  dueDate?: string
  assignee?: string
}

export function TasksView({ databaseId }: { databaseId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('todo')

  useEffect(() => {
    loadTasks()
  }, [databaseId, filter])

  async function loadTasks() {
    try {
      setLoading(true)
      const notionFilter = filter !== 'all' ? {
        property: 'Status',
        status: { equals: filter === 'todo' ? 'To Do' : filter === 'in_progress' ? 'In Progress' : 'Done' }
      } : undefined

      const response = await notionClient.queryDatabase(databaseId, notionFilter, [
        { property: 'Priority', direction: 'descending' },
        { property: 'Due Date', direction: 'ascending' }
      ])
      
      const mapped = response.results.map((page: any) => ({
        id: page.id,
        title: page.properties.Name?.title?.[0]?.plain_text || page.properties.Task?.title?.[0]?.plain_text || 'Untitled',
        status: page.properties.Status?.status?.name || 'To Do',
        priority: page.properties.Priority?.select?.name,
        dueDate: page.properties['Due Date']?.date?.start,
        assignee: page.properties.Assignee?.people?.[0]?.name
      }))
      
      setTasks(mapped)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(taskId: string, newStatus: string) {
    try {
      await notionClient.setStatus(taskId, 'Status', newStatus)
      await loadTasks()
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const priorityColors: Record<string, string> = {
    High: 'text-red-600',
    Medium: 'text-yellow-600',
    Low: 'text-green-600'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Tasks</h2>
        <div className="flex gap-2">
          {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'todo' ? 'To Do' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-2 overflow-auto">
          {tasks.map(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {task.priority && (
                        <span className={`flex items-center gap-1 font-medium ${priorityColors[task.priority] || 'text-gray-600'}`}>
                          <span className="material-icons text-sm">flag</span>
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          <span className="material-icons text-sm">event</span>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-sm">person</span>
                          {task.assignee}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  {['To Do', 'In Progress', 'Done'].map(status => (
                    status !== task.status && (
                      <button
                        key={status}
                        onClick={() => updateStatus(task.id, status)}
                        className="text-xs px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                      >
                        {status}
                      </button>
                    )
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
