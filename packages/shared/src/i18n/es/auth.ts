/**
 * Spanish Authentication Translations
 * Login, signup, password reset, 2FA, etc.
 */
export const auth = {
  // Login
  login: 'Iniciar sesión',
  loginTitle: 'Inicia sesión en tu cuenta',
  loginSubtitle: 'Bienvenido de nuevo',
  email: 'Correo electrónico',
  password: 'Contraseña',
  rememberMe: 'Recordarme',
  forgotPassword: '¿Olvidaste tu contraseña?',
  loginButton: 'Iniciar sesión',
  loginWith: 'Iniciar sesión con {{provider}}',
  tryDemo: 'Probar Demo',
  accessingDemo: 'Accediendo a la demo...',
  noAccount: '¿No tienes una cuenta?',
  signUp: 'Regístrate',

  // SSO / OAuth
  signIn: 'Iniciar sesión',
  orContinueWith: 'O continuar con',
  orContinueWithEmail: 'O continuar con correo electrónico',

  // Signup
  signup: 'Registrarse',
  signupTitle: 'Crea tu cuenta',
  signupSubtitle: 'Comienza a administrar tus finanzas',
  createAccount: 'Crear cuenta',
  alreadyHaveAccount: '¿Ya tienes una cuenta?',
  dontHaveAccount: '¿No tienes una cuenta?',
  fullName: 'Nombre completo',
  confirmPassword: 'Confirmar contraseña',
  agreeToTerms: 'Acepto los términos y condiciones',
  termsAndConditions: 'Términos y condiciones',
  privacyPolicy: 'Política de privacidad',

  // Password
  passwordRequirements: 'Requisitos de contraseña',
  passwordMinLength: 'Mínimo 8 caracteres',
  passwordUppercase: 'Al menos una mayúscula',
  passwordLowercase: 'Al menos una minúscula',
  passwordNumber: 'Al menos un número',
  passwordSpecial: 'Al menos un carácter especial',
  passwordsDoNotMatch: 'Las contraseñas no coinciden',
  currentPassword: 'Contraseña actual',
  newPassword: 'Nueva contraseña',
  confirmNewPassword: 'Confirmar nueva contraseña',
  changePassword: 'Cambiar contraseña',
  passwordChanged: 'Contraseña cambiada exitosamente',

  // Password Reset
  resetPassword: 'Restablecer contraseña',
  resetPasswordTitle: 'Restablece tu contraseña',
  resetPasswordSubtitle: 'Ingresa tu correo para recibir instrucciones',
  sendResetLink: 'Enviar enlace de restablecimiento',
  resetLinkSent: 'Enlace de restablecimiento enviado',
  checkYourEmail: 'Revisa tu correo electrónico',
  resetLinkExpired: 'El enlace de restablecimiento ha expirado',
  requestNewLink: 'Solicitar nuevo enlace',
  setNewPassword: 'Establecer nueva contraseña',

  // Email Verification
  verifyEmail: 'Verificar correo electrónico',
  emailNotVerified: 'Correo no verificado',
  verificationEmailSent: 'Correo de verificación enviado',
  resendVerificationEmail: 'Reenviar correo de verificación',
  emailVerified: 'Correo verificado exitosamente',
  verifyYourEmail: 'Verifica tu correo electrónico',
  verificationLinkExpired: 'El enlace de verificación ha expirado',

  // 2FA / TOTP
  twoFactorAuth: 'Autenticación de dos factores',
  enable2FA: 'Habilitar 2FA',
  disable2FA: 'Deshabilitar 2FA',
  '2FAEnabled': '2FA habilitado',
  '2FADisabled': '2FA deshabilitado',
  enterTotpCode: 'Ingresa el código de 6 dígitos',
  totpCode: 'Código TOTP',
  invalidTotpCode: 'Código inválido',
  scanQRCode: 'Escanea el código QR',
  cantScanQR: '¿No puedes escanear el QR?',
  enterManually: 'Ingresa manualmente',
  secretKey: 'Clave secreta',
  backupCodes: 'Códigos de respaldo',
  saveBackupCodes: 'Guarda estos códigos de respaldo',
  backupCodesWarning: 'Cada código solo se puede usar una vez',
  downloadBackupCodes: 'Descargar códigos de respaldo',
  useBackupCode: 'Usar código de respaldo',
  regenerateBackupCodes: 'Regenerar códigos de respaldo',

  // Sessions
  activeSessions: 'Sesiones activas',
  currentSession: 'Sesión actual',
  lastActive: 'Última actividad',
  revokeSession: 'Revocar sesión',
  revokeAllSessions: 'Revocar todas las sesiones',
  sessionRevoked: 'Sesión revocada',

  // Logout
  logout: 'Cerrar sesión',
  logoutConfirm: '¿Estás seguro de que deseas cerrar sesión?',
  loggedOut: 'Sesión cerrada exitosamente',

  // Errors
  invalidCredentials: 'Correo o contraseña incorrectos',
  accountNotFound: 'Cuenta no encontrada',
  emailAlreadyExists: 'El correo ya está registrado',
  accountDisabled: 'Cuenta deshabilitada',
  accountLocked: 'Cuenta bloqueada',
  tooManyAttempts: 'Demasiados intentos. Intenta más tarde',
  sessionExpired: 'Sesión expirada',
  unauthorized: 'No autorizado',
  forbidden: 'Acceso denegado',
  tokenInvalid: 'Token inválido',
  tokenExpired: 'Token expirado',
  totpRequired: 'Por favor ingresa tu código 2FA',
  invalidTotp: 'Código 2FA inválido. Intenta de nuevo',
  genericError: 'Ocurrió un error. Por favor intenta de nuevo',
  demoAccessFailed: 'Error al acceder a la demo. Intenta de nuevo',

  // TOTP Setup & Verify (component strings)
  totp: {
    setupTitle: 'Configurar autenticación de dos factores',
    setupDescription: 'Agrega una capa extra de seguridad a tu cuenta',
    authenticatorAppNotice:
      'Necesitarás una app de autenticación como Google Authenticator, Authy o 1Password.',
    setupExplanation:
      'La autenticación de dos factores agrega una capa extra de seguridad al requerir un código temporal de tu teléfono además de tu contraseña.',
    settingUp: 'Configurando...',
    startSetup: 'Iniciar configuración',
    scanQrCode: 'Escanear código QR',
    enterSecretManually: 'O ingresa esta clave secreta manualmente:',
    enterCodeLabel: 'Ingresa el código de 6 dígitos de tu app',
    verifying: 'Verificando...',
    verifyCode: 'Verificar código',
    backupCodesWarning:
      'Guarda estos códigos de respaldo en un lugar seguro. Cada código solo se puede usar una vez.',
    backupCodesTitle: 'Códigos de respaldo',
    enabling2FA: 'Habilitando 2FA...',
    completeSetup: 'Completar configuración',
    keepCodesSafe:
      'Guarda estos códigos de respaldo en un lugar seguro. Los necesitarás si pierdes acceso a tu app de autenticación.',
    setupFailed: 'Error al configurar 2FA',
    invalidCode: 'Código de verificación inválido',
    enabledSuccess: 'Autenticación de dos factores habilitada exitosamente',
    enableFailed: 'Error al habilitar 2FA',
    copiedToClipboard: 'Copiado al portapapeles',
    copyFailed: 'Error al copiar',
    // Verify dialog
    verifyTitle: 'Autenticación de dos factores',
    verifyDescription:
      'Ingresa el código de tu app de autenticación para completar el inicio de sesión',
    verifyNotice: 'Tu cuenta tiene autenticación de dos factores habilitada para mayor seguridad.',
    backupCodeLabel: 'Código de respaldo',
    verificationCodeLabel: 'Código de verificación',
    useAuthenticatorApp: 'Usar app de autenticación',
    useBackupCodeLink: 'Usar código de respaldo',
    verifyAndLogin: 'Verificar e iniciar sesión',
    backupCodeSingleUse:
      'Los códigos de respaldo son de un solo uso. Asegúrate de guardar los códigos restantes.',
    authSuccess: 'Autenticación exitosa',
    invalidBackupCode: 'Código de respaldo inválido',
    verificationFailed: 'Verificación fallida',
  },

  // Form states
  signingIn: 'Iniciando sesión...',
  creatingAccount: 'Creando cuenta...',
  passwordHelp: 'Debe contener al menos 8 caracteres, una mayúscula y un número',
  agreementPrefix: 'Al crear una cuenta, aceptas nuestros',
  termsOfService: 'Términos de Servicio',

  // Placeholders
  placeholders: {
    email: 'tu@ejemplo.com',
    password: '••••••••',
    totpCode: '123456',
    fullName: 'Juan García',
  },

  // Callback page
  completingSignIn: 'Completando inicio de sesión...',
  verifyingCredentials: 'Por favor espera mientras verificamos tus credenciales.',
  noAuthorizationCode: 'No se recibió código de autorización',
  sessionExpiredRetry: 'Sesión expirada. Intenta iniciar sesión de nuevo.',
  signInSuccessful: '¡Inicio de sesión exitoso!',
  redirectingToDashboard: 'Redirigiendo al panel...',
  signInFailed: 'Error al iniciar sesión',
  redirectingToLogin: 'Redirigiendo al inicio de sesión...',
  authenticationFailed: 'Error de autenticación',

  // Register page
  register: {
    title: 'Crear una cuenta',
    description: 'Comienza a gestionar tus finanzas con Dhanam',
    hasAccount: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
  },

  // Success
  loginSuccessful: 'Inicio de sesión exitoso',
  signupSuccessful: 'Registro exitoso',
  welcomeBack: 'Bienvenido de nuevo, {{name}}',
  accountCreated: 'Cuenta creada exitosamente',
} as const;
