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

MongoClient.connect(process.env.DB_URL, function (err, client) {
  //todoapp이라는 database에 연결함
  db = client.db('todoapp');
  app.listen(8080, function () {
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
}, function (userId, userPw, done) {
  db.collection('login').findOne({ id: userId }, function (err, result) {
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
passport.serializeUser(function (user, done) {
  done(null, user.id)
});
passport.deserializeUser(function (userId, done) {
  db.collection('login').findOne({ id: userId }, function (err, result) {
    done(null, result)
  })
});
// deserializeUser() : 로그인한 유저의 세션아이디를 바탕으로 개인정보를 DB에서 찾는 역할

// 회원가입 기능
app.post('/register', function (req, res) {
  db.collection('login').findOne({ id: req.body.id }, function (err, result) {
    if (result == null) {
      db.collection('login').insertOne({ name: req.body.name, id: req.body.id, pw: req.body.pw }, function (err, result) {
        res.redirect('/login')
      })
    } else {
      res.send('중복아이디 입니다.')
    }
  })
})

// 로그인기능
app.get('/login', function (req, res) {
  res.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (req, res) {
  res.redirect('/mypage')
});

app.get('/signup', function (req, res) {
  res.render('signup.ejs')
});

// mypage 내가 작성한 글만 보이게
app.get('/mypage', loginCheck, function (req, res) {
  console.log(req.user);
  db.collection('post').find({user : req.user._id}).toArray(function (err, result) {
    res.render('mypage.ejs', { posts: result }); //랜더링해주는 문법
  });
});





app.get('/', function (req, res) {
  res.render('index.ejs');
});
app.get('/write', function (req, res) {
  res.render('write.ejs');
});
// db에서 데이터 받아서 list.ejs에 렌더링
app.get('/list', function (req, res) {
  db.collection('post').find().toArray(function (err, result) {
    res.render('list.ejs', { posts: result }); //랜더링해주는 문법
  });
});



// 댓글달기 기능
app.post('/commentroom', loginCheck, function (req, res) {
  var infoData = {
    title: req.body.title,
    member: [ObjectId(req.body.postId), req.user._id],
    data: new Date()
  }
  db.collection('commentroom').insertOne(infoData).then((result) => {
    console.log(result);
  }).catch((err) => {
    console.log(err);
  })
})
app.get('/comment', loginCheck, function (req, res) {
  db.collection('commentroom').find({ member: req.user._id }).toArray().then((result) => {
    res.render('comment.ejs', { data: result });
  });
});


// 수정기능
app.get('/edit/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
    res.render('edit.ejs', { data: result })
    res.render('detail.ejs', { data: result })
  })
})

app.put('/edit', function (req, res) {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, text: req.body.text } }, function (err, result) {
    res.redirect('/list');
  })
})

app.get('/detail/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
    res.render('detail.ejs', { data: result })
  })
})

app.get('/mydetail/:id', function (req, res) {
  db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, result) {
    res.render('mypage-detail.ejs', { data: result })
  })
})



//DB저장 방법 postreq
app.post('/write', function (req, res) {
  db.collection('counter').findOne({ name: '게시물갯수' }, function (err, result) {
    var totalPost = result.totalPost;
    var userInfo = { _id: totalPost + 1, title: req.body.title, text: req.body.formText, user: req.user._id };
    db.collection('post').insertOne(userInfo, function (err, result) {
      console.log('저장완료');
      // db.collection('counter').updateOne({어떤 데이터를 수정할지},{수정값})
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (err, result) {
        if (err) { return console.log(err) };
      });
    });
  });
  res.redirect('/list');
});
//auto increment : 글번호 달아서 저장하는것 db에 거의 다 있지만 mongoDB는 없음

app.delete('/delete', function (req, res) {
  // ajax로 보내준 데이터임
  req.body._id = parseInt(req.body._id)
  var delData = { _id: req.body._id, user: req.user._id }
  db.collection('post').remove(delData, function (err, result) {
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


// 이미지 업로드 기능 -> npm install multer
let multer = require('multer');

var path = require('path');
const { ObjectID } = require('bson');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/image')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({
  storage: storage,
  // fileFilter: function (req, file, callback) {
  //   var ext = path.extname(file.originalname);
  //   if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
  //     return callback(new Error('PNG, JPG만 업로드하세요'))
  //   }
  //   callback(null, true)
  // },
});

app.get('/upload', function (req, res) {
  res.render('upload.ejs');
});
app.post('/upload', upload.single('frofile'), function (req, res) {
  res.send('저장완료');
});
app.get('/image/:imagename', function (req, res) {
  res.sendFile(__dirname + './public/image/' + req.params.imagename)
})






