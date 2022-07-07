var router = require('express').Router();

// 로그인관련
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session')


// 로그인관련
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

router.get('/login', function (요청, 응답) {
  응답.render('login.ejs')
});

router.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (요청, 응답) {
  응답.redirect('/')
});

module.exports = router;