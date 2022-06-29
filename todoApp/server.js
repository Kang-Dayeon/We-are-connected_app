const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// method-override사용
const methodOverride = require('method-override')
app.use(methodOverride('_method'))

app.set('view engine', 'ejs');

// css파일 사용하려면 밑에 코드 추가 = 미들웨어
app.use('/public', express.static('public'));

var db; //데이터 베이스를 저장하기 위한 변수
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb+srv://dykang:diak4428@cluster0.6n3fc.mongodb.net/todoapp?retryWrites=true&w=majority', function (에러, client) {

  db = client.db('todoapp'); //todoapp이라는 database에 연결함

  // db.collection('post').insertOne({ _id: 1, 이름: 'dy', 나이: 27 }, function (에러, 결과) {
  //   console.log('저장완료');
  // });
  //insertOne()은 내가 저장할 데이터를 넣는 함수



  app.listen(4040, function () {
    console.log('lisening on 4040');
  });
})
app.use(express.urlencoded({ extended: true }))



//서버를 띄우기 위한 기본 셋팅 (express라이브러리)
// .listen(파라미터1, 파라미터2)
// .listen(서버띄울 포트번호, 띄운 후 실행 할 코드)

//예제
//누군가 '/pet'으로 방문하면 pet관련 안내문 띄우기
// app.get('/pet', function (요청, 응답) {
//   응답.send('펫용품 사이트 입니다🐶');
// });

// app.get('/beauty', function (요청, 응답) {
//   응답.send('뷰티용품 쇼핑 페이지입니다💄');
// });

// app.get('/', function (요청, 응답) {
//   응답.sendFile(__dirname + './view/index.ejs');
// });

app.get('/', function (요청, 응답) {
  응답.render('index.ejs'); //랜더링해주는 문법
});
// '/'이렇게 슬레시가 하나인경우는 페이지 메인(홈)이라는 뜻임
// .sendFile(보낼파일경로) 이게 html파일 보여주는 코드임
// __dirname은 direction name의 줄임말임 현재 실행중이 폴더 경로를 뜻함
// __filename 은 현재 실행중인 파일 경로를 뜻함

// app.get('/write', function (요청, 응답) {
//   응답.sendFile(__dirname + './view/write.ejs');
// });

app.get('/write', function (요청, 응답) {
  응답.render('write.ejs'); //랜더링해주는 문법
});

//post요청 받기
// 사용자가 /add 경로로 post요청하면 함수 실행해주세요
// 요청을 쉽게 하기 위해 npm install body-parser 라이브러리 설치
// app.post('/add', function (요청, 응답) {
//   console.log(요청.body);
//   응답.send('전송완료')
// });

//DB저장 방법
app.post('/write', function (요청, 응답) {
  db.collection('counter').findOne({ name: '게시물갯수' }, function (에러, 결과) {
    // console.log(결과.totalPost);
    var totalPost = 결과.totalPost;
    db.collection('post').insertOne({ _id: totalPost + 1, title: 요청.body.title, text: 요청.body.formText }, function (에러, 결과) {
      // console.log('저장완료');
      // db.collection('counter').updateOne({어떤 데이터를 수정할지},{수정값})
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) { return console.log(에러) };
      });
    });
  });
  응답.redirect('/list');
});
//auto increment : 글번호 달아서 저장하는것 db에 거의 다 있지만 mongoDB는 없음

// db에서 데이터 받아서 list.ejs에 렌더링
app.get('/list', function (요청, 응답) {
  db.collection('post').find().toArray(function (에러, 결과) {
    console.log(결과);
    응답.render('list.ejs', { posts: 결과 }); //랜더링해주는 문법
  });
});

app.delete('/delete', function (요청, 응답) {
  요청.body._id = parseInt(요청.body._id)
  db.collection('post').deleteOne(요청.body._id, function (에러, 결과) {
    응답.status(200).send({ message: '성공' });
    // 응답.status(400);
  });
  // 응답.send('삭제완료');
});


app.get('/detail/:id', function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    응답.render('detail.ejs', { data: 결과 })
    if (에러) {
      응답.status(500).send({ message: '실패' });
    }
  });
});

app.get('/edit/:id', function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    응답.render('edit.ejs', { data: 결과 })
    응답.render('detail.ejs', { data: 결과 })
  })
})

app.put('/edit', function (요청, 응답) {
  db.collection('post').updateOne({ _id: parseInt(요청.body.id) }, { $set: { title: 요청.body.title, text: 요청.body.text } }, function (에러, 결과) {
    console.log('수정완료');
    응답.redirect('/list');
  })
})

const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session')

app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function (요청, 응답) {
  응답.render('login.ejs')
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (요청, 응답) {
  응답.redirect('/')
});

app.get('/mypage', 로그인했니, function (요청, 응답) {
  응답.render('mypage.ejs')
});

// 미들웨어 만들기
function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    next()
  } else {
    응답.send('로그인 안했음')
  }
}

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));
// done(서버에러, 성공시사용자DB데이터, 콜백함수) : 세개의 파라미터를 가짐
passport.serializeUser(function (user, done) {
  done(null, user.id)
});
passport.deserializeUser(function (아이디, done) {
  done(null, {})
});
