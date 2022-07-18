
// 회원가입시 에러메세지 띄우기
const CHECK_ID = /[a-zA-Z][0-9a-zA-Z].{5,10}/;
const CHECK_PW = /[0-9a-zA-Z])[#?!@$%^&*-]).{6,24}/;


let idVal = $('.id-input').val();
let pwVal = $('.pw-input').val();

document.ready(function () {
  $('.form-control').on("propertychange chenge paste input", function () {
    if (CHECK_ID.test(idVal) == false) {
      idVal.addClass('error');
      alert("error")
    };
    if (CHECK_PW.test(pwVal) == false) {
      pwVal.addClass('error');
    };
  })
})
