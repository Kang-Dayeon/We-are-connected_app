const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }))

app.listen(4040, function () {
  console.log('lisening on 4040');
});
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

app.get('/', function (요청, 응답) {
  응답.sendFile(__dirname + '/index.html');
});
// '/'이렇게 슬레시가 하나인경우는 페이지 메인(홈)이라는 뜻임
// .sendFile(보낼파일경로) 이게 html파일 보여주는 코드임
// __dirname은 direction name의 줄임말임 현재 실행중이 폴더 경로를 뜻함
// __filename 은 현재 실행중인 파일 경로를 뜻함

app.get('/write', function (요청, 응답) {
  응답.sendFile(__dirname + '/write.html');
});

//post요청 받기
// 사용자가 /add 경로로 post요청하면 함수 실행해주세요
// 요청을 쉽게 하기 위해 npm install body-parser 라이브러리 설치
app.post('/add', function (요청, 응답) {
  응답.send('전송완료')
  console.log(요청.body.title);
});