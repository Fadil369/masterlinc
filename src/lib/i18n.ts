import type { Language } from './types'

export const translations = {
  en: {
    title: 'MASTERLINC',
    subtitle: 'Agent Orchestration Dashboard',
    tabs: {
      dashboard: 'Dashboard',
      agents: 'Agents',
      messages: 'Messages',
      workflows: 'Workflows'
    },
    dashboard: {
      systemHealth: 'System Health',
      agentMetrics: 'Agent Metrics',
      recentActivity: 'Recent Activity',
      totalAgents: 'Total Agents',
      onlineAgents: 'Online',
      offlineAgents: 'Offline',
      messagesProcessed: 'Messages Processed',
      activeWorkflows: 'Active Workflows'
    },
    agents: {
      title: 'Agent Registry',
      searchPlaceholder: 'Search agents...',
      filterAll: 'All Categories',
      filterHealthcare: 'Healthcare',
      filterBusiness: 'Business',
      filterAutomation: 'Automation',
      filterContent: 'Content',
      filterSecurity: 'Security',
      status: 'Status',
      capabilities: 'Capabilities',
      endpoint: 'Endpoint',
      lastSeen: 'Last Seen',
      never: 'Never',
      priority: 'Priority',
      languages: 'Languages'
    },
    messages: {
      title: 'Message Log',
      sendMessage: 'Send Message',
      from: 'From',
      to: 'To',
      content: 'Content',
      timestamp: 'Timestamp',
      status: 'Status',
      clearLog: 'Clear Log',
      noMessages: 'No messages yet',
      delivered: 'Delivered',
      pending: 'Pending',
      failed: 'Failed'
    },
    workflows: {
      title: 'Workflows',
      createWorkflow: 'Create Workflow',
      runWorkflow: 'Run',
      stopWorkflow: 'Stop',
      workflowName: 'Workflow Name',
      workflowDescription: 'Description (optional)',
      steps: 'Steps',
      addStep: 'Add step',
      removeStep: 'Remove',
      stepAgent: 'Agent',
      stepAction: 'Action',
      stepParams: 'Parameters (JSON)',
      stepTimeout: 'Timeout (sec)',
      status: 'Status',
      noWorkflows: 'No workflows created',
      running: 'Running',
      completed: 'Completed',
      failedStatus: 'Failed',
      pending: 'Pending'
    },
    status: {
      online: 'Online',
      offline: 'Offline',
      degraded: 'Degraded',
      maintenance: 'Maintenance',
      healthy: 'Healthy',
      unhealthy: 'Unhealthy'
    },
    actions: {
      refresh: 'Refresh',
      send: 'Send',
      create: 'Create',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View Details'
    },
    errors: {
      invalidJson: 'Invalid JSON. Please fix the payload and try again.'
    },
    time: {
      now: 'just now',
      secondsAgo: 'seconds ago',
      minutesAgo: 'minutes ago',
      hoursAgo: 'hours ago',
      daysAgo: 'days ago'
    }
  },
  ar: {
    title: 'ماسترلينك',
    subtitle: 'لوحة تحكم تنسيق الوكلاء',
    tabs: {
      dashboard: 'لوحة التحكم',
      agents: 'الوكلاء',
      messages: 'الرسائل',
      workflows: 'سير العمل'
    },
    dashboard: {
      systemHealth: 'صحة النظام',
      agentMetrics: 'مقاييس الوكلاء',
      recentActivity: 'النشاط الأخير',
      totalAgents: 'إجمالي الوكلاء',
      onlineAgents: 'متصل',
      offlineAgents: 'غير متصل',
      messagesProcessed: 'الرسائل المعالجة',
      activeWorkflows: 'سير العمل النشط'
    },
    agents: {
      title: 'سجل الوكلاء',
      searchPlaceholder: 'البحث عن وكلاء...',
      filterAll: 'جميع الفئات',
      filterHealthcare: 'الرعاية الصحية',
      filterBusiness: 'الأعمال',
      filterAutomation: 'الأتمتة',
      filterContent: 'المحتوى',
      filterSecurity: 'الأمان',
      status: 'الحالة',
      capabilities: 'القدرات',
      endpoint: 'نقطة النهاية',
      lastSeen: 'آخر ظهور',
      never: 'أبداً',
      priority: 'الأولوية',
      languages: 'اللغات'
    },
    messages: {
      title: 'سجل الرسائل',
      sendMessage: 'إرسال رسالة',
      from: 'من',
      to: 'إلى',
      content: 'المحتوى',
      timestamp: 'الوقت',
      status: 'الحالة',
      clearLog: 'مسح السجل',
      noMessages: 'لا توجد رسائل بعد',
      delivered: 'تم التسليم',
      pending: 'قيد الانتظار',
      failed: 'فشل'
    },
    workflows: {
      title: 'سير العمل',
      createWorkflow: 'إنشاء سير عمل',
      runWorkflow: 'تشغيل',
      stopWorkflow: 'إيقاف',
      workflowName: 'اسم سير العمل',
      workflowDescription: 'الوصف (اختياري)',
      steps: 'الخطوات',
      addStep: 'إضافة خطوة',
      removeStep: 'حذف',
      stepAgent: 'الوكيل',
      stepAction: 'الإجراء',
      stepParams: 'المعلمات (JSON)',
      stepTimeout: 'المهلة (ثانية)',
      status: 'الحالة',
      noWorkflows: 'لم يتم إنشاء سير عمل',
      running: 'قيد التشغيل',
      completed: 'مكتمل',
      failedStatus: 'فشل',
      pending: 'قيد الانتظار'
    },
    status: {
      online: 'متصل',
      offline: 'غير متصل',
      degraded: 'متدهور',
      maintenance: 'صيانة',
      healthy: 'صحي',
      unhealthy: 'غير صحي'
    },
    actions: {
      refresh: 'تحديث',
      send: 'إرسال',
      create: 'إنشاء',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      view: 'عرض التفاصيل'
    },
    errors: {
      invalidJson: 'تنسيق JSON غير صالح. يرجى تصحيح المحتوى والمحاولة مرة أخرى.'
    },
    time: {
      now: 'الآن',
      secondsAgo: 'ثانية مضت',
      minutesAgo: 'دقيقة مضت',
      hoursAgo: 'ساعة مضت',
      daysAgo: 'يوم مضى'
    }
  }
}

export function useTranslation(language: Language) {
  return translations[language]
}
