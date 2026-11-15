export const viewNames={overview:'Visão geral',studio:'Estúdio de criação',mediaLibrary:'Biblioteca de imagens',brand:'Identidade da marca',campaigns:'Campanhas e cortes',integrations:'Centro de integrações',exports:'Exportações'};
const paths={'/':'overview','/overview':'overview','/studio':'studio','/library':'mediaLibrary','/brand':'brand','/campaigns':'campaigns','/integrations':'integrations','/exports':'exports'};
const legacy={editor:'studio',result:'studio',scenes:'studio'};
export function resolveView(pathname,hash){const key=String(hash??'').replace(/^#/u,'');if(Object.hasOwn(viewNames,key))return key;if(Object.hasOwn(legacy,key))return legacy[key];return Object.hasOwn(paths,pathname)?paths[pathname]:'overview';}
export function setupNavigation({onChange=()=>{}}={}){
 let active;
 function apply(){const route=resolveView(window.location.pathname,window.location.hash);if(active===route)return;active=route;const status=document.getElementById('status');if(status)status.textContent='';
  for(const panel of document.querySelectorAll('[data-view]'))panel.hidden=panel.dataset.view!==route;
  for(const link of document.querySelectorAll('nav a[data-route]')){if(link.dataset.route===route)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  document.getElementById('breadcrumb').textContent='WORKSPACE / '+viewNames[route].toLocaleUpperCase('pt-BR');document.title='AXON VOICE · '+viewNames[route];
  const panel=document.querySelector(`[data-view="${route}"]`),heading=panel?.querySelector('h1,h2');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}window.scrollTo({top:0,behavior:'instant'});onChange(route);
 }
 window.addEventListener('hashchange',apply);
 return {start:apply,go(route){if(!Object.hasOwn(viewNames,route))return;window.location.hash=route;apply();},current:()=>active};
}
