/**
 * Brazilian Portuguese Authentication Translations
 * Login, signup, password reset, 2FA, etc.
 */
export const auth = {
  // Login
  login: 'Entrar',
  loginTitle: 'Entre na sua conta',
  loginSubtitle: 'Bem-vindo de volta',
  email: 'E-mail',
  password: 'Senha',
  rememberMe: 'Lembrar-me',
  forgotPassword: 'Esqueceu sua senha?',
  loginButton: 'Entrar',
  loginWith: 'Entrar com {{provider}}',
  tryDemo: 'Testar Demo',
  accessingDemo: 'Acessando a demo...',
  noAccount: 'Não tem uma conta?',
  signUp: 'Cadastre-se',

  // SSO / OAuth
  signIn: 'Entrar',
  orContinueWith: 'Ou continuar com',
  orContinueWithEmail: 'Ou continuar com e-mail',

  // Signup
  signup: 'Cadastrar',
  signupTitle: 'Crie sua conta',
  signupSubtitle: 'Comece a gerenciar suas finanças',
  createAccount: 'Criar conta',
  alreadyHaveAccount: 'Já tem uma conta?',
  dontHaveAccount: 'Não tem uma conta?',
  fullName: 'Nome completo',
  confirmPassword: 'Confirmar senha',
  agreeToTerms: 'Aceito os termos e condições',
  termsAndConditions: 'Termos e condições',
  privacyPolicy: 'Política de privacidade',

  // Password
  passwordRequirements: 'Requisitos de senha',
  passwordMinLength: 'Mínimo de 8 caracteres',
  passwordUppercase: 'Pelo menos uma maiúscula',
  passwordLowercase: 'Pelo menos uma minúscula',
  passwordNumber: 'Pelo menos um número',
  passwordSpecial: 'Pelo menos um caractere especial',
  passwordsDoNotMatch: 'As senhas não coincidem',
  currentPassword: 'Senha atual',
  newPassword: 'Nova senha',
  confirmNewPassword: 'Confirmar nova senha',
  changePassword: 'Alterar senha',
  passwordChanged: 'Senha alterada com sucesso',

  // Password Reset
  resetPassword: 'Redefinir senha',
  resetPasswordTitle: 'Redefina sua senha',
  resetPasswordSubtitle: 'Digite seu e-mail para receber instruções',
  sendResetLink: 'Enviar link de redefinição',
  resetLinkSent: 'Link de redefinição enviado',
  checkYourEmail: 'Verifique seu e-mail',
  resetLinkExpired: 'O link de redefinição expirou',
  requestNewLink: 'Solicitar novo link',
  setNewPassword: 'Definir nova senha',

  // Email Verification
  verifyEmail: 'Verificar e-mail',
  emailNotVerified: 'E-mail não verificado',
  verificationEmailSent: 'E-mail de verificação enviado',
  resendVerificationEmail: 'Reenviar e-mail de verificação',
  emailVerified: 'E-mail verificado com sucesso',
  verifyYourEmail: 'Verifique seu e-mail',
  verificationLinkExpired: 'O link de verificação expirou',

  // 2FA / TOTP
  twoFactorAuth: 'Autenticação de dois fatores',
  enable2FA: 'Habilitar 2FA',
  disable2FA: 'Desabilitar 2FA',
  '2FAEnabled': '2FA habilitado',
  '2FADisabled': '2FA desabilitado',
  enterTotpCode: 'Digite o código de 6 dígitos',
  totpCode: 'Código TOTP',
  invalidTotpCode: 'Código inválido',
  scanQRCode: 'Escaneie o código QR',
  cantScanQR: 'Não consegue escanear o QR?',
  enterManually: 'Digite manualmente',
  secretKey: 'Chave secreta',
  backupCodes: 'Códigos de backup',
  saveBackupCodes: 'Salve estes códigos de backup',
  backupCodesWarning: 'Cada código só pode ser usado uma vez',
  downloadBackupCodes: 'Baixar códigos de backup',
  useBackupCode: 'Usar código de backup',
  regenerateBackupCodes: 'Regenerar códigos de backup',

  // Sessions
  activeSessions: 'Sessões ativas',
  currentSession: 'Sessão atual',
  lastActive: 'Última atividade',
  revokeSession: 'Revogar sessão',
  revokeAllSessions: 'Revogar todas as sessões',
  sessionRevoked: 'Sessão revogada',

  // Logout
  logout: 'Sair',
  logoutConfirm: 'Tem certeza que deseja sair?',
  loggedOut: 'Sessão encerrada com sucesso',

  // Errors
  invalidCredentials: 'E-mail ou senha incorretos',
  accountNotFound: 'Conta não encontrada',
  emailAlreadyExists: 'O e-mail já está cadastrado',
  accountDisabled: 'Conta desabilitada',
  accountLocked: 'Conta bloqueada',
  tooManyAttempts: 'Muitas tentativas. Tente mais tarde',
  sessionExpired: 'Sessão expirada',
  unauthorized: 'Não autorizado',
  forbidden: 'Acesso negado',
  tokenInvalid: 'Token inválido',
  tokenExpired: 'Token expirado',
  totpRequired: 'Por favor digite seu código 2FA',
  invalidTotp: 'Código 2FA inválido. Tente novamente',
  genericError: 'Ocorreu um erro. Por favor tente novamente',
  demoAccessFailed: 'Erro ao acessar a demo. Tente novamente',

  // TOTP Setup & Verify (component strings)
  totp: {
    setupTitle: 'Configurar autenticação de dois fatores',
    setupDescription: 'Adicione uma camada extra de segurança à sua conta',
    authenticatorAppNotice:
      'Você precisará de um app de autenticação como Google Authenticator, Authy ou 1Password.',
    setupExplanation:
      'A autenticação de dois fatores adiciona uma camada extra de segurança ao exigir um código temporário do seu celular além da sua senha.',
    settingUp: 'Configurando...',
    startSetup: 'Iniciar configuração',
    scanQrCode: 'Escanear código QR',
    enterSecretManually: 'Ou digite esta chave secreta manualmente:',
    enterCodeLabel: 'Digite o código de 6 dígitos do seu app',
    verifying: 'Verificando...',
    verifyCode: 'Verificar código',
    backupCodesWarning:
      'Salve estes códigos de backup em um local seguro. Cada código só pode ser usado uma vez.',
    backupCodesTitle: 'Códigos de backup',
    enabling2FA: 'Habilitando 2FA...',
    completeSetup: 'Concluir configuração',
    keepCodesSafe:
      'Salve estes códigos de backup em um local seguro. Você vai precisar deles se perder acesso ao seu app de autenticação.',
    setupFailed: 'Erro ao configurar 2FA',
    invalidCode: 'Código de verificação inválido',
    enabledSuccess: 'Autenticação de dois fatores habilitada com sucesso',
    enableFailed: 'Erro ao habilitar 2FA',
    copiedToClipboard: 'Copiado para a área de transferência',
    copyFailed: 'Erro ao copiar',
    // Verify dialog
    verifyTitle: 'Autenticação de dois fatores',
    verifyDescription: 'Digite o código do seu app de autenticação para completar o login',
    verifyNotice: 'Sua conta possui autenticação de dois fatores habilitada para maior segurança.',
    backupCodeLabel: 'Código de backup',
    verificationCodeLabel: 'Código de verificação',
    useAuthenticatorApp: 'Usar app de autenticação',
    useBackupCodeLink: 'Usar código de backup',
    verifyAndLogin: 'Verificar e entrar',
    backupCodeSingleUse:
      'Os códigos de backup são de uso único. Certifique-se de guardar os códigos restantes.',
    authSuccess: 'Autenticação bem-sucedida',
    invalidBackupCode: 'Código de backup inválido',
    verificationFailed: 'Verificação falhou',
  },

  // Form states
  signingIn: 'Entrando...',
  creatingAccount: 'Criando conta...',
  passwordHelp: 'Deve conter pelo menos 8 caracteres, uma maiúscula e um número',
  agreementPrefix: 'Ao criar uma conta, você concorda com nossos',
  termsOfService: 'Termos de Serviço',

  // Placeholders
  placeholders: {
    email: 'você@exemplo.com',
    password: '••••••••',
    totpCode: '123456',
    fullName: 'João Silva',
  },

  // Callback page
  completingSignIn: 'Concluindo login...',
  verifyingCredentials: 'Por favor aguarde enquanto verificamos suas credenciais.',
  noAuthorizationCode: 'Nenhum código de autorização recebido',
  sessionExpiredRetry: 'Sessão expirada. Tente fazer login novamente.',
  signInSuccessful: 'Login realizado com sucesso!',
  redirectingToDashboard: 'Redirecionando para o painel...',
  signInFailed: 'Falha no login',
  redirectingToLogin: 'Redirecionando para o login...',
  authenticationFailed: 'Falha na autenticação',

  // Register page
  register: {
    title: 'Criar uma conta',
    description: 'Comece a gerenciar suas finanças com Dhanam',
    hasAccount: 'Já tem uma conta?',
    signIn: 'Entrar',
  },

  // Success
  loginSuccessful: 'Login realizado com sucesso',
  signupSuccessful: 'Cadastro realizado com sucesso',
  welcomeBack: 'Bem-vindo de volta, {{name}}',
  accountCreated: 'Conta criada com sucesso',
} as const;
