// スマホ用メニュー　クラス追加
const ham = document.querySelector("#js-hamburger");
const nav = document.querySelector("#js-globalnav");
const header = document.querySelector("#js-header");


ham.addEventListener("click", () => {
 ham.classList.toggle("_active");
 nav.classList.toggle("_active");
 header.classList.toggle("_active");
});

// 子メニュー表示
const parentMenu = document.querySelectorAll("._has-child > a");
for (let i = 0; i < parentMenu.length; i++) {
 parentMenu[i].addEventListener("click", function(e){
  e.preventDefault();
  this.nextElementSibling.classList.toggle("active");
 })
}

// ページUP
const Main = document.querySelector("#js-main");
const PageUpBtn = document.querySelector('#js-pageup');

Main.addEventListener("scroll", () => {
 PageUpBtn?.classList.toggle("_active", Main.scrollTop > 500);
});

PageUpBtn?.addEventListener('click', () => {
 Main.scrollTo({
  top: 0,
  behavior: 'smooth'
 });
});


// キャラクター紹介タブ
// ボタン
const nameList = document.querySelectorAll(".charanamelist__item");
// コンテンツ
const charaContent = document.querySelectorAll(".charalist__item");

document.addEventListener("DOMContentLoaded", function () {
  for (let i = 0; i < nameList.length; i++) {
    nameList[i].addEventListener("click", charaSwitch);
  }
  function charaSwitch() {
    document.querySelectorAll(".active")[0]?.classList.remove("active");
    this?.classList.add("active");
    document.querySelectorAll(".show")[0].classList.remove("show");
    const aryList = Array.prototype.slice.call(nameList);
    const index = aryList.indexOf(this);
    charaContent[index].classList.add("show");
  }
});
