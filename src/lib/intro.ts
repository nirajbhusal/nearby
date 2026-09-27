/** Runs in <head> on the home document only. One intro per tab session. */
export const introBoot = `(function(){
try{
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var path=location.pathname.replace(/\\/+$/,"")||"/";
  if(path!=="/nearby"&&path!=="/")return;
  if(sessionStorage.getItem("nearby-intro-seen"))return;
  sessionStorage.setItem("nearby-intro-seen","1");
  document.documentElement.dataset.intro="play";
}catch(e){}
})();`;
