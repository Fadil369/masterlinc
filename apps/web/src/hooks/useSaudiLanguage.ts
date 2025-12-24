
import { useCallback } from 'react';

export const useSaudiLanguage = () => {
  const saudiDialectMap: Record<string, string> = {
    'السلام عليكم': 'هلا والله',
    'كيف حالك': 'شلونك',
    'أهلاً وسهلاً': 'هلا فيك',
    'تفضل': 'تأمر',
    'شكراً': 'الله يعطيك العافية',
    'عفواً': 'العفو',
    'نعم': 'اي',
    'لا': 'لا',
    'ممكن': 'يمكن',
    'أين': 'وين',
    'متى': 'امتى',
    'كيف': 'شلون',
    'لماذا': 'ليه',
    'ماذا': 'وش',
    'هذا': 'هذا/هذي',
    'ذلك': 'ذاك',
    'موعد': 'ميعاد',
    'اجتماع': 'لقاء',
    'شركة': 'شركة/مؤسسة',
    'خدمة': 'خدمة',
    'منتج': 'منتج',
    'سعر': 'سعر',
    'تقرير': 'تقرير',
    'عميل': 'عميل/زبون',
    'مبيعات': 'مبيعات',
    'دعم': 'دعم/مساعده',
  };

  const translateToSaudiDialect = useCallback((text: string): string => {
    let translated = text;
    
    Object.entries(saudiDialectMap).forEach(([standard, saudi]) => {
      const regex = new RegExp(`\\b${standard}\\b`, 'g');
      translated = translated.replace(regex, saudi);
    });

    if (translated.includes('؟')) {
      translated = translated.replace('؟', '؟ الله يوفقك');
    }

    return translated;
  }, []);

  const formatArabicText = useCallback((text: string): string => {
    return text
      .replace(/\u064A/g, '\u0649') // Convert ي to ى in final position for some cases
      .replace(/الله/g, 'الله'); 
  }, []);

  return {
    translateToSaudiDialect,
    formatArabicText
  };
};
