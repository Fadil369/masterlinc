import type { Language } from '@/lib/types'

export type ValidationErrorCode =
  | 'required'
  | 'invalid_type'
  | 'invalid_format'
  | 'too_small'
  | 'too_big'
  | 'custom'
  | 'rate_limited'
  | 'duplicate'
  | 'batch_rollback'

export interface LocalizedText {
  en: string
  ar: string
}

const messages: Record<ValidationErrorCode, LocalizedText> = {
  required: {
    en: 'Required field is missing.',
    ar: 'الحقل مطلوب ومفقود.'
  },
  invalid_type: {
    en: 'Invalid type.',
    ar: 'نوع غير صالح.'
  },
  invalid_format: {
    en: 'Invalid format.',
    ar: 'تنسيق غير صالح.'
  },
  too_small: {
    en: 'Value is too small.',
    ar: 'القيمة صغيرة جداً.'
  },
  too_big: {
    en: 'Value is too large.',
    ar: 'القيمة كبيرة جداً.'
  },
  custom: {
    en: 'Validation failed.',
    ar: 'فشل التحقق.'
  },
  rate_limited: {
    en: 'Rate limit exceeded. Please retry later.',
    ar: 'تم تجاوز حد المعدل. يرجى المحاولة لاحقاً.'
  },
  duplicate: {
    en: 'Duplicate message detected.',
    ar: 'تم اكتشاف رسالة مكررة.'
  },
  batch_rollback: {
    en: 'Batch rejected; no messages were applied.',
    ar: 'تم رفض الدفعة؛ لم يتم تطبيق أي رسائل.'
  }
}

export function tValidation(code: ValidationErrorCode, language: Language): string {
  return messages[code][language]
}

export function tValidationBoth(code: ValidationErrorCode): LocalizedText {
  return messages[code]
}
