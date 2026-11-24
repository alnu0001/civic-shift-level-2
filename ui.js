export function controls(handler){[['priority',1],['block',2],['tow',3],['clear',4]].forEach(([id,n])=>{document.querySelector('#'+id).onclick=()=>handler(n)});addEventListener('keydown',e=>handler(+e.key))}
export function enable(id){document.querySelector('#'+id).disabled=false}
export function status(t){document.querySelector('#status').textContent=t}
