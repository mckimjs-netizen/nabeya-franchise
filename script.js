const header=document.querySelector('.site-header');
addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>30),{passive:true});
const menu=document.querySelector('.mobile-menu');
const toggle=document.querySelector('.nav-toggle');
const closeMenu=()=>{menu.classList.remove('open');menu.setAttribute('aria-hidden','true');toggle.setAttribute('aria-expanded','false')};
toggle.addEventListener('click',()=>{menu.classList.add('open');menu.setAttribute('aria-hidden','false');toggle.setAttribute('aria-expanded','true')});
menu.querySelector('button').addEventListener('click',closeMenu);
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
