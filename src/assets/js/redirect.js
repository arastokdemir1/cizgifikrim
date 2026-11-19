(() => {
 const target=document.currentScript?.dataset.target;
 if(!target)return;
 const url=new URL(target,location.origin);
 if(!url.search)url.search=location.search;
 if(!url.hash)url.hash=location.hash;
 location.replace(url.href);
})();
