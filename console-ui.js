// Presentation-only workspace navigation. Receipt and package logic stays in app.js.
function reflectWorkspaceAnchor(){
 const active=['#capture','#batch','#handoff'].includes(location.hash)?location.hash:'#capture';
 document.querySelectorAll('.workspace-nav a').forEach(a=>{
  if(a.getAttribute('href')===active)a.setAttribute('aria-current','location');
  else a.removeAttribute('aria-current');
 });
}
window.addEventListener('hashchange',reflectWorkspaceAnchor);
reflectWorkspaceAnchor();
