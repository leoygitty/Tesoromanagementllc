
export const config = { runtime: 'edge' };
export default async function handler(req:Request){
  if(req.method!=='POST') return new Response(JSON.stringify({ok:false}),{status:405});
  const data = await req.json().catch(()=>null);
  if(!data) return new Response(JSON.stringify({ok:false}),{status:400});
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.HIRING_TO_EMAIL || 'Neighborhoodkrew@gmail.com';
  const from = process.env.PROMO_FROM_EMAIL || 'Neighborhood Krew <no-reply@neighborhoodkrew.com>';
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
    <h2>New Hiring Application</h2>
    <ul>
      <li><b>Name:</b> ${data.name||''}</li>
      <li><b>Email:</b> ${data.email||''}</li>
      <li><b>Phone:</b> ${data.phone||''}</li>
      <li><b>City:</b> ${data.city||''}</li>
      <li><b>Role:</b> ${data.role||''}</li>
      <li><b>Availability:</b> ${data.availability||''}</li>
    </ul>
    <p><b>Notes:</b><br/>${(data.notes||'').toString().replace(/</g,'&lt;')}</p>
  </div>`;
  if(apiKey){
    try{
      const r = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[to],subject:'New Neighborhood Krew Application',html})});
      if(!r.ok) return new Response(JSON.stringify({ok:true,emailSent:false}),{status:200});
      return new Response(JSON.stringify({ok:true,emailSent:true}),{status:200});
    }catch{
      return new Response(JSON.stringify({ok:true,emailSent:false}),{status:200});
    }
  }
  return new Response(JSON.stringify({ok:true,emailSent:false}),{status:200});
}
