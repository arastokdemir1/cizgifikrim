import modern from './modern.js';
const labels={live:{tr:'Yayında',en:'Live'},development:{tr:'Geliştiriliyor',en:'In development'},research:{tr:'Ar-Ge',en:'Research'},maintenance:{tr:'Bakımda',en:'Maintenance'}};
const featured=modern.products.map(p=>({id:p.slug,name:p.name,description:p.short,group:'live',status:labels.live,detail:p.slug,featured:true}));
const projects=[...featured,...modern.other.map((p,i)=>{const group=p.status.tr==='Ar-Ge'?'research':p.status.tr==='Geliştiriliyor'?'development':p.status.tr==='Bakımda'?'maintenance':'live';return {id:'project-'+i,name:p.name,description:p.description,group,status:labels[group],url:p.url,featured:false};})];
export default {featured,projects,groups:Object.entries(labels).map(([id,title])=>({id,title,projects:projects.filter(p=>p.group===id)}))};
