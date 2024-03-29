const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

// 로그인관련
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session')

// method-override사용
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

const { ObjectId } = require('mongodb');

// 환경변수 설정
require('dotenv').config()

app.set('view engine', 'ejs');

// css파일 사용하려면 밑에 코드 추가 = 미들웨어
app.use('/public', express.static('public'));
app.use(express.urlencoded({ extended: true }))

// 로그인관련
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

var db; //데이터 베이스를 저장하기 위한 변수

MongoClient.connect(process.env.DB_URL, (err, client) => {
  //todoapp이라는 database에 연결함
  db = client.db('todoapp');
  app.listen(8080, () => {
    console.log('lisening on 8080');
  });
})

// 미들웨어 만들기
function loginCheck(req, res, next) {
  if (req.user) {
    next()
  } else {
    res.send('로그인 안했음')
  }
}


// passport 라이브러리 사용하여 로그인 체크
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, (userId, userPw, done) => {
  db.collection('login').findOne({ id: userId }, (err, result) => {
    if (err) return done(err)

    if (!result) return done(null, false, { message: '존재하지않는 아이디입니다.' })
    if (userPw == result.pw) {
      return done(null, result)
    } else {
      return done(null, false, { message: '비밀번호가 같지 않습니다.' })
    }
  })
}));
// done(서버err, 성공시사용자DB데이터, 콜백함수) : 세개의 파라미터를 가짐
passport.serializeUser((user, done) => {
  done(null, user.id)
});
passport.deserializeUser((userId, done) => {
  db.collection('login').findOne({ id: userId }, (err, result) => {
    done(null, result)
  })
});
// deserializeUser() : 로그인한 유저의 세션아이디를 바탕으로 개인정보를 DB에서 찾는 역할

// 회원가입 기능
app.post('/register', (req, res) => {
  db.collection('login').findOne({ id: req.body.id }, (err, result) => {
    if (result == null) {
      db.collection('login').insertOne({ name: req.body.name, id: req.body.id, pw: req.body.pw }, (err, result) => {
        res.redirect('/login')
      })
    } else {
      res.send('중복아이디 입니다.')
    }
  })
})

// 로그인기능
app.get('/login', (req, res) => {
  res.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), (req, res) => {
  res.redirect('/mypage')
});

// logout
app.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy(() => {
    res.cookie('connect.sid', '', { maxAge: 0 });
    res.redirect('/');
  })
});

app.get('/signup', (req, res) => {
  res.render('signup.ejs')
});

// mypage 내가 작성한 글만 보이게
app.get('/mypage', loginCheck, (req, res) => {
  // console.log(req.user);
  db.collection('post').find({ user: req.user._id }).toArray((err, result) => {
    res.render('mypage.ejs', { posts: result }); //랜더링해주는 문법
  });
});





app.get('/', (req, res) => {
  res.render('index.ejs');
});
app.get('/write', (req, res) => {
  res.render('write.ejs');
});
// db에서 데이터 받아서 list.ejs에 렌더링
app.get('/list', (req, res) => {
  db.collection('post').find().toArray((err, result) => {
    res.render('list.ejs', { posts: result }); //랜더링해주는 문법
  });
});


// 수정기능
app.get('/edit/:id', loginCheck, (req, res) => {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
    res.render('edit.ejs', { data: result })
  })
})

app.put('/edit', loginCheck, (req, res) => {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, text: req.body.formText } }, (err, result) => {
    res.redirect('/list');
  })
})

app.get('/detail/:id', (req, res) => {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
    db.collection('commentroom').find({ postNum: req.params.id }).toArray().then((result2) => {
      res.render('detail.ejs', { data: result, data2: result2 })
    })
  })
})

app.get('/mydetail/:id', loginCheck, (req, res) => {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, (err, result) => {
    res.render('mypage-detail.ejs', { data: result })
  })
})



//DB저장 방법 postreq
app.post('/write', loginCheck, (req, res) => {
  var dt = new Date();
  var date = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate();
  db.collection('counter').findOne({ name: '게시물갯수' }, (err, result) => {
    var totalPost = result.totalPost;
    var userInfo = { _id: totalPost + 1, title: req.body.title, text: req.body.formText, user: req.user._id, date: date, name: req.user.name };
    db.collection('post').insertOne(userInfo, (err, result) => {
      console.log('저장완료');
      // db.collection('counter').updateOne({어떤 데이터를 수정할지},{수정값})
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, (err, result) => {
        if (err) { return console.log(err) };
      });
    });
  });
  res.redirect('/list');
});

app.post('/comment', loginCheck, (req, res) => {
  var postNum = parseInt(req.body.postNum);
  var dt = new Date();
  var date = dt.getFullYear() + '-' + (dt.getMonth() + 1) + '-' + dt.getDate();
  var commentInfo = { postNum: req.body.postNum, comment: req.body.comment, user: req.user.name, date: date }
  db.collection('commentroom').insertOne(commentInfo, (err, result) => {
    console.log('저장완료');
  });
  res.redirect('/detail/' + postNum)
});

app.delete('/delete', (req, res) => {
  // ajax로 보내준 데이터임
  req.body._id = parseInt(req.body._id)
  var delData = { _id: req.body._id, user: req.user._id }
  db.collection('post').remove(delData, (err, result) => {
    console.log('삭제완료');
    res.status(200).send({ message: '성공' })
  });
});


// 검색기능
app.get('/search', (req, res) => {
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: {
            'wildcard': '*'
          }
        }
      }
    }
  ]
  // console.log(req.query.value);
  db.collection('post').aggregate(검색조건).toArray((err, result) => {
    console.log(result);
    res.render('result.ejs', { posts: result })
  })
})




