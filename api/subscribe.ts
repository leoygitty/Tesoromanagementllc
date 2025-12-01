
export const config = { runtime: 'edge' };
function makeCode(prefix='NK'){ const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const seg=n=>Array.from({length:n},()=>a[Math.floor(Math.random()*a.length)]).join(''); return `${prefix}-${seg(4)}-${seg(4)}`; }
export default async function handler(req:Request){ if(req.method!=='POST') return new Response(JSON.stringify({ok:false}),{status:405});
  const {email}=await req.json().catch(()=>({})); if(!email) return new Response(JSON.stringify({ok:false,error:'Missing email'}),{status:400});
  const code=makeCode(); const apiKey=process.env.RESEND_API_KEY; const from=process.env.PROMO_FROM_EMAIL||'Neighborhood Krew <no-reply@neighborhoodkrew.com>';
  if(apiKey){ try{ const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:`Your Neighborhood Krew Promo Code: ${code}`,html:`<strong>Your code: ${code}</strong>`})}); if(!r.ok) return new Response(JSON.stringify({ok:true,code,emailSent:false}),{status:200}); return new Response(JSON.stringify({ok:true,code,emailSent:true}),{status:200}); }catch{ return new Response(JSON.stringify({ok:true,code,emailSent:false}),{status:200}); } }
  return new Response(JSON.stringify({ok:true,code,emailSent:false}),{status:200}); }
