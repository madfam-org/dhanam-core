/**
 * English Authentication Translations
 * Login, signup, password reset, 2FA, etc.
 */
export const auth = {
  // Login
  login: 'Sign in',
  loginTitle: 'Sign in to your account',
  loginSubtitle: 'Welcome back',
  email: 'Email',
  password: 'Password',
  rememberMe: 'Remember me',
  forgotPassword: 'Forgot your password?',
  loginButton: 'Sign in',
  loginWith: 'Sign in with {{provider}}',
  tryDemo: 'Try Demo',
  accessingDemo: 'Accessing demo...',
  noAccount: "Don't have an account?",
  signUp: 'Sign up',

  // SSO / OAuth
  signIn: 'Sign in',
  orContinueWith: 'Or continue with',
  orContinueWithEmail: 'Or continue with email',

  // Signup
  signup: 'Sign up',
  signupTitle: 'Create your account',
  signupSubtitle: 'Start managing your finances',
  createAccount: 'Create account',
  alreadyHaveAccount: 'Already have an account?',
  dontHaveAccount: "Don't have an account?",
  fullName: 'Full name',
  confirmPassword: 'Confirm password',
  agreeToTerms: 'I agree to the terms and conditions',
  termsAndConditions: 'Terms and conditions',
  privacyPolicy: 'Privacy policy',

  // Password
  passwordRequirements: 'Password requirements',
  passwordMinLength: 'Minimum 8 characters',
  passwordUppercase: 'At least one uppercase letter',
  passwordLowercase: 'At least one lowercase letter',
  passwordNumber: 'At least one number',
  passwordSpecial: 'At least one special character',
  passwordsDoNotMatch: 'Passwords do not match',
  currentPassword: 'Current password',
  newPassword: 'New password',
  confirmNewPassword: 'Confirm new password',
  changePassword: 'Change password',
  passwordChanged: 'Password changed successfully',

  // Password Reset
  resetPassword: 'Reset password',
  resetPasswordTitle: 'Reset your password',
  resetPasswordSubtitle: 'Enter your email to receive instructions',
  sendResetLink: 'Send reset link',
  resetLinkSent: 'Reset link sent',
  checkYourEmail: 'Check your email',
  resetLinkExpired: 'The reset link has expired',
  requestNewLink: 'Request new link',
  setNewPassword: 'Set new password',

  // Email Verification
  verifyEmail: 'Verify email',
  emailNotVerified: 'Email not verified',
  verificationEmailSent: 'Verification email sent',
  resendVerificationEmail: 'Resend verification email',
  emailVerified: 'Email verified successfully',
  verifyYourEmail: 'Verify your email',
  verificationLinkExpired: 'The verification link has expired',

  // 2FA / TOTP
  twoFactorAuth: 'Two-factor authentication',
  enable2FA: 'Enable 2FA',
  disable2FA: 'Disable 2FA',
  '2FAEnabled': '2FA enabled',
  '2FADisabled': '2FA disabled',
  enterTotpCode: 'Enter the 6-digit code',
  totpCode: 'TOTP code',
  invalidTotpCode: 'Invalid code',
  scanQRCode: 'Scan the QR code',
  cantScanQR: "Can't scan the QR?",
  enterManually: 'Enter manually',
  secretKey: 'Secret key',
  backupCodes: 'Backup codes',
  saveBackupCodes: 'Save these backup codes',
  backupCodesWarning: 'Each code can only be used once',
  downloadBackupCodes: 'Download backup codes',
  useBackupCode: 'Use backup code',
  regenerateBackupCodes: 'Regenerate backup codes',

  // Sessions
  activeSessions: 'Active sessions',
  currentSession: 'Current session',
  lastActive: 'Last active',
  revokeSession: 'Revoke session',
  revokeAllSessions: 'Revoke all sessions',
  sessionRevoked: 'Session revoked',

  // Logout
  logout: 'Sign out',
  logoutConfirm: 'Are you sure you want to sign out?',
  loggedOut: 'Signed out successfully',

  // Errors
  invalidCredentials: 'Invalid email or password',
  accountNotFound: 'Account not found',
  emailAlreadyExists: 'Email is already registered',
  accountDisabled: 'Account disabled',
  accountLocked: 'Account locked',
  tooManyAttempts: 'Too many attempts. Please try again later',
  sessionExpired: 'Session expired',
  unauthorized: 'Unauthorized',
  forbidden: 'Access denied',
  tokenInvalid: 'Invalid token',
  tokenExpired: 'Token expired',
  totpRequired: 'Please enter your 2FA code',
  invalidTotp: 'Invalid 2FA code. Please try again',
  genericError: 'An error occurred. Please try again',
  demoAccessFailed: 'Failed to access demo. Please try again',

  // TOTP Setup & Verify (component strings)
  totp: {
    setupTitle: 'Setup Two-Factor Authentication',
    setupDescription: 'Add an extra layer of security to your account',
    authenticatorAppNotice:
      "You'll need an authenticator app like Google Authenticator, Authy, or 1Password.",
    setupExplanation:
      'Two-factor authentication adds an extra layer of security by requiring a time-based code from your phone in addition to your password.',
    settingUp: 'Setting up...',
    startSetup: 'Start Setup',
    scanQrCode: 'Scan QR Code',
    enterSecretManually: 'Or enter this secret key manually:',
    enterCodeLabel: 'Enter 6-digit code from your app',
    verifying: 'Verifying...',
    verifyCode: 'Verify Code',
    backupCodesWarning:
      'Save these backup codes in a secure location. Each code can only be used once.',
    backupCodesTitle: 'Backup Codes',
    enabling2FA: 'Enabling 2FA...',
    completeSetup: 'Complete Setup',
    keepCodesSafe:
      "Keep these backup codes safe. You'll need them if you lose access to your authenticator app.",
    setupFailed: 'Failed to setup 2FA',
    invalidCode: 'Invalid verification code',
    enabledSuccess: 'Two-factor authentication enabled successfully',
    enableFailed: 'Failed to enable 2FA',
    copiedToClipboard: 'Copied to clipboard',
    copyFailed: 'Failed to copy',
    // Verify dialog
    verifyTitle: 'Two-Factor Authentication',
    verifyDescription: 'Enter the code from your authenticator app to complete login',
    verifyNotice: 'Your account has two-factor authentication enabled for added security.',
    backupCodeLabel: 'Backup Code',
    verificationCodeLabel: 'Verification Code',
    useAuthenticatorApp: 'Use authenticator app',
    useBackupCodeLink: 'Use backup code',
    verifyAndLogin: 'Verify & Login',
    backupCodeSingleUse:
      'Backup codes are single-use. Make sure to keep your remaining codes safe.',
    authSuccess: 'Authentication successful',
    invalidBackupCode: 'Invalid backup code',
    verificationFailed: 'Verification failed',
  },

  // Form states
  signingIn: 'Signing in...',
  creatingAccount: 'Creating account...',
  passwordHelp: 'Must contain at least 8 characters, one uppercase letter, and one number',
  agreementPrefix: 'By creating an account, you agree to our',
  termsOfService: 'Terms of Service',

  // Placeholders
  placeholders: {
    email: 'you@example.com',
    password: '••••••••',
    totpCode: '123456',
    fullName: 'John Doe',
  },

  // Callback page
  completingSignIn: 'Completing sign in...',
  verifyingCredentials: 'Please wait while we verify your credentials.',
  noAuthorizationCode: 'No authorization code received',
  sessionExpiredRetry: 'Session expired. Please try signing in again.',
  signInSuccessful: 'Sign in successful!',
  redirectingToDashboard: 'Redirecting to dashboard...',
  signInFailed: 'Sign in failed',
  redirectingToLogin: 'Redirecting to login...',
  authenticationFailed: 'Authentication failed',

  // Register page
  register: {
    title: 'Create an account',
    description: 'Start managing your finances with Dhanam',
    hasAccount: 'Already have an account?',
    signIn: 'Sign in',
  },

  // Success
  loginSuccessful: 'Login successful',
  signupSuccessful: 'Signup successful',
  welcomeBack: 'Welcome back, {{name}}',
  accountCreated: 'Account created successfully',
} as const;
