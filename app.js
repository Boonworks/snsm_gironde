let toggle = document.querySelector('.toggle');
let body = document.querySelector('body');
let liens = document.getElementsByClassName('menu__link');

for(let i = 0 ; i < liens.length ; i++) {
    liens[i].addEventListener('click', function() {
        body.classList.toggle('open');
    })
}

toggle.addEventListener('click', function() {
    body.classList.toggle('open');
})

let tl = gsap.timeline();

tl.from('.accueil', {   /* temps page de fond */ 
    duration: 0.1,
    filter: "blur(10px)"
})

tl.from('.overlay', { /* temps bleu */
    duration: 1,
    x: '-100%'
})

tl.from('.logo, .menu, .toggle', { /* temps menu */
    duration: 0.7,
    opacity: 0,
/*     filter: "blur(5px)"
 */});

tl.from('.accueil__text__top, .accueil__text__mid, .accueil__text__bot', { /* temps titre*/
    duration: 0.5,
    opacity: 0    
})

tl.from('.accueil__text__top .sep', { /* temps barre */
    duration: 0.7,
    width: '0px'
})





/* NEW */



const images = document.querySelectorAll(".album__item");
const lightbox = document.querySelector(".lightbox");
const lightboxImg = document.querySelector(".lightbox__img");
const closeBtn = document.querySelector(".close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

let currentIndex = 0;

function showImage(index) {
  lightbox.classList.add("active");
  lightboxImg.src = images[index].src;
  currentIndex = index;
}

images.forEach((img, index) => {
  img.addEventListener("click", () => showImage(index));
});

closeBtn.addEventListener("click", () => {
  lightbox.classList.remove("active");
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex);
});

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex);
});

document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
  
    switch (e.key) {
      case "ArrowRight":
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
        break;
      case "ArrowLeft":
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
        break;
      case "Escape":
        lightbox.classList.remove("active");
        break;
    }
  });
  



for (let i = 0; i < liens.length; i++) {
    liens[i].addEventListener('click', function (e) {
        // Empêche la fermeture quand on clique sur Formation (sous-menu)
        if (this.closest('.has-submenu')) return;
        body.classList.toggle('open');
    });
}

toggle.addEventListener('click', function () {
    body.classList.toggle('open');
});

// ---- Gestion du sous-menu mobile ----
const submenuToggle = document.querySelector('.submenu-toggle');
const parentSubmenu = submenuToggle.closest('.has-submenu');

submenuToggle.addEventListener('click', function (e) {
    e.preventDefault(); // On empêche la redirection
    parentSubmenu.classList.toggle('open');
});
