import { useState, useEffect, useCallback, useRef } from "react";

/* ─── SUPABASE CONFIG ───────────────────────────────────────────── */
const SB_URL = "https://oafyyrjwhcpfcikszahp.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZnl5cmp3aGNwZmNpa3N6YWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTAxMjUsImV4cCI6MjA5ODQyNjEyNX0.MBGx7e-KrDKvtIvCwIkHlWXmJrxwh0v2S64HeDU-Npk";

async function fetchCloud(pin) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/fetch_data`, {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`},
      body: JSON.stringify({ p_pin: pin }),
    });
    if (!r.ok) return null;
    return await r.json();
  } catch(_) { return null; }
}

async function saveCloud(pin, payload) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/rpc/save_data`, {
      method:"POST",
      headers:{"Content-Type":"application/json","apikey":SB_KEY,"Authorization":`Bearer ${SB_KEY}`},
      body: JSON.stringify({ p_pin: pin, p_payload: payload }),
    });
    return r.ok;
  } catch(_) { return false; }
}

/* ─── KEYS ──────────────────────────────────────────────────────── */
const PHOTO_PREFIX  = "nw-photo-";
const CACHE_KEY     = "nw-cache";
const PIN_KEY       = "nw-pin";
const EXPORT_KEY    = "nw-last-export";
const PROFILE_PREFIX = "nw-pp-";

/* ─── DEFAULT SEEDS ─────────────────────────────────────────────── */
const DEFAULT_INDUSTRIES = [
  "Real Estate","Food & Beverage","Raw Material","Fashion & Merch",
  "Energy","Manufacturing","FMCG","Beauty & Skincare",
  "Music & Entertainment","Electronics",
];
const DEFAULT_CTX = [
  { id:"event",  icon:"🎤", label:"Event",  bg:"#F5F3FF", fg:"#6D28D9" },
  { id:"work",   icon:"💼", label:"Work",   bg:"#EFF6FF", fg:"#1D4ED8" },
  { id:"social", icon:"☕", label:"Social", bg:"#FFFBEB", fg:"#92400E" },
  { id:"other",  icon:"✨", label:"Other",  bg:"#F0FDF4", fg:"#166534" },
];
const TREE_TYPES = [
  { id:"company", icon:"🏢", label:"Company",      bg:"#EFF6FF", fg:"#1D4ED8" },
  { id:"family",  icon:"👨‍👩‍👧", label:"Family",       bg:"#F0FDF4", fg:"#166534" },
  { id:"social",  icon:"👥", label:"Social Group", bg:"#F5F3FF", fg:"#6D28D9" },
  { id:"other",   icon:"🔗", label:"Other",        bg:"#FEF3C7", fg:"#92400E" },
];
const CAUTION_LEVELS = [
  { id:"red",    label:"High Risk", color:"#EF4444", bg:"#FEE2E2", icon:"🔴" },
  { id:"orange", label:"Moderate",  color:"#F97316", bg:"#FFF7ED", icon:"🟠" },
  { id:"yellow", label:"Be Aware",  color:"#EAB308", bg:"#FEFCE8", icon:"🟡" },
];

/* ─── CONSTANTS ─────────────────────────────────────────────────── */
const GRADIENTS = [
  ["#6366F1","#8B5CF6"],["#EC4899","#F43F5E"],["#0EA5E9","#06B6D4"],
  ["#10B981","#059669"],["#F59E0B","#F97316"],["#A855F7","#7C3AED"],
  ["#0891B2","#0E7490"],["#BE185D","#9D174D"],["#22C55E","#16A34A"],
  ["#F97316","#DC2626"],
];
const IND_COLORS = [
  {bg:"#FEF3C7",fg:"#92400E"},{bg:"#FCE7F3",fg:"#9D174D"},
  {bg:"#ECFDF5",fg:"#065F46"},{bg:"#EDE9FE",fg:"#5B21B6"},
  {bg:"#FFF7ED",fg:"#9A3412"},{bg:"#F0F9FF",fg:"#0C4A6E"},
  {bg:"#FDF4FF",fg:"#701A75"},{bg:"#FEF2F2",fg:"#991B1B"},
  {bg:"#F7FEE7",fg:"#365314"},{bg:"#EFF6FF",fg:"#1E3A8A"},
];
const SOCIALS = [
  { id:"instagram", label:"Instagram", abbr:"IG", placeholder:"@username or profile URL", grad:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" },
  { id:"facebook",  label:"Facebook",  abbr:"f",  placeholder:"@username or profile URL", grad:"#1877F2" },
  { id:"line",      label:"Line",      abbr:"L",  placeholder:"Line ID or profile URL",   grad:"#00B900" },
];
const EXTRA_CTX_PALETTE = [
  {bg:"#FFF0F5",fg:"#9B1B4B"},{bg:"#FFF8E7",fg:"#875A00"},
  {bg:"#F0FFF4",fg:"#166534"},{bg:"#F0F4FF",fg:"#3730A3"},
  {bg:"#FFF5F0",fg:"#9A3412"},{bg:"#F5F5FF",fg:"#4F46E5"},
];
const TAB_H = 58;

/* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
const C = {
  navy:"#1B2A5C", amber:"#F59E0B", bg:"#EEF1F8", white:"#FFFFFF",
  text:"#111827", muted:"#6B7280", border:"#E5E7EB",
  red:"#EF4444",  redBg:"#FEE2E2", blue:"#1D4ED8", blueBg:"#EFF6FF",
};

/* ─── HELPERS ───────────────────────────────────────────────────── */
const uid  = () => `c${Date.now()}${Math.random().toString(36).slice(2,5)}`;
const tuid = () => `t${Date.now()}${Math.random().toString(36).slice(2,5)}`;
const muid = () => `m${Date.now()}${Math.random().toString(36).slice(2,5)}`;
const kuid = () => `k${Date.now()}${Math.random().toString(36).slice(2,5)}`;

function gradient(name="") {
  let h=5381; for(let i=0;i<name.length;i++) h=((h<<5)+h+name.charCodeAt(i))|0;
  const [a,b]=GRADIENTS[Math.abs(h)%GRADIENTS.length];
  return `linear-gradient(135deg,${a},${b})`;
}
function initials(name="") { return name.trim().split(/\s+/).filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?"; }
function ctxFor(id,list)   { return (list||DEFAULT_CTX).find(c=>c.id===id)??(list||DEFAULT_CTX)[0]??{id:"?",icon:"👤",label:"Other",bg:"#F3F4F6",fg:"#374151"}; }
function treeTypeFor(id)   { return TREE_TYPES.find(t=>t.id===id)??TREE_TYPES[3]; }
function cautLevelFor(id)  { return CAUTION_LEVELS.find(l=>l.id===id)??CAUTION_LEVELS[2]; }
function indColor(i)       { return IND_COLORS[((i%IND_COLORS.length)+IND_COLORS.length)%IND_COLORS.length]; }
function displayName(c)    { return c.nickname||c.name||""; }
function socialUrl(id,value) {
  if(!value) return null; const v=value.trim();
  if(v.startsWith("http")) return v; const h=v.replace(/^@/,"");
  if(id==="instagram") return `https://www.instagram.com/${h}`;
  if(id==="facebook")  return `https://www.facebook.com/${h}`;
  if(id==="line")      return `https://line.me/ti/p/~${h}`;
  return v;
}
async function resizeImage(file) {
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=900;let w=img.width,h=img.height;
        if(w>h){if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}}else{if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}}
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);resolve(cv.toDataURL("image/jpeg",0.72));
      };img.src=e.target.result;
    };reader.readAsDataURL(file);
  });
}

async function resizeProfilePhoto(file) {
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const SIZE=240;
        const s=Math.min(img.width,img.height);
        const sx=(img.width-s)/2,sy=(img.height-s)/2;
        const cv=document.createElement("canvas");cv.width=SIZE;cv.height=SIZE;
        cv.getContext("2d").drawImage(img,sx,sy,s,s,0,0,SIZE,SIZE);
        resolve(cv.toDataURL("image/jpeg",0.65));
      };img.src=e.target.result;
    };reader.readAsDataURL(file);
  });
}

/* ─── DATA HELPERS ──────────────────────────────────────────────── */
function blank(ctxId="event") {
  return {nickname:"",fullName:"",role:"",company:"",context:ctxId,contextNote:"",
          industryTags:[],funFact:"",notes:"",
          profilePhoto:null,profilePhotoCleared:false,
          cardPhoto:null,cardPhotoCleared:false,
          socials:{instagram:"",facebook:"",line:""}};
}
function formToContact(form,existingId) {
  return {id:existingId||uid(),nickname:form.nickname.trim(),fullName:form.fullName.trim(),
    role:form.role.trim(),company:form.company.trim(),context:form.context,contextNote:form.contextNote.trim(),
    industryTags:form.industryTags||[],funFact:form.funFact.trim(),notes:form.notes.trim(),
    socials:{instagram:(form.socials?.instagram||"").trim(),facebook:(form.socials?.facebook||"").trim(),line:(form.socials?.line||"").trim()},
    addedAt:existingId?undefined:new Date().toISOString()};
}
function contactToForm(c,profilePhoto=null,cardPhoto=null) {
  return {nickname:c.nickname||c.name||"",fullName:c.fullName||"",role:c.role||"",company:c.company||"",
    context:c.context||"event",contextNote:c.contextNote||"",industryTags:c.industryTags||c.tags||[],
    funFact:c.funFact||(c.helpsWith||[]).join(", ")||"",notes:c.notes||"",
    profilePhoto,profilePhotoCleared:false,cardPhoto,cardPhotoCleared:false,
    socials:{instagram:c.socials?.instagram||"",facebook:c.socials?.facebook||"",line:c.socials?.line||""}};
}

/* ─── UI ATOMS ──────────────────────────────────────────────────── */
function FL({children}) { return <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>{children}</div>; }
function InfoCard({children,style}) { return <div style={{background:C.white,borderRadius:14,padding:"13px 15px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",...style}}>{children}</div>; }
function MiniChip({bg,fg,children}) { return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:700,background:bg,color:fg}}>{children}</span>; }
function NavBack({onClick}) { return <button onClick={onClick} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:9,padding:"7px 13px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>← Back</button>; }
function Hr() { return <div style={{height:1,background:C.border,margin:"11px 0"}}/>; }
const INP={width:"100%",border:"none",outline:"none",fontSize:15,color:C.text,background:"transparent",padding:0,fontFamily:"inherit"};

/* ─── PIN SCREEN ────────────────────────────────────────────────── */
function PinScreen({onUnlock}) {
  const [entry,    setEntry]    = useState("");
  const [error,    setError]    = useState("");
  const [checking, setChecking] = useState(false);

  const add = (d) => { if(entry.length < 8 && !checking) setEntry(p=>p+d); };
  const del = () => { if(!checking) setEntry(p=>p.slice(0,-1)); };
  const submit = async () => {
    if(!entry||checking) return;
    setChecking(true); setError("");
    const data = await fetchCloud(entry);
    if(data !== null) {
      localStorage.setItem(PIN_KEY, entry);
      onUnlock(entry, data);
    } else {
      setError("Incorrect PIN — try again.");
      setEntry("");
    }
    setChecking(false);
  };

  return (
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",maxWidth:480,margin:"0 auto",padding:"0 24px"}}>
      <div style={{fontSize:56,marginBottom:10}}>🤝</div>
      <div style={{color:"#fff",fontSize:26,fontWeight:800,marginBottom:4,letterSpacing:-0.5}}>My Network</div>
      <div style={{color:"rgba(255,255,255,0.45)",fontSize:14,marginBottom:44}}>Enter your PIN to continue</div>

      {/* PIN dots */}
      <div style={{display:"flex",gap:14,marginBottom:16}}>
        {Array.from({length:Math.max(entry.length,4)}).map((_,i)=>(
          <div key={i} style={{width:14,height:14,borderRadius:7,background:i<entry.length?"#F59E0B":"rgba(255,255,255,0.18)",transition:"background 0.1s"}}/>
        ))}
      </div>

      <div style={{height:22,marginBottom:28,color:"#F87171",fontSize:13,fontWeight:600,textAlign:"center"}}>
        {checking ? "Checking…" : error}
      </div>

      {/* Number pad */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 76px)",gap:12}}>
        {[1,2,3,4,5,6,7,8,9,"⌫",0,"↵"].map(k=>{
          const isEnter = k==="↵";
          const isDel   = k==="⌫";
          const disabled= checking||(isEnter&&!entry);
          return (
            <button key={k} onClick={()=>{ if(isDel) del(); else if(isEnter) submit(); else add(String(k)); }}
              disabled={disabled}
              style={{width:76,height:76,borderRadius:38,border:"none",
                background:isEnter?(entry&&!checking?"#F59E0B":"rgba(255,255,255,0.06)"):"rgba(255,255,255,0.09)",
                color:isEnter?(entry&&!checking?"#fff":"rgba(255,255,255,0.2)"):"#fff",
                fontSize:typeof k==="number"?26:20,fontWeight:700,
                cursor:disabled?"default":"pointer",fontFamily:"inherit",
                transition:"background 0.15s, transform 0.1s",
              }}>
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TAB BAR ───────────────────────────────────────────────────── */
function TabBar({active,onChange}) {
  const tabs=[{id:"network",icon:"🤝",label:"My Network"},{id:"trees",icon:"🌳",label:"Trees"},{id:"cautious",icon:"⚠️",label:"Cautious"}];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:40,height:TAB_H}}>
      {tabs.map(tab=>(
        <button key={tab.id} onClick={()=>onChange(tab.id)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",position:"relative",paddingBottom:4}}>
          <span style={{fontSize:20,lineHeight:1}}>{tab.icon}</span>
          <span style={{fontSize:9,fontWeight:700,color:active===tab.id?C.navy:C.muted}}>{tab.label}</span>
          {active===tab.id&&<div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:32,height:2.5,background:C.navy,borderRadius:2}}/>}
        </button>
      ))}
    </div>
  );
}

/* ─── ORG CHART ─────────────────────────────────────────────────── */
function OrgChart({members,contacts,profilePhotos={},onNodePress}) {
  if(!members||members.length===0) return null;
  const NW=118,NH=72,HG=16,VG=50,PAD=20;
  const childOf={};
  members.forEach(m=>{const pid=m.parentMemberId||"__root__";(childOf[pid]=childOf[pid]||[]).push(m.id);});
  const sw={};
  function calcSW(id){const ch=childOf[id]||[];if(ch.length===0){sw[id]=NW;return NW;}const total=ch.reduce((s,c)=>s+calcSW(c),0)+HG*(ch.length-1);sw[id]=Math.max(NW,total);return sw[id];}
  const roots=childOf["__root__"]||[]; roots.forEach(r=>calcSW(r));
  const pos={};
  function calcPos(id,cx,y){pos[id]={cx,y};const ch=childOf[id]||[];if(ch.length===0)return;const totalW=ch.reduce((s,c)=>s+sw[c],0)+HG*(ch.length-1);let x=cx-totalW/2;ch.forEach(c=>{calcPos(c,x+sw[c]/2,y+NH+VG);x+=sw[c]+HG;});}
  const totalW=roots.reduce((s,r)=>s+sw[r],0)+HG*(roots.length-1);
  let rx=0; roots.forEach(r=>{calcPos(r,rx+sw[r]/2,0);rx+=sw[r]+HG;});
  const maxY=Math.max(...Object.values(pos).map(p=>p.y));
  const svgW=Math.max(totalW,280)+PAD*2; const svgH=maxY+NH+PAD;
  return (
    <div style={{overflowX:"auto",padding:"8px 0 16px"}}>
      <div style={{position:"relative",width:svgW,height:svgH,margin:"0 auto",minWidth:"100%"}}>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible",pointerEvents:"none"}}>
          {members.map(m=>{
            if(!m.parentMemberId||!pos[m.parentMemberId]||!pos[m.id]) return null;
            const pp=pos[m.parentMemberId],cp=pos[m.id];
            const x1=pp.cx+PAD,y1=pp.y+NH,x2=cp.cx+PAD,y2=cp.y,my=(y1+y2)/2;
            return <path key={m.id} d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`} stroke="#CBD5E1" strokeWidth="1.5" fill="none"/>;
          })}
        </svg>
        {members.map(m=>{
          if(!pos[m.id]) return null;
          const p=pos[m.id],contact=contacts.find(c=>c.id===m.contactId),dn=contact?displayName(contact):"Unknown";
          return (
            <div key={m.id} onClick={()=>contact&&onNodePress(contact)}
              style={{position:"absolute",left:p.cx-NW/2+PAD,top:p.y,width:NW,height:NH,background:C.white,borderRadius:12,boxShadow:"0 2px 8px rgba(0,0,0,0.08)",border:`1.5px solid ${C.border}`,cursor:contact?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,padding:"8px 6px",overflow:"hidden"}}>
              {profilePhotos[m.contactId]?(<img src={profilePhotos[m.contactId]} alt="" style={{width:32,height:32,borderRadius:9,objectFit:"cover",flexShrink:0}}/>):(<div style={{width:32,height:32,borderRadius:9,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800,flexShrink:0}}>{initials(dn)}</div>)}
              <div style={{width:"100%",textAlign:"center",lineHeight:1.25}}>
                <div style={{fontSize:11,fontWeight:700,color:contact?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</div>
                {m.role&&<div style={{fontSize:9,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{m.role}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────────────── */
export default function App() {
  /* Auth */
  const [pin,               setPin]              = useState("");
  const [needPin,           setNeedPin]          = useState(true);
  const [lastSynced,        setLastSynced]       = useState(null);
  const [showExportReminder,setShowExportReminder]= useState(false);
  const [profilePhotos,     setProfilePhotos]     = useState({});
  /* Data */
  const [contacts,     setContacts]     = useState([]);
  const [industries,   setIndustries]   = useState(DEFAULT_INDUSTRIES);
  const [contexts,     setContexts]     = useState(DEFAULT_CTX);
  const [trees,        setTrees]        = useState([]);
  const [cautions,     setCautions]     = useState([]);
  /* Network view */
  const [view,         setView]         = useState("list");
  const [selected,     setSelected]     = useState(null);
  const [selectedPhoto,     setSelectedPhoto]     = useState(null);
  const [selectedCardPhoto, setSelectedCardPhoto] = useState(null);
  const [isEdit,       setIsEdit]       = useState(false);
  const [form,         setForm]         = useState(blank());
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState("all");
  const [delConfirm,   setDelConfirm]   = useState(false);
  const [detailOrigin, setDetailOrigin] = useState("network");
  /* Tree view */
  const [tView,        setTView]        = useState("list");
  const [selTree,      setSelTree]      = useState(null);
  const [editTree,     setEditTree]     = useState(null);
  const [tPickSearch,  setTPickSearch]  = useState("");
  const [treeDelCfm,   setTreeDelCfm]   = useState(false);
  /* Cautious view */
  const [cautView,     setCautView]     = useState("list");
  const [selCaut,      setSelCaut]      = useState(null);
  const [editCaut,     setEditCaut]     = useState(null);
  const [cautPickSrch, setCautPickSrch] = useState("");
  const [cautDelCfm,   setCautDelCfm]   = useState(false);
  /* Global */
  const [activeTab,    setActiveTab]    = useState("network");
  const [ready,        setReady]        = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [indOpen,      setIndOpen]      = useState(false);
  const [ctxOpen,      setCtxOpen]      = useState(false);
  const [newInd,       setNewInd]       = useState("");
  const [newCtx,       setNewCtx]       = useState("");
  const [editIndIdx,   setEditIndIdx]   = useState(null);
  const [editIndVal,   setEditIndVal]   = useState("");
  const [editCtxId,    setEditCtxId]    = useState(null);
  const [editCtxVal,   setEditCtxVal]   = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [showQInd,     setShowQInd]     = useState(false);
  const [qIndVal,      setQIndVal]      = useState("");
  const [showQCtx,     setShowQCtx]     = useState(false);
  const [qCtxVal,      setQCtxVal]      = useState("");
  const profilePhotoRef = useRef(null);
  const cardPhotoRef    = useRef(null);
  const importRef       = useRef(null);

  /* ── Load on startup ── */
  useEffect(()=>{
    (async()=>{
      const savedPin = localStorage.getItem(PIN_KEY);
      if(savedPin) {
        const cloudData = await fetchCloud(savedPin);
        if(cloudData !== null) {
          setPin(savedPin);
          applyData(cloudData);
          setNeedPin(false);
        } else {
          /* offline: try local cache */
          try {
            const cached = localStorage.getItem(CACHE_KEY);
            if(cached) { const d=JSON.parse(cached);applyData(d);const ppMap={};(d.contacts||[]).forEach(c=>{const p=localStorage.getItem(PROFILE_PREFIX+c.id);if(p)ppMap[c.id]=p;});setProfilePhotos(ppMap);setPin(savedPin); setNeedPin(false); }
            else { localStorage.removeItem(PIN_KEY); setNeedPin(true); }
          } catch(_) { setNeedPin(true); }
        }
      } else {
        setNeedPin(true);
      }
      setReady(true);
    })();
  },[]);

  function applyData(data) {
    if(!data) return;
    if(Array.isArray(data.contacts))   setContacts(data.contacts);
    if(Array.isArray(data.industries)) setIndustries(data.industries);
    if(Array.isArray(data.contexts))   setContexts(data.contexts);
    if(Array.isArray(data.trees))      setTrees(data.trees);
    if(Array.isArray(data.cautions))   setCautions(data.cautions);
  }

  const handleUnlock = (enteredPin, cloudData) => {
    setPin(enteredPin);
    if(cloudData) applyData(cloudData);
    setNeedPin(false);
  };

  /* ── Cloud + cache sync ── */
  const persistAll = (overrides={}) => {
    const payload = {
      contacts:   "contacts"   in overrides ? overrides.contacts   : contacts,
      industries: "industries" in overrides ? overrides.industries : industries,
      contexts:   "contexts"   in overrides ? overrides.contexts   : contexts,
      trees:      "trees"      in overrides ? overrides.trees      : trees,
      cautions:   "cautions"   in overrides ? overrides.cautions   : cautions,
    };
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch(_) {}
    if(pin) {
      saveCloud(pin, payload).then(ok => { if(ok) setLastSynced(new Date()); });
    }
  };

  /* ── Slice save helpers ── */
  const saveInds  = (l) => { setIndustries(l); persistAll({industries:l}); };
  const saveCtxs  = (l) => { setContexts(l);   persistAll({contexts:l}); };
  const saveTrees = (l) => { setTrees(l);       persistAll({trees:l}); };
  const saveCauts = (l) => { setCautions(l);    persistAll({cautions:l}); };
  const persist   = (l) => { setContacts(l);    persistAll({contacts:l}); };

  /* ── Industry management ── */
  const addIndustry   =()=>{const n=newInd.trim();if(!n||industries.some(x=>x.toLowerCase()===n.toLowerCase()))return;saveInds([...industries,n]);setNewInd("");};
  const removeIndustry=(i)=>{const name=industries[i];saveInds(industries.filter((_,j)=>j!==i));if(filter===name)setFilter("all");};
  const commitEditInd =(i)=>{const n=editIndVal.trim();if(!n){setEditIndIdx(null);return;}const old=industries[i];saveInds(industries.map((v,j)=>j===i?n:v));if(filter===old)setFilter(n);setEditIndIdx(null);};
  const quickAddInd   =()=>{const n=qIndVal.trim();if(!n||industries.some(x=>x.toLowerCase()===n.toLowerCase())){setShowQInd(false);setQIndVal("");return;}saveInds([...industries,n]);setForm(p=>({...p,industryTags:[...(p.industryTags||[]),n]}));setQIndVal("");setShowQInd(false);};

  /* ── Context management ── */
  const addContext    =()=>{const l=newCtx.trim();if(!l||contexts.some(c=>c.label.toLowerCase()===l.toLowerCase()))return;const col=EXTRA_CTX_PALETTE[contexts.length%EXTRA_CTX_PALETTE.length];saveCtxs([...contexts,{id:`ctx_${Date.now()}`,icon:"✨",label:l,bg:col.bg,fg:col.fg}]);setNewCtx("");};
  const removeContext =(id)=>saveCtxs(contexts.filter(c=>c.id!==id));
  const commitEditCtx =(id)=>{const l=editCtxVal.trim();if(!l){setEditCtxId(null);return;}saveCtxs(contexts.map(c=>c.id===id?{...c,label:l}:c));setEditCtxId(null);};
  const quickAddCtx   =()=>{const l=qCtxVal.trim();if(!l||contexts.some(c=>c.label.toLowerCase()===l.toLowerCase())){setShowQCtx(false);setQCtxVal("");return;}const col=EXTRA_CTX_PALETTE[contexts.length%EXTRA_CTX_PALETTE.length];const nc={id:`ctx_${Date.now()}`,icon:"✨",label:l,bg:col.bg,fg:col.fg};saveCtxs([...contexts,nc]);setForm(p=>({...p,context:nc.id}));setQCtxVal("");setShowQCtx(false);};

  /* ── Export / Import ── */
  const exportData=()=>{
    const photos={};contacts.forEach(c=>{const p=localStorage.getItem(PHOTO_PREFIX+c.id);if(p)photos[c.id]=p;});
    const payload={contacts,industries,contexts,trees,cautions,photos,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
    a.download=`my-network-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
    localStorage.setItem(EXPORT_KEY, new Date().toISOString());
    setShowExportReminder(false);
  };
  const importData=(e)=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const data=JSON.parse(ev.target.result);
        const nc=data.contacts||[];const ni=data.industries||DEFAULT_INDUSTRIES;
        const nx=data.contexts||DEFAULT_CTX;const nt=data.trees||[];const nk=data.cautions||[];
        setContacts(nc);setIndustries(ni);setContexts(nx);setTrees(nt);setCautions(nk);
        const payload={contacts:nc,industries:ni,contexts:nx,trees:nt,cautions:nk};
        localStorage.setItem(CACHE_KEY,JSON.stringify(payload));
        if(pin) saveCloud(pin,payload);
        if(data.photos){Object.entries(data.photos).forEach(([id,p])=>{try{localStorage.setItem(PHOTO_PREFIX+id,p);}catch(_){}});}
        setImportStatus("✅ Imported!");setTimeout(()=>setImportStatus(""),3000);
      }catch(_){setImportStatus("❌ Invalid file.");setTimeout(()=>setImportStatus(""),3000);}
    };reader.readAsText(file);e.target.value="";
  };

  /* ── 30-day export reminder ── */
  useEffect(()=>{
    if(needPin) return;
    let last = localStorage.getItem(EXPORT_KEY);
    if(!last) {
      localStorage.setItem(EXPORT_KEY, new Date().toISOString());
      return;
    }
    const days = (Date.now() - new Date(last).getTime()) / (1000*60*60*24);
    if(days > 30) setShowExportReminder(true);
  }, [needPin]);

  /* ── Format sync time ── */
  function fmtSynced(d) {
    if(!d) return "Not yet synced this session";
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff/60000);
    if(mins < 1)  return "Synced just now ✓";
    if(mins < 60) return `Synced ${mins}m ago ✓`;
    return `Synced ${Math.floor(mins/60)}h ago ✓`;
  }

  /* ── Form helpers ── */
  const fv=k=>form[k];const sf=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const toggleInd=ind=>setForm(p=>{const cur=p.industryTags||[];return{...p,industryTags:cur.includes(ind)?cur.filter(t=>t!==ind):[...cur,ind]};});
  const handleProfilePhoto=useCallback(async e=>{const file=e.target.files?.[0];if(!file)return;try{const r=await resizeImage(file);setForm(p=>({...p,profilePhoto:r,profilePhotoCleared:false}));}catch(_){}e.target.value="";},[]);
  const handleCardPhoto   =useCallback(async e=>{const file=e.target.files?.[0];if(!file)return;try{const r=await resizeImage(file);setForm(p=>({...p,cardPhoto:r,cardPhotoCleared:false}));}catch(_){}e.target.value="";},[]);

  /* ── Contact CRUD ── */
  const openDetail=(c,origin="network")=>{setSelected(c);setDelConfirm(false);setDetailOrigin(origin);setView("detail");try{setSelectedPhoto(localStorage.getItem(PHOTO_PREFIX+c.id)||null);}catch(_){setSelectedPhoto(null);}try{setSelectedCardPhoto(localStorage.getItem(PHOTO_PREFIX+c.id+"-card")||null);}catch(_){setSelectedCardPhoto(null);}};
  const openEdit=useCallback(()=>{setForm(contactToForm(selected,selectedPhoto||null,selectedCardPhoto||null));setIsEdit(true);setView("form");},[selected,selectedPhoto,selectedCardPhoto]);
  const backFromDetail=()=>{setDelConfirm(false);setView("list");if(detailOrigin==="tree")setActiveTab("trees");else if(detailOrigin==="caut")setActiveTab("cautious");setDetailOrigin("network");};
  const addContact=()=>{if(!fv("nickname").trim())return;const c=formToContact(form);const updated=[c,...contacts];persist(updated);if(form.profilePhoto){try{localStorage.setItem(PHOTO_PREFIX+c.id,form.profilePhoto);}catch(_){}}if(form.cardPhoto){try{localStorage.setItem(PHOTO_PREFIX+c.id+"-card",form.cardPhoto);}catch(_){}}setForm(blank(contexts[0]?.id));setShowQInd(false);setShowQCtx(false);setView("list");};
  const saveEdit=()=>{if(!fv("nickname").trim())return;const c=formToContact(form,selected.id);const updated=contacts.map(x=>x.id===selected.id?c:x);persist(updated);if(form.profilePhoto){try{localStorage.setItem(PHOTO_PREFIX+selected.id,form.profilePhoto);}catch(_){}}else if(form.profilePhotoCleared){try{localStorage.removeItem(PHOTO_PREFIX+selected.id);}catch(_){}}if(form.cardPhoto){try{localStorage.setItem(PHOTO_PREFIX+selected.id+"-card",form.cardPhoto);}catch(_){}}else if(form.cardPhotoCleared){try{localStorage.removeItem(PHOTO_PREFIX+selected.id+"-card");}catch(_){}}setSelected(updated.find(x=>x.id===selected.id));setSelectedPhoto(form.profilePhotoCleared?null:(form.profilePhoto||selectedPhoto||null));setSelectedCardPhoto(form.cardPhotoCleared?null:(form.cardPhoto||selectedCardPhoto||null));setView("detail");};
  const removeContact=()=>{const updated=contacts.filter(c=>c.id!==selected.id);persist(updated);try{localStorage.removeItem(PHOTO_PREFIX+selected.id);}catch(_){}try{localStorage.removeItem(PHOTO_PREFIX+selected.id+"-card");}catch(_){}setDelConfirm(false);setView("list");};

  /* ── Tree CRUD ── */
  const startNewTree  =()=>{setEditTree({id:null,name:"",type:"company",members:[]});setTPickSearch("");setTreeDelCfm(false);setTView("editor");};
  const openTreeDetail=(t)=>{setSelTree(t);setTreeDelCfm(false);setTView("detail");};
  const openTreeEditor=()=>{setEditTree({...selTree,members:[...selTree.members]});setTPickSearch("");setTreeDelCfm(false);setTView("editor");};
  const saveTree=()=>{if(!editTree?.name?.trim())return;const td={...editTree,id:editTree.id||tuid(),name:editTree.name.trim(),createdAt:editTree.createdAt||new Date().toISOString()};const updated=trees.find(t=>t.id===td.id)?trees.map(t=>t.id===td.id?td:t):[...trees,td];saveTrees(updated);setSelTree(td);setTView("detail");};
  const deleteTree=()=>{saveTrees(trees.filter(t=>t.id!==selTree.id));setSelTree(null);setTreeDelCfm(false);setTView("list");};
  const addTMember=(cid)=>{if(!editTree||editTree.members.some(m=>m.contactId===cid))return;setEditTree(p=>({...p,members:[...p.members,{id:muid(),contactId:cid,parentMemberId:null,role:""}]}));};
  const removeTMember=(mid)=>setEditTree(p=>({...p,members:p.members.filter(m=>m.id!==mid).map(m=>m.parentMemberId===mid?{...m,parentMemberId:null}:m)}));
  const updateTMember=(mid,f,v)=>setEditTree(p=>({...p,members:p.members.map(m=>m.id===mid?{...m,[f]:v}:m)}));

  /* ── Cautious CRUD ── */
  const openCautDetail=(caut)=>{setSelCaut(caut);setCautDelCfm(false);setCautView("detail");};
  const startNewCaut  =()=>{setEditCaut({id:null,contactId:null,level:"yellow",whatTheyDid:"",whyCautious:""});setCautPickSrch("");setCautDelCfm(false);setCautView("editor");};
  const openCautEditor=()=>{setEditCaut({...selCaut});setCautPickSrch("");setCautDelCfm(false);setCautView("editor");};
  const saveCaut=()=>{if(!editCaut?.contactId)return;const cd={...editCaut,id:editCaut.id||kuid(),addedAt:editCaut.addedAt||new Date().toISOString()};const updated=cautions.find(c=>c.id===cd.id)?cautions.map(c=>c.id===cd.id?cd:c):[...cautions,cd];saveCauts(updated);setSelCaut(cd);setCautView("detail");};
  const deleteCaut=()=>{saveCauts(cautions.filter(c=>c.id!==selCaut.id));setSelCaut(null);setCautDelCfm(false);setCautView("list");};

  /* ── Filter / sort / group ── */
  const sorted=contacts.filter(c=>{const q=search.toLowerCase();const matchQ=!q||[displayName(c),c.fullName,c.role,c.company,c.contextNote,c.funFact,...(c.industryTags||[]),c.socials?.instagram,c.socials?.facebook,c.socials?.line].some(v=>(v||"").toLowerCase().includes(q));return matchQ&&(filter==="all"||(c.industryTags||[]).includes(filter));}).sort((a,b)=>displayName(a).localeCompare(displayName(b)));
  const grouped={};sorted.forEach(c=>{const l=(displayName(c)[0]||"#").toUpperCase();(grouped[l]=grouped[l]||[]).push(c);});
  const letters=Object.keys(grouped).sort();

  const WRAP={fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto"};

  /* ── Gate renders ── */
  if(!ready) return <div style={{...WRAP,display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}><div style={{color:C.muted,fontSize:15}}>Loading…</div></div>;
  if(needPin) return <PinScreen onUnlock={handleUnlock}/>;

  /* ── Export reminder modal ── */
  const ExportReminder = showExportReminder ? (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:"inherit"}}>
      <div style={{background:C.white,borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{fontSize:44,textAlign:"center",marginBottom:12}}>💾</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,textAlign:"center",marginBottom:8}}>Time for a backup!</div>
        <div style={{fontSize:14,color:C.muted,textAlign:"center",lineHeight:1.7,marginBottom:24}}>It has been over 30 days since your last export. Save a backup file now to protect your network data.</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setShowExportReminder(false)} style={{flex:1,padding:13,border:`1.5px solid ${C.border}`,background:"transparent",borderRadius:12,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Remind me later</button>
          <button onClick={exportData} style={{flex:1,padding:13,background:C.navy,border:"none",borderRadius:12,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>⬇️ Export Now</button>
        </div>
      </div>
    </div>
  ) : null;

  /* ════ CONTACT FORM ════ */
  if(view==="form") {
    const ok=fv("nickname").trim().length>0;
    const SmallAdd=({show,setShow,val,setVal,onAdd,placeholder})=>(
      <>{<button onClick={()=>setShow(p=>!p)} style={{width:22,height:22,borderRadius:6,background:show?C.muted:C.amber,border:"none",color:"#fff",fontSize:15,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>+</button>}
      {show&&<div style={{display:"flex",gap:6,marginTop:8}}><input value={val} onChange={e=>setVal(e.target.value)} placeholder={placeholder} autoFocus onKeyDown={e=>{if(e.key==="Enter")onAdd();if(e.key==="Escape"){setShow(false);setVal("");}}} style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}}/><button onClick={onAdd} style={{background:C.amber,border:"none",borderRadius:8,padding:"6px 10px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Add</button></div>}</>
    );
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
          <NavBack onClick={()=>{setForm(blank(contexts[0]?.id));setShowQInd(false);setShowQCtx(false);setView(isEdit?"detail":"list");}}/>
          <span style={{color:"#fff",fontSize:17,fontWeight:800}}>{isEdit?"Edit Contact":"Add to Network"}</span>
        </div>
        <div style={{padding:"12px 13px 20px",display:"flex",flexDirection:"column",gap:9}}>
          <InfoCard><FL>Nickname *</FL><input value={fv("nickname")} onChange={sf("nickname")} placeholder="What do you call them?" style={{...INP,marginBottom:10}}/><Hr/><FL>Full Name</FL><input value={fv("fullName")} onChange={sf("fullName")} placeholder="Optional — legal / formal name" style={INP}/></InfoCard>
          <InfoCard><FL>Role / Occupation</FL><input value={fv("role")} onChange={sf("role")} placeholder="e.g. Founder, Designer, Lawyer" style={{...INP,marginBottom:10}}/><Hr/><FL>Company / Org</FL><input value={fv("company")} onChange={sf("company")} placeholder="Where do they work?" style={INP}/></InfoCard>
          <InfoCard>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>Where we met</div>
              <SmallAdd show={showQCtx} setShow={setShowQCtx} val={qCtxVal} setVal={setQCtxVal} onAdd={quickAddCtx} placeholder="New occasion…"/>
            </div>
            {showQCtx&&<div style={{height:8}}/>}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>{contexts.map(c=>(<button key={c.id} onClick={()=>setForm(p=>({...p,context:c.id}))} style={{padding:"8px 12px",borderRadius:9,border:`2px solid ${fv("context")===c.id?C.navy:C.border}`,background:fv("context")===c.id?C.navy:"transparent",color:fv("context")===c.id?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{c.icon} {c.label}</button>))}</div>
            <FL>Occasion / Details</FL><input value={fv("contextNote")} onChange={sf("contextNote")} placeholder="e.g. TechConf Bangkok 2024…" style={INP}/>
          </InfoCard>
          <InfoCard>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase"}}>Industry</div>
              <SmallAdd show={showQInd} setShow={setShowQInd} val={qIndVal} setVal={setQIndVal} onAdd={quickAddInd} placeholder="New industry…"/>
            </div>
            {showQInd&&<div style={{height:8}}/>}
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{industries.map((ind,i)=>{const col=indColor(i);const sel=(fv("industryTags")||[]).includes(ind);return(<button key={ind} onClick={()=>toggleInd(ind)} style={{padding:"6px 12px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${sel?col.fg:C.border}`,background:sel?col.bg:"transparent",color:sel?col.fg:C.muted}}>{ind}</button>);})}</div>
          </InfoCard>
          <InfoCard><FL>Fun Fact / Notes</FL><textarea value={fv("funFact")} onChange={sf("funFact")} rows={3} placeholder="e.g. Speaks 4 languages, ex-F1 engineer…" style={{...INP,resize:"none",lineHeight:1.55}}/></InfoCard>
          <InfoCard><FL>Insecurity / Weakness</FL><textarea value={fv("notes")} onChange={sf("notes")} rows={3} placeholder="Personal vulnerabilities or sensitivities to keep in mind…" style={{...INP,resize:"none",lineHeight:1.55}}/></InfoCard>
          <InfoCard><FL>Social Media</FL>{SOCIALS.map((p,i)=>(<div key={p.id}>{i>0&&<Hr/>}<div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:p.grad,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:900}}>{p.abbr}</div><div style={{flex:1}}><div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>{p.label}</div><input value={fv("socials")?.[p.id]||""} onChange={e=>setForm(prev=>({...prev,socials:{...prev.socials,[p.id]:e.target.value}}))} placeholder={p.placeholder} style={INP}/></div></div></div>))}</InfoCard>
          <InfoCard>
            <FL>Profile Picture</FL>
            <input ref={profilePhotoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleProfilePhoto}/>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{position:"relative",width:90,height:90}}>
                {fv("profilePhoto")?(
                  <img src={fv("profilePhoto")} alt="" style={{width:90,height:90,borderRadius:45,objectFit:"cover",border:`2px solid ${C.border}`}}/>
                ):(
                  <div style={{width:90,height:90,borderRadius:45,background:gradient(fv("nickname")||"?"),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:28,fontWeight:800}}>{initials(fv("nickname")||"?")}</div>
                )}
                {fv("profilePhoto")&&<button onClick={()=>setForm(p=>({...p,profilePhoto:null,profilePhotoCleared:true}))} style={{position:"absolute",top:0,right:0,width:24,height:24,borderRadius:12,background:C.red,border:"2px solid #fff",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>}
              </div>
              <button onClick={()=>profilePhotoRef.current?.click()} style={{padding:"7px 18px",background:"#F3F4F6",border:`1px solid ${C.border}`,borderRadius:9,fontSize:13,fontWeight:600,color:C.text,cursor:"pointer",fontFamily:"inherit"}}>{fv("profilePhoto")?"Change Photo":"Add Profile Photo"}</button>
              <div style={{fontSize:11,color:C.muted}}>Shown on your contact cards</div>
            </div>
          </InfoCard>
          <InfoCard>
            <FL>Business Card / Others</FL>
            <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
            {fv("photo")?(<div style={{position:"relative"}}><img src={fv("photo")} alt="" style={{width:"100%",borderRadius:10,maxHeight:220,objectFit:"cover",display:"block"}}/><button onClick={()=>setForm(p=>({...p,photo:null,photoCleared:true}))} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button></div>):(<div onClick={()=>photoRef.current?.click()} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"20px 16px",textAlign:"center",cursor:"pointer"}}><div style={{fontSize:24,marginBottom:6}}>📷</div><div style={{fontSize:13,color:C.muted,fontWeight:500}}>Tap to attach a business card or document</div></div>)}
          </InfoCard>
          <button onClick={isEdit?saveEdit:addContact} disabled={!ok} style={{background:ok?C.amber:C.border,border:"none",borderRadius:14,padding:15,color:ok?"#fff":C.muted,fontSize:15,fontWeight:800,cursor:ok?"pointer":"not-allowed",boxShadow:ok?"0 4px 14px rgba(245,158,11,0.4)":"none",fontFamily:"inherit"}}>{isEdit?"Save Changes":"Add to Network"}</button>
        </div>
      </div>
    );
  }

  /* ════ CONTACT DETAIL ════ */
  if(view==="detail"&&selected) {
    const ctx=ctxFor(selected.context,contexts);const dn=displayName(selected);
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px 22px",position:"sticky",top:0,zIndex:10}}>
          <NavBack onClick={backFromDetail}/>
          {profilePhotos[selected.id]?(<img src={profilePhotos[selected.id]} alt="" style={{width:72,height:72,borderRadius:20,objectFit:"cover",marginTop:14,border:"3px solid rgba(255,255,255,0.3)"}}/>):(<div style={{width:72,height:72,borderRadius:20,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,fontWeight:800,letterSpacing:-0.5,marginTop:14}}>{initials(dn)}</div>)}
          <div style={{color:"#fff",fontSize:22,fontWeight:800,marginTop:10,letterSpacing:-0.5}}>{dn}</div>
          {selected.fullName&&<div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginTop:2,fontStyle:"italic"}}>{selected.fullName}</div>}
          {(selected.role||selected.company)&&<div style={{color:"#90A4C8",fontSize:13,marginTop:4}}>{[selected.role,selected.company].filter(Boolean).join(" · ")}</div>}
          <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
            <MiniChip bg="rgba(255,255,255,0.15)" fg="#fff">{ctx.icon} {ctx.label}</MiniChip>
            {selected.contextNote&&<MiniChip bg="rgba(255,255,255,0.1)" fg="rgba(255,255,255,0.75)">{selected.contextNote}</MiniChip>}
          </div>
        </div>
        <div style={{padding:"12px 13px",display:"flex",flexDirection:"column",gap:9}}>
          {(selected.industryTags||[]).length>0&&(<InfoCard><FL>Industry</FL><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{selected.industryTags.map((ind,i)=>{const idx=industries.indexOf(ind);const col=indColor(idx>=0?idx:i);return <MiniChip key={i} bg={col.bg} fg={col.fg}>{ind}</MiniChip>;})}</div></InfoCard>)}
          {selected.funFact&&<InfoCard><FL>Fun Fact / Notes</FL><div style={{fontSize:15,color:C.text,lineHeight:1.6}}>{selected.funFact}</div></InfoCard>}
          {selected.notes&&<InfoCard><FL>Insecurity / Weakness</FL><div style={{fontSize:15,color:C.text,lineHeight:1.6}}>{selected.notes}</div></InfoCard>}
          {SOCIALS.some(p=>selected.socials?.[p.id])&&(<InfoCard><FL>Social Media</FL><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{SOCIALS.filter(p=>selected.socials?.[p.id]).map(p=>{const url=socialUrl(p.id,selected.socials[p.id]);return(<button key={p.id} onClick={()=>url&&window.open(url,"_blank")} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:"none",background:p.grad,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 6px rgba(0,0,0,0.15)"}}><span style={{fontSize:11,fontWeight:900,background:"rgba(255,255,255,0.25)",borderRadius:5,padding:"1px 5px"}}>{p.abbr}</span>{p.label}</button>);})}</div></InfoCard>)}
          {selectedPhoto&&<InfoCard style={{padding:0,overflow:"hidden"}}><img src={selectedPhoto} alt="" style={{width:"100%",borderRadius:14,display:"block",objectFit:"contain",maxHeight:340}}/></InfoCard>}
          {detailOrigin==="network"&&(!delConfirm?(<div style={{display:"flex",gap:9,marginTop:2}}><button onClick={openEdit} style={{flex:1,padding:13,border:`2px solid ${C.navy}`,background:"transparent",borderRadius:13,fontSize:15,fontWeight:700,color:C.navy,cursor:"pointer",fontFamily:"inherit"}}>Edit</button><button onClick={()=>setDelConfirm(true)} style={{flex:1,padding:13,border:"none",background:C.redBg,borderRadius:13,fontSize:15,fontWeight:700,color:C.red,cursor:"pointer",fontFamily:"inherit"}}>Remove</button></div>):(<InfoCard style={{border:`1px solid ${C.redBg}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12,textAlign:"center"}}>Remove {dn} from your network?</div><div style={{display:"flex",gap:9}}><button onClick={()=>setDelConfirm(false)} style={{flex:1,padding:11,border:`1px solid ${C.border}`,background:"transparent",borderRadius:11,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button onClick={removeContact} style={{flex:1,padding:11,border:"none",background:C.red,borderRadius:11,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Yes, Remove</button></div></InfoCard>))}
        </div>
      </div>
    );
  }

  /* ════ TREE EDITOR ════ */
  if(tView==="editor"&&editTree!==null) {
    const et=editTree;const okT=et.name?.trim().length>0;
    const available=contacts.filter(c=>!tPickSearch||(displayName(c).toLowerCase().includes(tPickSearch.toLowerCase())||(c.role||"").toLowerCase().includes(tPickSearch.toLowerCase()))).sort((a,b)=>displayName(a).localeCompare(displayName(b)));
    const added=new Set(et.members.map(m=>m.contactId));
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
          <NavBack onClick={()=>{setTreeDelCfm(false);setTView(selTree?"detail":"list");}}/>
          <span style={{color:"#fff",fontSize:17,fontWeight:800}}>{et.id?"Edit Tree":"New Tree"}</span>
        </div>
        <div style={{padding:"12px 13px 20px",display:"flex",flexDirection:"column",gap:9}}>
          <InfoCard><FL>Tree Name *</FL><input value={et.name} onChange={e=>setEditTree(p=>({...p,name:e.target.value}))} placeholder="e.g. Acme Corp, Smith Family…" style={INP}/></InfoCard>
          <InfoCard><FL>Type</FL><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{TREE_TYPES.map(t=>(<button key={t.id} onClick={()=>setEditTree(p=>({...p,type:t.id}))} style={{padding:"8px 13px",borderRadius:9,border:`2px solid ${et.type===t.id?C.navy:C.border}`,background:et.type===t.id?C.navy:"transparent",color:et.type===t.id?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.label}</button>))}</div></InfoCard>
          {et.members.length>0&&(<div><div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase",padding:"4px 2px 8px"}}>Members ({et.members.length})</div>{et.members.map(m=>{const contact=contacts.find(c=>c.id===m.contactId);const dn=contact?displayName(contact):"Unknown";return(<InfoCard key={m.id} style={{marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:38,height:38,borderRadius:11,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:800,flexShrink:0}}>{initials(dn)}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{dn}</div>{contact?.role&&<div style={{fontSize:11,color:C.muted}}>{contact.role}</div>}</div><button onClick={()=>removeTMember(m.id)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button></div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",width:46,flexShrink:0}}>Role</span><input value={m.role} onChange={e=>updateTMember(m.id,"role",e.target.value)} placeholder="e.g. CEO, Father…" style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit",background:"transparent"}}/></div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",width:46,flexShrink:0}}>Under</span><select value={m.parentMemberId||""} onChange={e=>updateTMember(m.id,"parentMemberId",e.target.value||null)} style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,color:C.text,background:C.white,fontFamily:"inherit",outline:"none"}}><option value="">— Root (no parent) —</option>{et.members.filter(x=>x.id!==m.id).map(x=>{const xc=contacts.find(c=>c.id===x.contactId);return <option key={x.id} value={x.id}>{xc?displayName(xc):"?"}{x.role?` (${x.role})`:""}</option>;})}</select></div></InfoCard>);})}</div>)}
          <InfoCard><FL>Add from My Network</FL><input value={tPickSearch} onChange={e=>setTPickSearch(e.target.value)} placeholder="Search contacts…" style={{...INP,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,marginBottom:8}}/><div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>{contacts.length===0?<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"12px 0"}}>No contacts yet.</div>:available.map(c=>{const a=added.has(c.id);return(<div key={c.id} onClick={()=>!a&&addTMember(c.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,background:a?"#F9FAFB":C.white,cursor:a?"default":"pointer",border:`1px solid ${C.border}`,opacity:a?0.5:1}}><div style={{width:34,height:34,borderRadius:10,background:gradient(displayName(c)),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0}}>{initials(displayName(c))}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName(c)}</div>{(c.role||c.company)&&<div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[c.role,c.company].filter(Boolean).join(" · ")}</div>}</div><span style={{fontSize:16,color:a?C.muted:C.amber,fontWeight:700,flexShrink:0}}>{a?"✓":"+"}</span></div>);})}</div></InfoCard>
          <button onClick={saveTree} disabled={!okT} style={{background:okT?C.amber:C.border,border:"none",borderRadius:14,padding:15,color:okT?"#fff":C.muted,fontSize:15,fontWeight:800,cursor:okT?"pointer":"not-allowed",boxShadow:okT?"0 4px 14px rgba(245,158,11,0.4)":"none",fontFamily:"inherit"}}>Save Tree</button>
          {et.id&&(!treeDelCfm?<button onClick={()=>setTreeDelCfm(true)} style={{background:"transparent",border:`1.5px solid ${C.red}`,borderRadius:14,padding:13,color:C.red,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Delete This Tree</button>:(<InfoCard style={{border:`1px solid ${C.redBg}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12,textAlign:"center"}}>Delete "{et.name}"?</div><div style={{display:"flex",gap:9}}><button onClick={()=>setTreeDelCfm(false)} style={{flex:1,padding:11,border:`1px solid ${C.border}`,background:"transparent",borderRadius:11,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button onClick={deleteTree} style={{flex:1,padding:11,border:"none",background:C.red,borderRadius:11,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Yes, Delete</button></div></InfoCard>))}
        </div>
      </div>
    );
  }

  /* ════ TREE DETAIL ════ */
  if(tView==="detail"&&selTree) {
    const typeInfo=treeTypeFor(selTree.type);
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px 18px",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><NavBack onClick={()=>setTView("list")}/><button onClick={openTreeEditor} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>✏️ Edit</button></div>
          <div style={{marginTop:12}}><div style={{color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.5}}>{selTree.name}</div><div style={{marginTop:7,display:"flex",gap:6,flexWrap:"wrap"}}><MiniChip bg="rgba(255,255,255,0.15)" fg="#fff">{typeInfo.icon} {typeInfo.label}</MiniChip><MiniChip bg="rgba(255,255,255,0.1)" fg="rgba(255,255,255,0.75)">{selTree.members.length} {selTree.members.length===1?"person":"people"}</MiniChip></div></div>
        </div>
        <div style={{padding:"12px 13px 80px"}}>{selTree.members.length===0?(<div style={{textAlign:"center",padding:"52px 24px",color:C.muted}}><div style={{fontSize:44,marginBottom:10}}>🌱</div><div style={{fontSize:16,fontWeight:700,color:"#374151",marginBottom:6}}>This tree is empty</div><div style={{fontSize:13,lineHeight:1.6}}>Tap Edit to add people and define the hierarchy.</div></div>):<OrgChart members={selTree.members} contacts={contacts} profilePhotos={profilePhotos} onNodePress={c=>openDetail(c,"tree")}/>}</div>
      </div>
    );
  }

  /* ════ CAUTIOUS EDITOR ════ */
  if(cautView==="editor"&&editCaut!==null) {
    const ec=editCaut;const okCaut=!!ec.contactId;
    const availForCaut=contacts.filter(c=>!cautPickSrch||(displayName(c).toLowerCase().includes(cautPickSrch.toLowerCase())||(c.role||"").toLowerCase().includes(cautPickSrch.toLowerCase()))).sort((a,b)=>displayName(a).localeCompare(displayName(b)));
    const selContact=contacts.find(c=>c.id===ec.contactId);
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:"#7C1D1D",padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}><NavBack onClick={()=>{setCautDelCfm(false);setCautView(selCaut?"detail":"list");}}/><span style={{color:"#fff",fontSize:17,fontWeight:800}}>{ec.id?"Edit Caution":"Flag Contact"}</span></div>
        <div style={{padding:"12px 13px 20px",display:"flex",flexDirection:"column",gap:9}}>
          {!ec.id?(<InfoCard><FL>Select Contact *</FL><input value={cautPickSrch} onChange={e=>setCautPickSrch(e.target.value)} placeholder="Search My Network…" style={{...INP,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,marginBottom:8}}/><div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>{availForCaut.map(c=>{const af=cautions.some(k=>k.contactId===c.id&&k.id!==ec.id);return(<div key={c.id} onClick={()=>!af&&setEditCaut(p=>({...p,contactId:c.id}))} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,cursor:af?"default":"pointer",border:`2px solid ${ec.contactId===c.id?"#EF4444":C.border}`,background:ec.contactId===c.id?"#FEF2F2":af?"#F9FAFB":C.white,opacity:af?0.5:1}}><div style={{width:34,height:34,borderRadius:10,background:gradient(displayName(c)),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0}}>{initials(displayName(c))}</div><div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName(c)}</div>{(c.role||c.company)&&<div style={{fontSize:11,color:C.muted}}>{[c.role,c.company].filter(Boolean).join(" · ")}</div>}</div>{af&&<span style={{fontSize:11,color:C.muted}}>Flagged</span>}{ec.contactId===c.id&&<span style={{fontSize:14,color:"#EF4444"}}>✓</span>}</div>);})}</div></InfoCard>):(selContact&&<InfoCard><FL>Contact</FL><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:40,height:40,borderRadius:12,background:gradient(displayName(selContact)),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,flexShrink:0}}>{initials(displayName(selContact))}</div><div><div style={{fontSize:15,fontWeight:700,color:C.text}}>{displayName(selContact)}</div>{(selContact.role||selContact.company)&&<div style={{fontSize:12,color:C.muted}}>{[selContact.role,selContact.company].filter(Boolean).join(" · ")}</div>}</div></div></InfoCard>)}
          <InfoCard><FL>Risk Level</FL><div style={{display:"flex",gap:8}}>{CAUTION_LEVELS.map(l=>(<button key={l.id} onClick={()=>setEditCaut(p=>({...p,level:l.id}))} style={{flex:1,padding:"10px 4px",borderRadius:10,border:`2px solid ${ec.level===l.id?l.color:C.border}`,background:ec.level===l.id?l.bg:"transparent",color:ec.level===l.id?l.color:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l.icon}<br/>{l.label}</button>))}</div></InfoCard>
          <InfoCard><FL>What They Did</FL><textarea value={ec.whatTheyDid} onChange={e=>setEditCaut(p=>({...p,whatTheyDid:e.target.value}))} rows={4} placeholder="Describe what happened…" style={{...INP,resize:"none",lineHeight:1.55}}/></InfoCard>
          <InfoCard><FL>Why Be Cautious</FL><textarea value={ec.whyCautious} onChange={e=>setEditCaut(p=>({...p,whyCautious:e.target.value}))} rows={4} placeholder="Why should you be careful around them…" style={{...INP,resize:"none",lineHeight:1.55}}/></InfoCard>
          <button onClick={saveCaut} disabled={!okCaut} style={{background:okCaut?"#DC2626":C.border,border:"none",borderRadius:14,padding:15,color:okCaut?"#fff":C.muted,fontSize:15,fontWeight:800,cursor:okCaut?"pointer":"not-allowed",boxShadow:okCaut?"0 4px 14px rgba(220,38,38,0.35)":"none",fontFamily:"inherit"}}>{ec.id?"Save Changes":"Flag This Contact"}</button>
          {ec.id&&(!cautDelCfm?<button onClick={()=>setCautDelCfm(true)} style={{background:"transparent",border:`1.5px solid ${C.red}`,borderRadius:14,padding:13,color:C.red,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Remove Flag</button>:(<InfoCard style={{border:`1px solid ${C.redBg}`}}><div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12,textAlign:"center"}}>Remove this caution flag?</div><div style={{display:"flex",gap:9}}><button onClick={()=>setCautDelCfm(false)} style={{flex:1,padding:11,border:`1px solid ${C.border}`,background:"transparent",borderRadius:11,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button><button onClick={deleteCaut} style={{flex:1,padding:11,border:"none",background:C.red,borderRadius:11,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Yes, Remove</button></div></InfoCard>))}
        </div>
      </div>
    );
  }

  /* ════ CAUTIOUS DETAIL ════ */
  if(cautView==="detail"&&selCaut) {
    const contact=contacts.find(c=>c.id===selCaut.contactId);const dn=contact?displayName(contact):"Deleted Contact";const level=cautLevelFor(selCaut.level);
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:"#7C1D1D",padding:"14px 16px 22px",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><NavBack onClick={()=>setCautView("list")}/><button onClick={openCautEditor} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>✏️ Edit</button></div>
          {(contact&&profilePhotos[contact.id])?(<img src={profilePhotos[contact.id]} alt="" style={{width:72,height:72,borderRadius:20,objectFit:"cover",marginTop:14,border:"3px solid rgba(255,255,255,0.3)"}}/>):(<div style={{width:72,height:72,borderRadius:20,background:contact?gradient(dn):"#6B7280",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,fontWeight:800,letterSpacing:-0.5,marginTop:14}}>{initials(dn)}</div>)}
          <div style={{color:"#fff",fontSize:22,fontWeight:800,marginTop:10,letterSpacing:-0.5}}>{dn}</div>
          {contact&&(contact.role||contact.company)&&<div style={{color:"rgba(255,255,255,0.6)",fontSize:13,marginTop:3}}>{[contact.role,contact.company].filter(Boolean).join(" · ")}</div>}
          <div style={{marginTop:10}}><span style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:999,background:level.bg,color:level.color,fontSize:13,fontWeight:800}}>{level.icon} {level.label}</span></div>
        </div>
        <div style={{padding:"12px 13px",display:"flex",flexDirection:"column",gap:9}}>
          {selCaut.whatTheyDid&&<InfoCard><FL>What They Did</FL><div style={{fontSize:15,color:C.text,lineHeight:1.6}}>{selCaut.whatTheyDid}</div></InfoCard>}
          {selCaut.whyCautious&&<InfoCard><FL>Why Be Cautious</FL><div style={{fontSize:15,color:C.text,lineHeight:1.6}}>{selCaut.whyCautious}</div></InfoCard>}
          {contact&&<button onClick={()=>openDetail(contact,"caut")} style={{padding:13,background:C.navy,border:"none",borderRadius:13,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>View Full Profile →</button>}
        </div>
      </div>
    );
  }

  /* ════ MAIN LIST VIEWS ════ */
  return (
    <div style={{...WRAP,paddingBottom:TAB_H}}>
      {ExportReminder}

      {activeTab==="network"&&(
        <div>
          <div style={{background:C.navy,padding:"14px 16px 13px",position:"sticky",top:0,zIndex:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}><div><div style={{color:"#fff",fontSize:21,fontWeight:800,letterSpacing:-0.5}}>My Network</div><div style={{color:"#8A9BC8",fontSize:11,marginTop:1}}>{contacts.length} {contacts.length===1?"person":"people"}</div></div><button onClick={()=>setSidebarOpen(true)} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:9,padding:"8px 11px",cursor:"pointer",fontSize:18,lineHeight:1,fontFamily:"inherit"}}>☰</button></div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,display:"flex",alignItems:"center",padding:"0 11px",gap:7}}><span style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, industry, fun fact…" style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:14,padding:"10px 0",fontFamily:"inherit"}}/>{search&&<span onClick={()=>setSearch("")} style={{color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</span>}</div>
          </div>
          <div style={{display:"flex",gap:7,padding:"11px 13px 0",overflowX:"auto",scrollbarWidth:"none"}}>{["all",...industries].map(ind=>(<button key={ind} onClick={()=>setFilter(ind)} style={{flexShrink:0,padding:"6px 13px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",outline:"none",fontFamily:"inherit",background:filter===ind?C.navy:C.white,color:filter===ind?"#fff":C.muted,boxShadow:filter===ind?"0 2px 8px rgba(27,42,92,0.18)":"0 1px 2px rgba(0,0,0,0.07)"}}>{ind==="all"?"All":ind}</button>))}</div>
          <div style={{padding:"8px 11px 0"}}>{sorted.length===0?(<div style={{textAlign:"center",padding:"56px 22px",color:C.muted}}><div style={{fontSize:44,marginBottom:10}}>{contacts.length===0?"👋":"🔍"}</div><div style={{fontSize:17,fontWeight:700,color:"#374151",marginBottom:7}}>{contacts.length===0?"Start building your network":"No one found"}</div><div style={{fontSize:13,lineHeight:1.6}}>{contacts.length===0?"Tap + to add your first contact.":"Try a different search or filter."}</div></div>):letters.map(letter=>(<div key={letter}><div style={{fontSize:11,fontWeight:800,color:C.muted,letterSpacing:1.2,padding:"10px 4px 5px",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>{letter}</div>{grouped[letter].map(c=>{const ctx=ctxFor(c.context,contexts);const dn=displayName(c);const caut=cautions.find(k=>k.contactId===c.id);return(<div key={c.id} onClick={()=>openDetail(c)} style={{background:C.white,borderRadius:13,marginBottom:6,padding:"13px",display:"flex",alignItems:"center",gap:11,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"pointer",borderLeft:caut?`4px solid ${cautLevelFor(caut.level).color}`:"4px solid transparent"}}>{profilePhotos[c.id]?(<img src={profilePhotos[c.id]} alt="" style={{width:48,height:48,borderRadius:13,objectFit:"cover",flexShrink:0}}/>):(<div style={{width:48,height:48,borderRadius:13,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:800,flexShrink:0,letterSpacing:-0.5}}>{initials(dn)}</div>)}<div style={{flex:1,minWidth:0}}><div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</div>{(c.role||c.company)&&<div style={{fontSize:11,color:C.muted,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[c.role,c.company].filter(Boolean).join(" · ")}</div>}<div style={{display:"flex",gap:5,flexWrap:"wrap"}}><MiniChip bg={ctx.bg} fg={ctx.fg}>{ctx.icon} {ctx.label}</MiniChip>{(c.industryTags||[]).slice(0,1).map((ind,i)=>{const idx=industries.indexOf(ind);const col=indColor(idx>=0?idx:i);return <MiniChip key={i} bg={col.bg} fg={col.fg}>{ind}</MiniChip>;})} {(c.industryTags||[]).length>1&&<MiniChip bg="#F3F4F6" fg={C.muted}>+{c.industryTags.length-1}</MiniChip>}</div></div><span style={{color:"#D1D5DB",fontSize:18,flexShrink:0}}>›</span></div>);})}</div>))}</div>
          <button onClick={()=>{setForm(blank(contexts[0]?.id));setIsEdit(false);setShowQInd(false);setShowQCtx(false);setView("form");}} style={{position:"fixed",bottom:TAB_H+16,right:22,width:54,height:54,borderRadius:27,background:C.amber,border:"none",color:"#fff",fontSize:30,lineHeight:"1",cursor:"pointer",boxShadow:"0 4px 16px rgba(245,158,11,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,fontFamily:"inherit",fontWeight:300}}>+</button>
        </div>
      )}

      {activeTab==="trees"&&(
        <div>
          <div style={{background:C.navy,padding:"14px 16px 16px",position:"sticky",top:0,zIndex:10}}><div style={{color:"#fff",fontSize:21,fontWeight:800,letterSpacing:-0.5}}>Trees</div><div style={{color:"#8A9BC8",fontSize:11,marginTop:1}}>{trees.length} {trees.length===1?"tree":"trees"}</div></div>
          <div style={{padding:"12px 11px 0"}}>{trees.length===0?(<div style={{textAlign:"center",padding:"60px 24px",color:C.muted}}><div style={{fontSize:52,marginBottom:14}}>🌳</div><div style={{fontSize:17,fontWeight:700,color:"#374151",marginBottom:8}}>No trees yet</div><div style={{fontSize:13,lineHeight:1.7}}>Tap + to map out an organization, family, or social group.</div></div>):trees.map(tree=>{const typeInfo=treeTypeFor(tree.type);return(<div key={tree.id} onClick={()=>openTreeDetail(tree)} style={{background:C.white,borderRadius:14,marginBottom:10,padding:"14px 16px",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}><div style={{fontSize:16,fontWeight:800,color:C.text}}>{tree.name}</div><MiniChip bg={typeInfo.bg} fg={typeInfo.fg}>{typeInfo.icon} {typeInfo.label}</MiniChip></div><div style={{fontSize:12,color:C.muted,marginBottom:10}}>{tree.members.length} {tree.members.length===1?"person":"people"}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex"}}>{tree.members.slice(0,6).map((m,i)=>{const contact=contacts.find(c=>c.id===m.contactId);const dn=contact?displayName(contact):"?";return(<div key={m.id} style={{width:30,height:30,borderRadius:9,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800,border:"2px solid #fff",marginLeft:i>0?-8:0,zIndex:tree.members.length-i}}>{initials(dn)}</div>);})} {tree.members.length>6&&<div style={{width:30,height:30,borderRadius:9,background:C.muted,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800,border:"2px solid #fff",marginLeft:-8}}>+{tree.members.length-6}</div>}</div><span style={{color:"#D1D5DB",fontSize:18}}>›</span></div></div>);})}</div>
          <button onClick={startNewTree} style={{position:"fixed",bottom:TAB_H+16,right:22,width:54,height:54,borderRadius:27,background:C.amber,border:"none",color:"#fff",fontSize:30,lineHeight:"1",cursor:"pointer",boxShadow:"0 4px 16px rgba(245,158,11,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,fontFamily:"inherit",fontWeight:300}}>+</button>
        </div>
      )}

      {activeTab==="cautious"&&(
        <div>
          <div style={{background:"#7C1D1D",padding:"14px 16px 16px",position:"sticky",top:0,zIndex:10}}><div style={{color:"#fff",fontSize:21,fontWeight:800,letterSpacing:-0.5}}>⚠️ Cautious</div><div style={{color:"rgba(255,255,255,0.55)",fontSize:11,marginTop:1}}>{cautions.length} {cautions.length===1?"flagged contact":"flagged contacts"}</div></div>
          <div style={{padding:"12px 11px 0"}}>{cautions.length===0?(<div style={{textAlign:"center",padding:"60px 24px",color:C.muted}}><div style={{fontSize:52,marginBottom:14}}>⚠️</div><div style={{fontSize:17,fontWeight:700,color:"#374151",marginBottom:8}}>No flagged contacts</div><div style={{fontSize:13,lineHeight:1.7}}>Tap + to flag someone you need to be careful with.</div></div>):[...cautions].sort((a,b)=>{const o={red:0,orange:1,yellow:2};return(o[a.level]??3)-(o[b.level]??3);}).map(caut=>{const contact=contacts.find(c=>c.id===caut.contactId);const dn=contact?displayName(contact):"Deleted Contact";const level=cautLevelFor(caut.level);return(<div key={caut.id} onClick={()=>openCautDetail(caut)} style={{background:C.white,borderRadius:13,marginBottom:8,padding:"14px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"pointer",borderLeft:`4px solid ${level.color}`}}><div style={{width:46,height:46,borderRadius:13,background:contact?gradient(dn):"#6B7280",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:800,flexShrink:0}}>{initials(dn)}</div><div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><div style={{fontSize:15,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</div><span style={{flexShrink:0,fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:999,background:level.bg,color:level.color}}>{level.label}</span></div>{(contact?.role||contact?.company)&&<div style={{fontSize:11,color:C.muted,marginBottom:3}}>{[contact.role,contact.company].filter(Boolean).join(" · ")}</div>}{caut.whatTheyDid&&<div style={{fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{caut.whatTheyDid}</div>}</div><span style={{color:"#D1D5DB",fontSize:18,flexShrink:0}}>›</span></div>);})}</div>
          <button onClick={startNewCaut} style={{position:"fixed",bottom:TAB_H+16,right:22,width:54,height:54,borderRadius:27,background:"#DC2626",border:"none",color:"#fff",fontSize:30,lineHeight:"1",cursor:"pointer",boxShadow:"0 4px 16px rgba(220,38,38,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,fontFamily:"inherit",fontWeight:300}}>+</button>
        </div>
      )}

      <TabBar active={activeTab} onChange={setActiveTab}/>

      {sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:90}}/>
          <div style={{position:"fixed",top:0,right:0,width:"min(300px, 85vw)",height:"100vh",background:C.white,zIndex:100,overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.18)"}}>
            <div style={{background:C.navy,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0}}><span style={{color:"#fff",fontSize:16,fontWeight:800}}>Manage Options</span><button onClick={()=>setSidebarOpen(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button></div>
            <div style={{padding:"8px 0 30px"}}>
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Data Backup</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <button onClick={exportData} style={{padding:"10px 14px",background:C.navy,border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>⬇️ Export backup file</button>
                  <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={importData}/>
                  <button onClick={()=>importRef.current?.click()} style={{padding:"10px 14px",background:"#F3F4F6",border:"none",borderRadius:10,color:C.text,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>⬆️ Import from backup</button>
                  {importStatus&&<div style={{fontSize:13,color:C.muted,padding:"4px 2px"}}>{importStatus}</div>}
                  <div style={{fontSize:11,color:C.muted,padding:"4px 2px",display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:13}}>☁️</span>
                    <span>{fmtSynced(lastSynced)}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>setIndOpen(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",fontFamily:"inherit"}}><span style={{fontSize:14,fontWeight:700,color:C.text}}>Industry</span><span style={{fontSize:11,color:C.muted,display:"inline-block",transform:indOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span></button>
              {indOpen&&(<div style={{padding:"6px 14px 14px"}}>{industries.map((ind,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>{editIndIdx===i?(<><input value={editIndVal} onChange={e=>setEditIndVal(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter")commitEditInd(i);if(e.key==="Escape")setEditIndIdx(null);}} style={{flex:1,border:`1.5px solid ${C.navy}`,borderRadius:7,padding:"5px 8px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}}/><button onClick={()=>commitEditInd(i)} style={{background:"#DCFCE7",border:"none",color:"#166534",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✓</button><button onClick={()=>setEditIndIdx(null)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button></>):(<><span style={{flex:1,fontSize:13,color:C.text}}>{ind}</span><button onClick={()=>{setEditIndIdx(i);setEditIndVal(ind);setEditCtxId(null);}} style={{background:C.blueBg,border:"none",color:C.blue,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✏️</button><button onClick={()=>removeIndustry(i)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button></>)}</div>))}<div style={{display:"flex",gap:7,marginTop:10}}><input value={newInd} onChange={e=>setNewInd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIndustry()} placeholder="Add new industry…" style={{flex:1,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}}/><button onClick={addIndustry} style={{background:C.amber,border:"none",borderRadius:9,width:36,height:36,color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>+</button></div></div>)}
              <button onClick={()=>setCtxOpen(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",fontFamily:"inherit"}}><span style={{fontSize:14,fontWeight:700,color:C.text}}>Where We Met</span><span style={{fontSize:11,color:C.muted,display:"inline-block",transform:ctxOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span></button>
              {ctxOpen&&(<div style={{padding:"6px 14px 14px"}}>{contexts.map(c=>(<div key={c.id} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>{editCtxId===c.id?(<><input value={editCtxVal} onChange={e=>setEditCtxVal(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter")commitEditCtx(c.id);if(e.key==="Escape")setEditCtxId(null);}} style={{flex:1,border:`1.5px solid ${C.navy}`,borderRadius:7,padding:"5px 8px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}}/><button onClick={()=>commitEditCtx(c.id)} style={{background:"#DCFCE7",border:"none",color:"#166534",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✓</button><button onClick={()=>setEditCtxId(null)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button></>):(<><span style={{flex:1,fontSize:13,color:C.text}}>{c.icon} {c.label}</span><button onClick={()=>{setEditCtxId(c.id);setEditCtxVal(c.label);setEditIndIdx(null);}} style={{background:C.blueBg,border:"none",color:C.blue,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✏️</button><button onClick={()=>removeContext(c.id)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button></>)}</div>))}<div style={{display:"flex",gap:7,marginTop:10}}><input value={newCtx} onChange={e=>setNewCtx(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addContext()} placeholder="Add new occasion…" style={{flex:1,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}}/><button onClick={addContext} style={{background:C.amber,border:"none",borderRadius:9,width:36,height:36,color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>+</button></div></div>)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
