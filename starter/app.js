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
  done(null, { id: user.id, authMethod: user.authMethod });
});

// Deserialize user from session
passport.deserializeUser((sessionUser, done) => {
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
});

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
// 2. POST /login/saml/callback - Process SAML assertion
// 3. Configure passport-saml strategy
//
// See the assignment document for detailed instructions.

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
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.session.destroy();
    res.redirect('/');
  });
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
