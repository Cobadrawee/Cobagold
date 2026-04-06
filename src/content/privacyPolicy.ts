/** Privacy policy copy — RU (source) + EN for locale toggle */

export type PrivacyPrinciple = { title: string; body: string }

export type PrivacyPolicyContent = {
  documentTitle: string
  heroTitle: string
  heroLead: string
  lastUpdated: string
  principlesTitle: string
  principlesIntro: string
  principles: PrivacyPrinciple[]
  policySectionTitle: string
  policyIntro: string
  policyMeasuresIntro: string
  policyMeasures: string[]
  policyDisclaimer: string
  rightsTitle: string
  rightsIntro: string
  rightsItems: string[]
  rightsContact: string
  transfersTitle: string
  transfersIntro: string
  transfersItems: string[]
  changesTitle: string
  changesBody: string
  backHome: string
}

export const privacyPolicyRu: PrivacyPolicyContent = {
  documentTitle: 'Политика конфиденциальности — COBA',
  heroTitle: 'Политика конфиденциальности',
  heroLead:
    'Ваша конфиденциальность имеет основополагающее значение для наших отношений. Узнайте, как мы собираем, используем и защищаем вашу личную информацию.',
  lastUpdated: 'Последнее обновление: 26 февраля 2026',
  principlesTitle: 'Наши принципы конфиденциальности',
  principlesIntro:
    'Основные ценности, которые определяют, как мы обрабатываем вашу личную информацию.',
  principles: [
    {
      title: 'Защита данных',
      body: 'Мы внедряем передовые меры безопасности для защиты вашей личной информации.',
    },
    {
      title: 'Прозрачность',
      body: 'Мы сообщаем, если мы собираем какие-то данные и как мы их используем.',
    },
    {
      title: 'Безопасное хранение',
      body: 'Ваши данные зашифрованы и хранятся с использованием протоколов безопасности корпоративного уровня.',
    },
    {
      title: 'Контроль пользователя',
      body: 'Вы имеете полный контроль над своими данными и можете запросить их удаление в любое время.',
    },
  ],
  policySectionTitle: 'Политика конфиденциальности',
  policyIntro:
    'Мы не собираем, и не используем, мы защищаем вашу информацию при посещении нашего веб-сайта, использовании наших услуг или взаимодействии с нашей платформой.',
  policyMeasuresIntro: 'Мы применяем соответствующие меры безопасности для защиты вашей личной информации.',
  policyMeasures: [
    'Шифрование данных при передаче и хранении',
    'Многофакторная аутентификация для доступа',
    'Регулярный аудит безопасности и тестирование на проникновение',
    'Процедуры реагирования на инциденты и уведомления о нарушениях',
  ],
  policyDisclaimer:
    'Однако ни один метод передачи через Интернет или электронного хранения не является на 100% безопасным. Хотя мы стремимся использовать коммерчески приемлемые средства для защиты информации, мы со своей стороны можем гарантировать ее абсолютную безопасность.',
  rightsTitle: 'Ваши права и выбор',
  rightsIntro: 'У вас есть следующие права в отношении вашей личной информации:',
  rightsItems: [
    'Доступ: Запрос доступа к вашей личной информации',
    'Исправление: Запрос исправления неточной информации',
    'Удаление: Запрос удаления вашей личной информации',
    'Переносимость: Запрос передачи ваших данных другому сервису',
    'Ограничение: Запрос ограничения обработки',
    'Возражение: Возражение против определенных типов обработки',
    'Отзыв согласия: Отзыв согласия на обработку данных',
  ],
  rightsContact:
    'Чтобы воспользоваться этими правами, пожалуйста, используйте контактную форму на нашем веб-сайте. Мы ответим на ваш запрос в течение 30 дней.',
  transfersTitle: 'Международные передачи данных',
  transfersIntro:
    'Ваша информация может быть передана и обработана в странах, отличных от вашей страны проживания. Мы обеспечиваем наличие соответствующих гарантий для таких передач, включая:',
  transfersItems: [
    'Решения о достаточности соответствующих органов',
    'Стандартные договорные оговорки',
    'Обязательные корпоративные правила',
    'Схемы сертификации',
  ],
  changesTitle: 'Изменения в политике конфиденциальности',
  changesBody:
    'Мы можем обновлять эту Политику конфиденциальности время от времени. Мы уведомим вас о любых существенных изменениях, разместив новую политику на нашем веб-сайте и обновив дату «Последнее обновление». Ваше дальнейшее использование наших услуг после таких изменений означает принятие обновленной политики.',
  backHome: 'На главную',
}

export const privacyPolicyEn: PrivacyPolicyContent = {
  documentTitle: 'Privacy Policy — COBA',
  heroTitle: 'Privacy policy',
  heroLead:
    'Your privacy is fundamental to our relationship. Learn how we collect, use, and protect your personal information.',
  lastUpdated: 'Last updated: February 26, 2026',
  principlesTitle: 'Our privacy principles',
  principlesIntro: 'Core values that guide how we handle your personal information.',
  principles: [
    {
      title: 'Data protection',
      body: 'We implement advanced security measures to protect your personal information.',
    },
    {
      title: 'Transparency',
      body: 'We tell you when we collect data and how we use it.',
    },
    {
      title: 'Secure storage',
      body: 'Your data is encrypted and stored using enterprise-grade security protocols.',
    },
    {
      title: 'User control',
      body: 'You have full control over your data and may request deletion at any time.',
    },
  ],
  policySectionTitle: 'Privacy policy',
  policyIntro:
    'We do not collect or use your information in ways that compromise it; we protect your information when you visit our website, use our services, or interact with our platform.',
  policyMeasuresIntro: 'We apply appropriate security measures to protect your personal information.',
  policyMeasures: [
    'Encryption of data in transit and at rest',
    'Multi-factor authentication for access',
    'Regular security audits and penetration testing',
    'Incident response procedures and breach notifications',
  ],
  policyDisclaimer:
    'No method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect information, we cannot guarantee absolute security.',
  rightsTitle: 'Your rights and choices',
  rightsIntro: 'You have the following rights regarding your personal information:',
  rightsItems: [
    'Access: Request access to your personal information',
    'Rectification: Request correction of inaccurate information',
    'Erasure: Request deletion of your personal information',
    'Portability: Request transfer of your data to another service',
    'Restriction: Request restriction of processing',
    'Objection: Object to certain types of processing',
    'Withdraw consent: Withdraw consent to processing',
  ],
  rightsContact:
    'To exercise these rights, please use the contact form on our website. We will respond within 30 days.',
  transfersTitle: 'International data transfers',
  transfersIntro:
    'Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards for such transfers, including:',
  transfersItems: [
    'Adequacy decisions by relevant authorities',
    'Standard contractual clauses',
    'Binding corporate rules',
    'Certification schemes',
  ],
  changesTitle: 'Changes to this privacy policy',
  changesBody:
    'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the “Last updated” date. Your continued use of our services after such changes constitutes acceptance of the updated policy.',
  backHome: 'Back to home',
}
