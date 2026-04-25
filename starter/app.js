// SGI Web Application - Assignment 2 Starter
// Express app with local authentication
//
// YOUR TASK: Add SAML authentication using passport-saml
// See the assignment document for detailed instructions

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const path = require('path');

// Load user database (JSON file, no database server needed)
const users = require('./users.json');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// Middleware Configuration
// =============================================================================

// Parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'sgi-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set to true if using HTTPS
    maxAge: 1000 * 60 * 30  // 30 minutes
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================================
// Passport Configuration - Local Strategy
// =============================================================================

// Local authentication strategy
passport.use('local', new LocalStrategy(
  {
    usernameField: 'username',
    passwordField: 'password'
  },
  async (username, password, done) => {
    try {
      // Find user in database
      const user = users.users.find(u => u.username === username);

      if (!user) {
        console.log('User not found');
        return done(null, false, { message: 'User not found' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        console.log('Invalid password');
        return done(null, false, { message: 'Invalid password' });
      }

      // Authentication successful
      return done(null, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        authMethod: 'local'
      });
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  // Armazenar dados mínimos na sessão
  done(null, {
    id: user.id,
    authMethod: user.authMethod,
    // Para utilizadores SAML, guardar dados adicionais necessários para logout
    nameID: user.nameID,
    displayName: user.displayName,
    email: user.email,
    username: user.username,
    nameIDFormat: user.nameIDFormat
  });
});

// Deserialize user from session
passport.deserializeUser((sessionUser, done) => {

  // Para utilizadores SAML, reconstruir a partir dos dados da sessão
  if (sessionUser.authMethod === 'saml') {
    done(null, {
      id: sessionUser.id.replace('saml-', ''),
      username: sessionUser.username,
      displayName: sessionUser.displayName,
      email: sessionUser.email,
      nameID: sessionUser.nameID,
      nameIDFormat: sessionUser.nameIDFormat,
      authMethod: 'saml'
    });

  // Para utilizadores locais, procurar na base de dados
  } else {
    const user = users.users.find(u => u.id === sessionUser.id);
    if (user) {
      done(null, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        authMethod: sessionUser.authMethod
      });
    } else {
      done(null, false);
    }
  }
});

// =============================================================================
// Passport Configuration - SAML Strategy
// =============================================================================

// SAML authentication strategy
const samlConfig = {
  // Configuração do IdP
  entryPoint: 'https://saml.jcraveiro.com/saml2/idp/SSOService.php',
  logoutUrl: 'https://saml.jcraveiro.com/saml2/idp/SingleLogoutService.php',

  issuer: 'http://localhost:3000/a22511360', // Substitua pelo seu número de aluno
  callbackUrl: 'http://localhost:3000/login/saml/callback',
  logoutCallbackUrl: 'http://localhost:3000/logout/saml/callback',

  // Certificado do IdP (para validação de assinatura)
  idpCert: `-----BEGIN CERTIFICATE-----
MIIEpzCCAw+gAwIBAgIUMFWJxjyrZFN5dyYdNB8FeSqdIyIwDQYJKoZIhvcNAQEL
BQAwYzELMAkGA1UEBhMCUFQxDzANBgNVBAgMBkxpc2JvYTEPMA0GA1UEBwwGTGlz
Ym9hMRUwEwYDVQQKDAxVbml2ZXJzaWRhZGUxGzAZBgNVBAMMEnNhbWwuamNyYXZl
aXJvLmNvbTAeFw0yNjAzMDkxOTUyMjZaFw0zNjAzMDYxOTUyMjZaMGMxCzAJBgNV
BAYTAlBUMQ8wDQYDVQQIDAZMaXNib2ExDzANBgNVBAcMBkxpc2JvYTEVMBMGA1UE
CgwMVW5pdmVyc2lkYWRlMRswGQYDVQQDDBJzYW1sLmpjcmF2ZWlyby5jb20wggGi
MA0GCSqGSIb3DQEBAQUAA4IBjwAwggGKAoIBgQCOU3TssWzGdgomq+yMJfrbrCVh
kmqTOJ7yU4MN8OrsgJNlU3qNWZtduBTWjx/ST8MmvYRtpT7Wa32OVQ8W56RaAJaW
eAttrNr2cG2UOMS4Yo9Lom2Pp5HLrscXr3Y9szP2nuHQY3U8Z2YWerjwxVB3Yb4o
pry+9M0YRFQcyTNLEWfZ4gl1Qj86y1b/1UlF7sHbejJss3PTb+YDjZqeEh7bMy/v
WflAiGicuRSwDRz8iyNct4cGUfInYJLk3E1zkHkoxg4X6IXxb7USyLksYB83pOE1
L7Ts7fEbjRE8FpTuJ8lcWBpoh4MrfZkJqR4GLu0mdsH8d8y40T1a4bPn6CNDTex9
j01XpWaerCyJytTq9AfW8b0cgYOhMDxYePGTGyDGHCm92jfUqndhlXpGIu2TN96Y
9ZKv9p+XB1YsegQC0x2rT3TQM7I/x3+A43cdKhe3eYZhBZ7DSu5nU46z7yjUykGg
0vN0KtuwgIu6HtxbP6avgN+b4IglaDoviZX1KiUCAwEAAaNTMFEwHQYDVR0OBBYE
FM2InRBvX1nrhb/3KS8HM8cH5jAEMB8GA1UdIwQYMBaAFM2InRBvX1nrhb/3KS8H
M8cH5jAEMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQELBQADggGBAGlrCzF1
BcnWGlWkp0c8E5JJRsuszww73We9npluvaGp75jCqQJUlYA6zqNNKwcNT2UXJ4xi
B39TNb22LrWOJX0cbwUpoVbVtnI+kAbzQx6ZT8EP591zYVrk8tA6ZvDosGABvRH4
Ls23vZz9Byjtd0gFZ4sU8kfCbdmGQHIyARRGWJgvX6rd16SB+WCCNwLsXgjnLmpj
OkB8pNygtECwbEsdxwUwhmkJwD2jxPO1ddC4bhs+FuEhGMdoiF83IFVaNpE1iF0U
Z6FOO3XOoWDOvpae9k7Y/EFWXO5KJ67qjXHG+xjI7BZCkVzgfZiNzKdm1ECzNdj
qvo4QrOlUpUSaYYw144H3m2+VJUti9uDQS4B2XFTDI0JPke5C7efLec1kPebvmav
N+6Jj0HYhXOxHoJagOyugwr6BBMh3P4be1GNyOo0yr+41E3cCH1tYV4VSu2hzcy/
ICgTGzhdS+vAcE0nJB8hZb271V9hIdtkjSFGk6NYeen+6sfjPTydAQICXGg==
-----END CERTIFICATE-----`,

// Configurações de pedido
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
  wantAssertionsSigned: true,
  acceptedClockSkewMs: 5000
};

// Criar estratégia SAML
const SamlStrategy = require('@node-saml/passport-saml').Strategy;
passport.use('saml', new SamlStrategy(
    samlConfig,
    (profile, done) => {
      // Esta função é chamada após autenticação SAML bem-sucedida
      // profile contém a informação do utilizador da asserção SAML
      console.log('Perfil SAML:', JSON.stringify(profile, null, 2));
      // Criar objeto de utilizador para a sessão
      const user = {
        id: 'saml-' + profile.nameID,
        username: profile.uid,
        displayName: profile.displayName ||
            profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            profile.nameID,
        email: profile.email ||
            profile.mail ||
            profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
            profile.nameID,
        nameID: profile.nameID,
        nameIDFormat: profile.nameIDFormat,
        issuer: profile.issuer,
        authMethod: 'saml'
      };
      //console.log('User:', user);
      return done(null, user);
    }
));

// =============================================================================
// Helper Middleware
// =============================================================================

// Check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// =============================================================================
// Routes - Public
// =============================================================================

// Home page
app.get('/', (req, res) => {
  res.render('index');
});

// Login page
app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  res.render('login', { error: req.query.error });
});

// =============================================================================
// Routes - Local Authentication
// =============================================================================

// Process local login
app.post('/login/local',
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login?error=invalid_credentials'
  })
);

// =============================================================================
// TODO: Add SAML Routes Here (Assignment 2)
// =============================================================================
//
// You need to add:
// 1. GET /login/saml - Initiate SAML authentication
app.get('/login/saml',
    passport.authenticate('saml', {
      failureRedirect: '/login?error=invalid_credentials'
    })
);

// 2. POST /login/saml/callback - Process SAML assertion
app.post('/login/saml/callback',
    passport.authenticate('saml', {
      failureRedirect: '/login?error=saml_assertion_failed'
    }),
    (req, res) => {
      // Autenticação bem-sucedida
      res.redirect('/profile');
    }
);

// 3. Configure passport-saml strategy
app.get('/metadata.xml', (req, res) => {
  const samlStrategy = passport._strategy('saml');
  res.type('application/xml');
  res.send(samlStrategy.generateServiceProviderMetadata());
});

// =============================================================================
// TODO: Add Google OAuth Routes Here (Assignment 3)
// =============================================================================
//
// You will add Google authentication in Assignment 3.
// Routes needed: GET /login/google, GET /login/google/callback

// =============================================================================
// TODO: Add Verifiable Credential Routes Here (Assignment 4)
// =============================================================================
//
// You will add VC authentication in Assignment 4.
// Routes needed: GET /login/vc, POST /login/vc

// =============================================================================
// Routes - Protected
// =============================================================================

// Profile page (requires authentication)
app.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile');
});

// Logout
app.get('/logout', (req, res, next) => {
  if (req.isAuthenticated() && req.user.authMethod === 'saml') {
    const samlStrategy = passport._strategy('saml');
    samlStrategy.logout(req, (err, logoutUrl) => {
      if (err) return next(err);
      req.logout((err) => {
        if (err) console.error(err);
        req.session.destroy();
        res.redirect(logoutUrl);
      });
    });
  } else {
    req.logout((err) => {
      if (err) console.error(err);
      req.session.destroy();
      res.redirect('/');
    });
  }
});

app.get('/logout/saml/callback', (req, res) => {
  res.redirect('/');
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Not Found',
    message: 'The page you requested was not found.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: 'An internal server error occurred.'
  });
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`SGI Web Application running at http://localhost:${PORT}`);
  console.log('');
  console.log('Available authentication methods:');
  console.log('  - Local: /login (username/password)');
  console.log('');
  console.log('Test users:');
  users.users.forEach(u => {
    console.log(`  - ${u.username} (password: see users.json comments)`);
  });
});
