import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translations object
const translations = {
  en: {
    // Login Page
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    signInAccess: "Sign in to access AI-powered keyword research",
    aiPowered: "🔥 AI-Powered",
    instantAccess: "⚡ Instant Access",
    fullName: "Full Name",
    enterFullName: "Enter your full name",
    emailAddress: "Email Address",
    enterEmail: "Enter your email",
    password: "Password",
    enterPassword: "Enter your password",
    signIn: "Sign In",
    signingIn: "Signing In...",
    creatingAccount: "Creating Account...",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    demoMode: "Demo Mode:",
    demoModeDesc: "Use any valid email and password (6+ characters) to access the platform.",
    secureLogin: "Secure login • Professional keyword research • AI-powered insights",
    
    // Form Validation
    emailRequired: "Email is required",
    validEmail: "Please enter a valid email",
    passwordRequired: "Password is required",
    passwordLength: "Password must be at least 6 characters",
    nameRequired: "Name is required",
    
    // Main App
    useThisSearch: "Use This Search",
    aiKeywordResearch: "AI-Powered Keyword Research",
    
    // Dashboard & Search Interface
    dashboard: "Dashboard",
    discoverQuestions: "Discover what questions people are asking about your keywords. Generate content ideas, SEO insights, and uncover search trends with AI-powered keyword research.",
    enterKeyword: "Enter your keyword (e.g., digital marketing, coffee, fitness)",
    getQuestions: "Get Questions",
    searching: "Searching...",
    viewModes: "View Modes",
    visualMode: "Visual",
    listMode: "List",
    export: "Export",
    
    // Common
    language: "Language",
    selectLanguage: "Select Language"
  },
  
  es: {
    // Login Page
    welcomeBack: "Bienvenido de Nuevo",
    createAccount: "Crear Cuenta",
    signInAccess: "Inicia sesión para acceder a la investigación de palabras clave impulsada por IA",
    aiPowered: "🔥 Impulsado por IA",
    instantAccess: "⚡ Acceso Instantáneo",
    fullName: "Nombre Completo",
    enterFullName: "Ingresa tu nombre completo",
    emailAddress: "Dirección de Correo",
    enterEmail: "Ingresa tu correo electrónico",
    password: "Contraseña",
    enterPassword: "Ingresa tu contraseña",
    signIn: "Iniciar Sesión",
    signingIn: "Iniciando Sesión...",
    creatingAccount: "Creando Cuenta...",
    dontHaveAccount: "¿No tienes una cuenta?",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
    demoMode: "Modo Demo:",
    demoModeDesc: "Usa cualquier correo válido y contraseña (6+ caracteres) para acceder a la plataforma.",
    secureLogin: "Inicio seguro • Investigación profesional de palabras clave • Insights impulsados por IA",
    
    // Form Validation
    emailRequired: "El correo es requerido",
    validEmail: "Por favor ingresa un correo válido",
    passwordRequired: "La contraseña es requerida",
    passwordLength: "La contraseña debe tener al menos 6 caracteres",
    nameRequired: "El nombre es requerido",
    
    // Main App
    useThisSearch: "Usa Esta Búsqueda",
    aiKeywordResearch: "Investigación de Palabras Clave con IA",
    
    // Dashboard & Search Interface
    dashboard: "Panel de Control",
    discoverQuestions: "Descubre qué preguntas están haciendo las personas sobre tus palabras clave. Genera ideas de contenido, insights SEO y descubre tendencias de búsqueda con investigación de palabras clave impulsada por IA.",
    enterKeyword: "Ingresa tu palabra clave (ej., marketing digital, café, fitness)",
    getQuestions: "Obtener Preguntas",
    searching: "Buscando...",
    viewModes: "Modos de Vista",
    visualMode: "Visual",
    listMode: "Lista",
    export: "Exportar",
    
    // Common
    language: "Idioma",
    selectLanguage: "Seleccionar Idioma"
  },
  
  fr: {
    // Login Page
    welcomeBack: "Bon Retour",
    createAccount: "Créer un Compte",
    signInAccess: "Connectez-vous pour accéder à la recherche de mots-clés alimentée par l'IA",
    aiPowered: "🔥 Alimenté par l'IA",
    instantAccess: "⚡ Accès Instantané",
    fullName: "Nom Complet",
    enterFullName: "Entrez votre nom complet",
    emailAddress: "Adresse Email",
    enterEmail: "Entrez votre email",
    password: "Mot de Passe",
    enterPassword: "Entrez votre mot de passe",
    signIn: "Se Connecter",
    signingIn: "Connexion...",
    creatingAccount: "Création du Compte...",
    dontHaveAccount: "Vous n'avez pas de compte?",
    alreadyHaveAccount: "Vous avez déjà un compte?",
    demoMode: "Mode Démo:",
    demoModeDesc: "Utilisez n'importe quel email valide et mot de passe (6+ caractères) pour accéder à la plateforme.",
    secureLogin: "Connexion sécurisée • Recherche professionnelle de mots-clés • Insights alimentés par l'IA",
    
    // Form Validation
    emailRequired: "L'email est requis",
    validEmail: "Veuillez entrer un email valide",
    passwordRequired: "Le mot de passe est requis",
    passwordLength: "Le mot de passe doit contenir au moins 6 caractères",
    nameRequired: "Le nom est requis",
    
    // Main App
    useThisSearch: "Utilisez Cette Recherche",
    aiKeywordResearch: "Recherche de Mots-clés par IA",
    
    // Common
    language: "Langue",
    selectLanguage: "Sélectionner la Langue"
  },
  
  de: {
    // Login Page
    welcomeBack: "Willkommen zurück",
    createAccount: "Konto erstellen",
    signInAccess: "Melden Sie sich an, um auf KI-gestützte Keyword-Recherche zuzugreifen",
    aiPowered: "🔥 KI-gestützt",
    instantAccess: "⚡ Sofortzugriff",
    fullName: "Vollständiger Name",
    enterFullName: "Geben Sie Ihren vollständigen Namen ein",
    emailAddress: "E-Mail-Adresse",
    enterEmail: "Geben Sie Ihre E-Mail ein",
    password: "Passwort",
    enterPassword: "Geben Sie Ihr Passwort ein",
    signIn: "Anmelden",
    signingIn: "Anmeldung läuft...",
    creatingAccount: "Konto wird erstellt...",
    dontHaveAccount: "Haben Sie kein Konto?",
    alreadyHaveAccount: "Haben Sie bereits ein Konto?",
    demoMode: "Demo-Modus:",
    demoModeDesc: "Verwenden Sie eine gültige E-Mail und ein Passwort (6+ Zeichen), um auf die Plattform zuzugreifen.",
    secureLogin: "Sichere Anmeldung • Professionelle Keyword-Recherche • KI-gestützte Einblicke",
    
    // Form Validation
    emailRequired: "E-Mail ist erforderlich",
    validEmail: "Bitte geben Sie eine gültige E-Mail ein",
    passwordRequired: "Passwort ist erforderlich",
    passwordLength: "Passwort muss mindestens 6 Zeichen haben",
    nameRequired: "Name ist erforderlich",
    
    // Main App
    useThisSearch: "Verwenden Sie Diese Suche",
    aiKeywordResearch: "KI-gestützte Keyword-Recherche",
    
    // Common
    language: "Sprache",
    selectLanguage: "Sprache auswählen"
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('useThisSearch_language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('useThisSearch_language', languageCode);
    }
  };

  const t = (key, defaultValue = key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || defaultValue;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;