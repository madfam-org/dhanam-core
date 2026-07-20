/**
 * Brazilian Portuguese Validation Messages
 * Form validation, input requirements
 */
export const validations = {
  // General
  required: '{{field}} é obrigatório',
  requiredField: 'Este campo é obrigatório',
  invalid: '{{field}} inválido',
  invalidFormat: 'Formato de {{field}} inválido',

  // Email
  emailRequired: 'O e-mail é obrigatório',
  emailInvalid: 'E-mail inválido',
  emailAlreadyExists: 'O e-mail já está cadastrado',
  emailFormat: 'Digite um e-mail válido',

  // Password
  passwordRequired: 'A senha é obrigatória',
  passwordMinLength: 'A senha deve ter pelo menos {{min}} caracteres',
  passwordMaxLength: 'A senha não pode ter mais de {{max}} caracteres',
  passwordUppercase: 'A senha deve ter pelo menos uma maiúscula',
  passwordLowercase: 'A senha deve ter pelo menos uma minúscula',
  passwordNumber: 'A senha deve ter pelo menos um número',
  passwordSpecialChar: 'A senha deve ter pelo menos um caractere especial',
  passwordsDoNotMatch: 'As senhas não coincidem',
  passwordTooWeak: 'A senha é muito fraca',
  passwordCommon: 'Esta senha é muito comum',

  // Name
  nameRequired: 'O nome é obrigatório',
  nameMinLength: 'O nome deve ter pelo menos {{min}} caracteres',
  nameMaxLength: 'O nome não pode ter mais de {{max}} caracteres',
  nameInvalid: 'Nome inválido',

  // Amount
  amountRequired: 'O valor é obrigatório',
  amountInvalid: 'Valor inválido',
  amountPositive: 'O valor deve ser positivo',
  amountNegative: 'O valor deve ser negativo',
  amountMin: 'O valor mínimo é {{min}}',
  amountMax: 'O valor máximo é {{max}}',
  amountRange: 'O valor deve estar entre {{min}} e {{max}}',

  // Date
  dateRequired: 'A data é obrigatória',
  dateInvalid: 'Data inválida',
  dateFormat: 'Formato de data inválido',
  dateFuture: 'A data deve ser futura',
  datePast: 'A data deve ser passada',
  dateMin: 'A data mínima é {{min}}',
  dateMax: 'A data máxima é {{max}}',
  dateRange: 'A data deve estar entre {{min}} e {{max}}',
  startDateRequired: 'A data de início é obrigatória',
  endDateRequired: 'A data de término é obrigatória',
  endDateAfterStart: 'A data de término deve ser após a de início',

  // URL
  urlRequired: 'A URL é obrigatória',
  urlInvalid: 'URL inválida',
  urlFormat: 'Digite uma URL válida',

  // Phone
  phoneRequired: 'O telefone é obrigatório',
  phoneInvalid: 'Número de telefone inválido',
  phoneFormat: 'Formato de telefone inválido',

  // String validation
  minLength: 'Deve ter pelo menos {{min}} caracteres',
  maxLength: 'Não pode ter mais de {{max}} caracteres',
  exactLength: 'Deve ter exatamente {{length}} caracteres',
  alphanumeric: 'Somente caracteres alfanuméricos',
  alphabetic: 'Somente letras',
  numeric: 'Somente números',
  noSpaces: 'Espaços não são permitidos',
  noSpecialChars: 'Caracteres especiais não são permitidos',

  // Number validation
  numberRequired: 'O número é obrigatório',
  numberInvalid: 'Número inválido',
  numberMin: 'O valor mínimo é {{min}}',
  numberMax: 'O valor máximo é {{max}}',
  numberRange: 'O valor deve estar entre {{min}} e {{max}}',
  numberInteger: 'Deve ser um número inteiro',
  numberDecimal: 'Deve ser um número decimal',
  numberPositive: 'Deve ser positivo',
  numberNegative: 'Deve ser negativo',

  // File validation
  fileRequired: 'O arquivo é obrigatório',
  fileInvalid: 'Arquivo inválido',
  fileTooLarge: 'O arquivo é muito grande',
  fileMaxSize: 'O tamanho máximo é {{size}}',
  fileType: 'Tipo de arquivo não permitido',
  fileAllowedTypes: 'Tipos permitidos: {{types}}',
  fileExtension: 'Extensão de arquivo inválida',

  // Image validation
  imageRequired: 'A imagem é obrigatória',
  imageInvalid: 'Imagem inválida',
  imageTooLarge: 'A imagem é muito grande',
  imageMaxSize: 'O tamanho máximo é {{size}}',
  imageDimensions: 'Dimensões inválidas',
  imageMinDimensions: 'Dimensões mínimas: {{width}}x{{height}}',
  imageMaxDimensions: 'Dimensões máximas: {{width}}x{{height}}',
  imageAspectRatio: 'Proporção inválida',

  // Selection
  selectionRequired: 'Você deve selecionar uma opção',
  selectionInvalid: 'Seleção inválida',
  selectAtLeastOne: 'Selecione pelo menos uma opção',
  selectAtMost: 'Selecione no máximo {{max}} opções',

  // Checkbox
  mustAccept: 'Você deve aceitar {{field}}',
  mustAgree: 'Você deve concordar',
  termsRequired: 'Você deve aceitar os termos e condições',

  // Account/Transaction specific
  accountRequired: 'A conta é obrigatória',
  categoryRequired: 'A categoria é obrigatória',
  descriptionRequired: 'A descrição é obrigatória',
  descriptionMinLength: 'A descrição deve ter pelo menos {{min}} caracteres',
  currencyRequired: 'A moeda é obrigatória',
  budgetRequired: 'O orçamento é obrigatório',
  budgetPositive: 'O orçamento deve ser positivo',

  // Custom
  unique: '{{field}} já existe',
  duplicate: '{{field}} duplicado',
  notFound: '{{field}} não encontrado',
  alreadyExists: '{{field}} já existe',
  inUse: '{{field}} está em uso',
  expired: '{{field}} expirou',
  tooShort: 'Muito curto',
  tooLong: 'Muito longo',
  tooSmall: 'Muito pequeno',
  tooLarge: 'Muito grande',
  outOfRange: 'Fora do intervalo',

  // Generic messages
  pleaseEnter: 'Por favor digite {{field}}',
  pleaseSelect: 'Por favor selecione {{field}}',
  pleaseCheck: 'Por favor verifique {{field}}',
  pleaseFix: 'Por favor corrija os erros',
  checkAndTryAgain: 'Verifique e tente novamente',
} as const;
