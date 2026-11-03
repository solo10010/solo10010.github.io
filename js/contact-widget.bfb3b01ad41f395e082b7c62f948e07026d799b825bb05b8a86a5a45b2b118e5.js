(()=>{var g="958f1121-9a39-438a-91fd-8cab48dfef53",l="site-theme",b=`
  .app {
    --w-bg: #ffffff; --w-bg-2: #f1f5f9; --w-border: #e2e8f0; --w-text: #0f172a; --w-muted: #5b6b82;
    --w-accent: #0d9488; --w-on-accent: #ffffff;
    font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif !important;
  }
  html.site-dark .app {
    --w-bg: #111a2e; --w-bg-2: #16213a; --w-border: #1f2b47; --w-text: #e2e8f0; --w-muted: #94a3b8;
    --w-accent: #14d3b4; --w-on-accent: #07101f;
  }
  html .accent-color-bg { background-color: var(--w-accent) !important; }
  html .accent-color-text { color: var(--w-accent) !important; }
  html .accent-color-fill { fill: var(--w-accent) !important; }
  html .accent-color-border, html .accent-color-border-b { border-color: var(--w-accent) !important; }

  .app .chat, .app .container.-header, .app .container.-footer { background: var(--w-bg) !important; color: var(--w-text) !important; }
  .app .container.-body { background: var(--w-bg) !important; }
  .app .container.-header { border-bottom: 1px solid var(--w-border) !important; box-shadow: none !important; }
  .app .container.-footer { border-top: 1px solid var(--w-border) !important; }
  .app .chat { border-left: 1px solid var(--w-border) !important; }
  .app .header .title { color: var(--w-text) !important; font-weight: 700 !important; }
  .app .header .description, .app .time, .app .powered-link { color: var(--w-muted) !important; }
  .app .header .logo .image { border-radius: 10px !important; }
  .app .button-link svg, .app .button-link svg * { fill: var(--w-muted) !important; }
  .app .button-link:hover svg, .app .button-link:hover svg * { fill: var(--w-accent) !important; }

  .app .message .content { background: var(--w-bg-2) !important; color: var(--w-text) !important; border-radius: 14px !important; box-shadow: none !important; }
  .app .message:not(.-operator) .content { background: var(--w-accent) !important; color: var(--w-on-accent) !important; }
  .app .message:not(.-operator) .content .time { color: var(--w-on-accent) !important; opacity: .7; }
  .app .message .corner { display: none !important; }
  .app .message .name { color: var(--w-accent) !important; }
  .app .message .text { line-height: 1.5 !important; }

  .app .composer .textarea { background: var(--w-bg-2) !important; color: var(--w-text) !important; border: 1px solid var(--w-border) !important; border-radius: 12px !important; padding: 10px 12px !important; }
  .app .composer .textarea:focus { border-color: var(--w-accent) !important; outline: none !important; }
  .app .composer .textarea::placeholder { color: var(--w-muted) !important; }
  .app .submit-button svg, .app .submit-button svg * { fill: var(--w-accent) !important; }

  /* \u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430: \u043A\u043D\u043E\u043F\u043A\u0430 \u0434\u0432\u0430\u0436\u0434\u044B \u043F\u043E\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F, \u043E\u0442 \u043D\u0435\u0451 \u0440\u0430\u0441\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043A\u043E\u043B\u044C\u0446\u043E */
  @keyframes site-nudge { 0%, 100% { transform: rotate(0); } 15% { transform: rotate(-12deg) scale(1.06); } 30% { transform: rotate(10deg) scale(1.06); } 45% { transform: rotate(-6deg); } 60% { transform: rotate(0); } }
  @keyframes site-ring { 0% { box-shadow: 0 0 0 0 rgba(20, 211, 180, .55); } 100% { box-shadow: 0 0 0 18px rgba(20, 211, 180, 0); } }
  html.site-nudge .app:not(.-open) .btn .btn-img { animation: site-nudge 1.1s ease-in-out 2, site-ring 1.1s ease-out 2; }
  @media (prefers-reduced-motion: reduce) { html.site-nudge .app .btn .btn-img { animation: none !important; } }

  /* \u041A\u043D\u043E\u043F\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430: \u0441\u043A\u0440\u0443\u0433\u043B\u0451\u043D\u043D\u044B\u0439 \u043A\u0432\u0430\u0434\u0440\u0430\u0442 \u0432 \u0446\u0432\u0435\u0442 \u0430\u043A\u0446\u0435\u043D\u0442\u0430, \u043A\u0430\u043A \u0444\u0430\u0432\u0438\u043A\u043E\u043D \u0441\u0430\u0439\u0442\u0430 */
  .app .btn { border-radius: 18px !important; box-shadow: 0 10px 30px rgba(0, 0, 0, .35) !important; }
  .app .btn .btn-img { border-radius: 18px !important; background: var(--w-accent) !important; }
  .app .btn .btn-img svg *[fill]:not([fill="none"]) { fill: var(--w-on-accent) !important; }
  .app .unreaded-count { background: var(--w-text) !important; color: var(--w-bg) !important; }
  .app .unreaded-count .corner { display: none !important; }
`,f=document.documentElement.lang.toLowerCase().startsWith("en"),i=f?{title:"Anton Solomatin",description:"replies arrive right here, usually within a day",placeholder:"Type a message\u2026",nudgeTitle:"Have a question or an offer?",nudgeText:"Write right here \u2014 it goes straight to my Telegram.",nudgeClose:"Hide hint"}:{title:"\u0410\u043D\u0442\u043E\u043D \u0421\u043E\u043B\u043E\u043C\u0430\u0442\u0438\u043D",description:"\u043E\u0442\u0432\u0435\u0442 \u043F\u0440\u0438\u0434\u0451\u0442 \u0441\u044E\u0434\u0430 \u0436\u0435, \u043E\u0431\u044B\u0447\u043D\u043E \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0434\u043D\u044F",placeholder:"\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435\u2026",nudgeTitle:"\u0415\u0441\u0442\u044C \u0432\u043E\u043F\u0440\u043E\u0441 \u0438\u043B\u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u0435?",nudgeText:"\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u043F\u0440\u044F\u043C\u043E \u0437\u0434\u0435\u0441\u044C \u2014 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043F\u0440\u0438\u0434\u0451\u0442 \u043C\u043D\u0435 \u0432 Telegram.",nudgeClose:"\u0421\u043A\u0440\u044B\u0442\u044C \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0443"};function w(){return document.documentElement.hasAttribute("data-dark-mode")}function d(t){if(!t.querySelector(".app"))return!1;if(!t.getElementById(l)){let e=t.createElement("style");e.id=l,e.textContent=b,t.head.appendChild(e)}t.documentElement.classList.toggle("site-dark",w());let o=(e,r)=>t.querySelectorAll(e).forEach(r);return o(".header .title",e=>{e.textContent!==i.title&&(e.textContent=i.title)}),o(".header .description",e=>{e.textContent!==i.description&&(e.textContent=i.description)}),o(".composer .textarea",e=>{e.placeholder!==i.placeholder&&(e.placeholder=i.placeholder)}),o(".header .logo .image",e=>{let r=new URL("/favicon.svg",location.origin).href;e.src!==r&&(e.src=r)}),!0}function v(){let t=null,n=()=>{let r=document.getElementById("__replain_widget_iframe"),a=null;try{a=r&&r.contentDocument}catch(c){return}if(!(!a||!d(a))&&t!==a){t=a;let c=!1;new MutationObserver(()=>{c||(c=!0,requestAnimationFrame(()=>{d(a),c=!1}))}).observe(a.body,{childList:!0,subtree:!0,characterData:!0})}},o=0,e=setInterval(()=>{n(),(t||++o>120)&&clearInterval(e)},250);new MutationObserver(n).observe(document.documentElement,{attributes:!0,attributeFilter:["data-dark-mode"]})}function h(){if(window.replainSettings)return;window.replainSettings={id:g},v();let t=document.createElement("script");t.async=!0,t.src="https://widget.replain.cc/dist/client.js",document.body.appendChild(t)}var m="contact-nudge-shown";function s(){try{let t=document.getElementById("__replain_widget_iframe");return t&&t.contentDocument&&t.contentDocument.querySelector(".app")?t.contentDocument:null}catch(t){return null}}function x(){let t=s(),n=t&&(t.querySelector(".btn-img")||t.querySelector(".btn"));if(!!n)for(let o of["pointerdown","mousedown","pointerup","mouseup","click"])n.dispatchEvent(new MouseEvent(o,{bubbles:!0,cancelable:!0,view:t.defaultView}))}function y(){let t=s();if(!t||t.querySelector(".app.-open"))return;try{sessionStorage.setItem(m,"1")}catch(e){}t.documentElement.classList.add("site-nudge"),setTimeout(()=>t.documentElement.classList.remove("site-nudge"),2600);let n=document.createElement("div");n.className="contact-nudge",n.setAttribute("role","status"),n.innerHTML=`<button type="button" class="contact-nudge-text"><strong>${i.nudgeTitle}</strong><span>${i.nudgeText}</span></button><button type="button" class="contact-nudge-close" aria-label="${i.nudgeClose}">\xD7</button>`,document.body.appendChild(n),requestAnimationFrame(()=>n.classList.add("is-visible"));let o=()=>{n.classList.remove("is-visible"),setTimeout(()=>n.remove(),300)};n.querySelector(".contact-nudge-text").addEventListener("click",()=>{o(),x()}),n.querySelector(".contact-nudge-close").addEventListener("click",o),setTimeout(o,9e3)}function E(){try{if(sessionStorage.getItem(m))return}catch(r){}let t=!1,n=()=>{if(t)return;t=!0,window.removeEventListener("scroll",o),clearTimeout(e);let r=0,a=setInterval(()=>{(s()||++r>40)&&(clearInterval(a),y())},250)},o=()=>{let r=document.documentElement.scrollHeight-innerHeight;r>0&&scrollY/r>.3&&n()},e=setTimeout(n,25e3);window.addEventListener("scroll",o,{passive:!0})}E();var u=["pointerdown","keydown","scroll","touchstart"],p=()=>{u.forEach(t=>window.removeEventListener(t,p)),h()};u.forEach(t=>window.addEventListener(t,p,{once:!0,passive:!0}));setTimeout(p,4e3);})();
