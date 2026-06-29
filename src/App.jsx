import { useState, useEffect, useCallback, useRef } from "react";

/* ─── STORAGE KEYS ─────────────────────────────────────────────── */
const STORAGE_KEY  = "my-network-v2";
const PHOTO_PREFIX = "nw-photo-";
const IND_STORE    = "nw-industries-v2";
const CTX_STORE    = "nw-contexts-v2";
const TREES_STORE  = "nw-trees-v1";

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

function gradient(name = "") {
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) | 0;
  const [a, b] = GRADIENTS[Math.abs(h) % GRADIENTS.length];
  return `linear-gradient(135deg,${a},${b})`;
}
function initials(name = "") {
  return name.trim().split(/\s+/).filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0,2) || "?";
}
function ctxFor(id, list) {
  return (list||DEFAULT_CTX).find(c => c.id===id) ?? (list||DEFAULT_CTX)[0] ?? { id:"?", icon:"👤", label:"Other", bg:"#F3F4F6", fg:"#374151" };
}
function treeTypeFor(id) { return TREE_TYPES.find(t => t.id===id) ?? TREE_TYPES[3]; }
function indColor(i) { return IND_COLORS[((i%IND_COLORS.length)+IND_COLORS.length)%IND_COLORS.length]; }
function displayName(c) { return c.nickname || c.name || ""; }
function socialUrl(id, value) {
  if (!value) return null;
  const v = value.trim();
  if (v.startsWith("http")) return v;
  const h = v.replace(/^@/,"");
  if (id==="instagram") return `https://www.instagram.com/${h}`;
  if (id==="facebook")  return `https://www.facebook.com/${h}`;
  if (id==="line")      return `https://line.me/ti/p/~${h}`;
  return v;
}
async function resizeImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const MAX=900; let w=img.width,h=img.height;
        if(w>h){if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}}
        else{if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}}
        const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        resolve(cv.toDataURL("image/jpeg",0.72));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ─── DATA HELPERS ──────────────────────────────────────────────── */
function blank(defaultCtxId="event") {
  return { nickname:"",fullName:"",role:"",company:"",context:defaultCtxId,
           contextNote:"",industryTags:[],funFact:"",notes:"",
           photo:null,photoCleared:false,socials:{instagram:"",facebook:"",line:""} };
}
function formToContact(form,existingId) {
  return {
    id:existingId||uid(),
    nickname:form.nickname.trim(),fullName:form.fullName.trim(),
    role:form.role.trim(),company:form.company.trim(),
    context:form.context,contextNote:form.contextNote.trim(),
    industryTags:form.industryTags||[],funFact:form.funFact.trim(),notes:form.notes.trim(),
    socials:{instagram:(form.socials?.instagram||"").trim(),facebook:(form.socials?.facebook||"").trim(),line:(form.socials?.line||"").trim()},
    addedAt:existingId?undefined:new Date().toISOString(),
  };
}
function contactToForm(c,photo=null) {
  return {
    nickname:c.nickname||c.name||"",fullName:c.fullName||"",
    role:c.role||"",company:c.company||"",
    context:c.context||"event",contextNote:c.contextNote||"",
    industryTags:c.industryTags||c.tags||[],
    funFact:c.funFact||(c.helpsWith||[]).join(", ")||"",
    notes:c.notes||"",photo,photoCleared:false,
    socials:{instagram:c.socials?.instagram||"",facebook:c.socials?.facebook||"",line:c.socials?.line||""},
  };
}

/* ─── UI ATOMS — all at module level to prevent remount ─────────── */
function FL({children}) {
  return <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:7}}>{children}</div>;
}
function InfoCard({children,style}) {
  return <div style={{background:C.white,borderRadius:14,padding:"13px 15px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",...style}}>{children}</div>;
}
function MiniChip({bg,fg,children}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:999,fontSize:11,fontWeight:700,background:bg,color:fg}}>{children}</span>;
}
function NavBack({onClick}) {
  return <button onClick={onClick} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:9,padding:"7px 13px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>← Back</button>;
}
function Hr() { return <div style={{height:1,background:C.border,margin:"11px 0"}} />; }
const INP = {width:"100%",border:"none",outline:"none",fontSize:15,color:C.text,background:"transparent",padding:0,fontFamily:"inherit"};

function TabBar({active,onChange}) {
  const tabs = [{id:"network",icon:"🤝",label:"My Network"},{id:"trees",icon:"🌳",label:"Trees"}];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.white,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:40,height:TAB_H}}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",position:"relative",paddingBottom:4}}>
          <span style={{fontSize:22,lineHeight:1}}>{tab.icon}</span>
          <span style={{fontSize:10,fontWeight:700,color:active===tab.id?C.navy:C.muted}}>{tab.label}</span>
          {active===tab.id && <div style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:36,height:2.5,background:C.navy,borderRadius:2}} />}
        </button>
      ))}
    </div>
  );
}

/* TreeNodeView — recursive, module-level (critical for performance) */
function TreeNodeView({memberId,members,contacts,onNodePress,depth=0}) {
  const member = members.find(m => m.id===memberId);
  if (!member) return null;
  const contact = contacts.find(c => c.id===member.contactId);
  const children = members.filter(m => m.parentMemberId===memberId);
  const dn = contact ? displayName(contact) : "Unknown";
  return (
    <div style={{marginBottom:8}}>
      <div onClick={() => contact && onNodePress(contact)}
        style={{display:"flex",alignItems:"center",gap:10,background:C.white,borderRadius:13,padding:"11px 13px",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:contact?"pointer":"default"}}>
        <div style={{width:42,height:42,borderRadius:12,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,flexShrink:0,letterSpacing:-0.5}}>
          {initials(dn)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:contact?C.text:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</div>
          {member.role && <div style={{fontSize:12,color:C.muted,marginTop:1}}>{member.role}</div>}
        </div>
        {contact && <span style={{color:"#D1D5DB",fontSize:16,flexShrink:0}}>›</span>}
      </div>
      {children.length > 0 && (
        <div style={{marginLeft:22,paddingLeft:18,borderLeft:"2px solid #E5E7EB",marginTop:6}}>
          {children.map(child => (
            <TreeNodeView key={child.id} memberId={child.id} members={members} contacts={contacts} onNodePress={onNodePress} depth={depth+1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────────────── */
export default function App() {
  /* Contact state */
  const [contacts,       setContacts]       = useState([]);
  const [industries,     setIndustries]     = useState(DEFAULT_INDUSTRIES);
  const [contexts,       setContexts]       = useState(DEFAULT_CTX);
  /* Network view */
  const [view,           setView]           = useState("list");
  const [selected,       setSelected]       = useState(null);
  const [selectedPhoto,  setSelectedPhoto]  = useState(null);
  const [isEdit,         setIsEdit]         = useState(false);
  const [form,           setForm]           = useState(blank());
  const [search,         setSearch]         = useState("");
  const [filter,         setFilter]         = useState("all");
  const [delConfirm,     setDelConfirm]     = useState(false);
  const [fromTree,       setFromTree]       = useState(false);
  /* Tree state */
  const [trees,          setTrees]          = useState([]);
  const [tView,          setTView]          = useState("list");
  const [selTree,        setSelTree]        = useState(null);
  const [editTree,       setEditTree]       = useState(null);
  const [pickerSearch,   setPickerSearch]   = useState("");
  const [treeDelConfirm, setTreeDelConfirm] = useState(false);
  /* Global */
  const [activeTab,      setActiveTab]      = useState("network");
  const [ready,          setReady]          = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [indOpen,        setIndOpen]        = useState(false);
  const [ctxOpen,        setCtxOpen]        = useState(false);
  const [newInd,         setNewInd]         = useState("");
  const [newCtx,         setNewCtx]         = useState("");
  const [editIndIdx,     setEditIndIdx]     = useState(null);
  const [editIndVal,     setEditIndVal]     = useState("");
  const [editCtxId,      setEditCtxId]      = useState(null);
  const [editCtxVal,     setEditCtxVal]     = useState("");
  const [importStatus,   setImportStatus]   = useState("");
  const photoRef  = useRef(null);
  const importRef = useRef(null);

  /* ── Load ── */
  useEffect(() => {
    try { const d=localStorage.getItem(STORAGE_KEY); if(d) setContacts(JSON.parse(d)); } catch(_) {}
    try { const d=localStorage.getItem(IND_STORE);   if(d) setIndustries(JSON.parse(d)); } catch(_) {}
    try { const d=localStorage.getItem(CTX_STORE);   if(d) setContexts(JSON.parse(d)); } catch(_) {}
    try { const d=localStorage.getItem(TREES_STORE); if(d) setTrees(JSON.parse(d)); } catch(_) {}
    setReady(true);
  }, []);

  /* ── Persist ── */
  const persist   = useCallback((l) => { try{localStorage.setItem(STORAGE_KEY,JSON.stringify(l));}catch(_){} }, []);
  const saveInds  = (l) => { setIndustries(l); try{localStorage.setItem(IND_STORE,JSON.stringify(l));}catch(_){} };
  const saveCtxs  = (l) => { setContexts(l);   try{localStorage.setItem(CTX_STORE,JSON.stringify(l));}catch(_){} };
  const saveTrees = (l) => { setTrees(l);       try{localStorage.setItem(TREES_STORE,JSON.stringify(l));}catch(_){} };

  /* ── Industry management ── */
  const addIndustry    = () => { const n=newInd.trim(); if(!n||industries.some(x=>x.toLowerCase()===n.toLowerCase())) return; saveInds([...industries,n]); setNewInd(""); };
  const removeIndustry = (i) => { const name=industries[i]; saveInds(industries.filter((_,j)=>j!==i)); if(filter===name) setFilter("all"); };
  const commitEditInd  = (i) => { const n=editIndVal.trim(); if(!n){setEditIndIdx(null);return;} const old=industries[i]; saveInds(industries.map((v,j)=>j===i?n:v)); if(filter===old) setFilter(n); setEditIndIdx(null); };

  /* ── Context management ── */
  const addContext    = () => { const l=newCtx.trim(); if(!l||contexts.some(c=>c.label.toLowerCase()===l.toLowerCase())) return; const col=EXTRA_CTX_PALETTE[contexts.length%EXTRA_CTX_PALETTE.length]; saveCtxs([...contexts,{id:`ctx_${Date.now()}`,icon:"✨",label:l,bg:col.bg,fg:col.fg}]); setNewCtx(""); };
  const removeContext = (id) => saveCtxs(contexts.filter(c=>c.id!==id));
  const commitEditCtx = (id) => { const l=editCtxVal.trim(); if(!l){setEditCtxId(null);return;} saveCtxs(contexts.map(c=>c.id===id?{...c,label:l}:c)); setEditCtxId(null); };

  /* ── Export / Import ── */
  const exportData = () => {
    const photos={};
    contacts.forEach(c=>{const p=localStorage.getItem(PHOTO_PREFIX+c.id);if(p)photos[c.id]=p;});
    const payload={contacts,industries,contexts,trees,photos,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download=`my-network-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try {
        const data=JSON.parse(ev.target.result);
        if(data.contacts){setContacts(data.contacts);localStorage.setItem(STORAGE_KEY,JSON.stringify(data.contacts));}
        if(data.industries){setIndustries(data.industries);localStorage.setItem(IND_STORE,JSON.stringify(data.industries));}
        if(data.contexts){setContexts(data.contexts);localStorage.setItem(CTX_STORE,JSON.stringify(data.contexts));}
        if(data.trees){setTrees(data.trees);localStorage.setItem(TREES_STORE,JSON.stringify(data.trees));}
        if(data.photos){Object.entries(data.photos).forEach(([id,p])=>{try{localStorage.setItem(PHOTO_PREFIX+id,p);}catch(_){}});}
        setImportStatus("✅ Imported successfully!"); setTimeout(()=>setImportStatus(""),3000);
      } catch(_) { setImportStatus("❌ Invalid file."); setTimeout(()=>setImportStatus(""),3000); }
    };
    reader.readAsText(file); e.target.value="";
  };

  /* ── Form helpers ── */
  const fv=k=>form[k];
  const sf=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const toggleInd=ind=>setForm(p=>{const cur=p.industryTags||[];return{...p,industryTags:cur.includes(ind)?cur.filter(t=>t!==ind):[...cur,ind]};});
  const handlePhoto=useCallback(async e=>{
    const file=e.target.files?.[0]; if(!file) return;
    try{const r=await resizeImage(file);setForm(p=>({...p,photo:r,photoCleared:false}));}catch(_){}
    e.target.value="";
  },[]);

  /* ── Contact navigation ── */
  const openDetail=(c,fromTreeCtx=false)=>{
    setSelected(c); setDelConfirm(false); setFromTree(fromTreeCtx); setView("detail");
    try{setSelectedPhoto(localStorage.getItem(PHOTO_PREFIX+c.id)||null);}catch(_){setSelectedPhoto(null);}
  };
  const openEdit=useCallback(()=>{setForm(contactToForm(selected,selectedPhoto||null));setIsEdit(true);setView("form");},[selected,selectedPhoto]);
  const backFromDetail=()=>{
    setDelConfirm(false); setView("list");
    if(fromTree){ setFromTree(false); setActiveTab("trees"); }
  };

  /* ── Contact CRUD ── */
  const addContact=()=>{
    if(!fv("nickname").trim()) return;
    const c=formToContact(form); const updated=[c,...contacts];
    setContacts(updated); persist(updated);
    if(form.photo){try{localStorage.setItem(PHOTO_PREFIX+c.id,form.photo);}catch(_){}}
    setForm(blank(contexts[0]?.id)); setView("list");
  };
  const saveEdit=()=>{
    if(!fv("nickname").trim()) return;
    const c=formToContact(form,selected.id); const updated=contacts.map(x=>x.id===selected.id?c:x);
    setContacts(updated); persist(updated);
    if(form.photo){try{localStorage.setItem(PHOTO_PREFIX+selected.id,form.photo);}catch(_){}}
    else if(form.photoCleared){try{localStorage.removeItem(PHOTO_PREFIX+selected.id);}catch(_){}}
    setSelected(updated.find(x=>x.id===selected.id));
    setSelectedPhoto(form.photoCleared?null:(form.photo||selectedPhoto||null));
    setView("detail");
  };
  const removeContact=()=>{
    const updated=contacts.filter(c=>c.id!==selected.id);
    setContacts(updated); persist(updated);
    try{localStorage.removeItem(PHOTO_PREFIX+selected.id);}catch(_){}
    setDelConfirm(false); setView("list");
  };

  /* ── Tree navigation & CRUD ── */
  const startNewTree  = ()=>{ setEditTree({id:null,name:"",type:"company",members:[]}); setPickerSearch(""); setTreeDelConfirm(false); setTView("editor"); };
  const openTreeDetail= (tree)=>{ setSelTree(tree); setTreeDelConfirm(false); setTView("detail"); };
  const openTreeEditor= ()=>{ setEditTree({...selTree,members:[...selTree.members]}); setPickerSearch(""); setTreeDelConfirm(false); setTView("editor"); };
  const saveTree=()=>{
    if(!editTree?.name?.trim()) return;
    const td={...editTree,id:editTree.id||tuid(),name:editTree.name.trim(),createdAt:editTree.createdAt||new Date().toISOString()};
    const updated=trees.find(t=>t.id===td.id)?trees.map(t=>t.id===td.id?td:t):[...trees,td];
    saveTrees(updated); setSelTree(td); setTView("detail");
  };
  const deleteTree=()=>{
    saveTrees(trees.filter(t=>t.id!==selTree.id));
    setSelTree(null); setTreeDelConfirm(false); setTView("list");
  };
  const addTreeMember   =(contactId)=>{ if(!editTree||editTree.members.some(m=>m.contactId===contactId)) return; setEditTree(p=>({...p,members:[...p.members,{id:muid(),contactId,parentMemberId:null,role:""}]})); };
  const removeTreeMember=(memberId) =>{ setEditTree(p=>({...p,members:p.members.filter(m=>m.id!==memberId).map(m=>m.parentMemberId===memberId?{...m,parentMemberId:null}:m)})); };
  const updateTreeMember=(memberId,field,value)=>{ setEditTree(p=>({...p,members:p.members.map(m=>m.id===memberId?{...m,[field]:value}:m)})); };

  /* ── Filter / sort / group ── */
  const sorted=contacts
    .filter(c=>{
      const q=search.toLowerCase();
      const matchQ=!q||[displayName(c),c.fullName,c.role,c.company,c.contextNote,c.funFact,...(c.industryTags||[]),c.socials?.instagram,c.socials?.facebook,c.socials?.line].some(v=>(v||"").toLowerCase().includes(q));
      return matchQ&&(filter==="all"||(c.industryTags||[]).includes(filter));
    })
    .sort((a,b)=>displayName(a).localeCompare(displayName(b)));
  const grouped={}; sorted.forEach(c=>{const l=(displayName(c)[0]||"#").toUpperCase();(grouped[l]=grouped[l]||[]).push(c);});
  const letters=Object.keys(grouped).sort();

  const WRAP={fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:480,margin:"0 auto"};

  if(!ready) return <div style={{...WRAP,display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}><div style={{color:C.muted,fontSize:15}}>Loading…</div></div>;

  /* ════════════════ CONTACT FORM ════════════════ */
  if(view==="form") {
    const ok=fv("nickname").trim().length>0;
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
          <NavBack onClick={()=>{setForm(blank(contexts[0]?.id));setView(isEdit?"detail":"list");}} />
          <span style={{color:"#fff",fontSize:17,fontWeight:800}}>{isEdit?"Edit Contact":"Add to Network"}</span>
        </div>
        <div style={{padding:"12px 13px 20px",display:"flex",flexDirection:"column",gap:9}}>
          <InfoCard>
            <FL>Nickname *</FL>
            <input value={fv("nickname")} onChange={sf("nickname")} placeholder="What do you call them?" style={{...INP,marginBottom:10}} />
            <Hr/>
            <FL>Full Name</FL>
            <input value={fv("fullName")} onChange={sf("fullName")} placeholder="Optional — legal / formal name" style={INP} />
          </InfoCard>
          <InfoCard>
            <FL>Role / Occupation</FL>
            <input value={fv("role")} onChange={sf("role")} placeholder="e.g. Founder, Designer, Lawyer" style={{...INP,marginBottom:10}} />
            <Hr/>
            <FL>Company / Org</FL>
            <input value={fv("company")} onChange={sf("company")} placeholder="Where do they work?" style={INP} />
          </InfoCard>
          <InfoCard>
            <FL>Where we met</FL>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
              {contexts.map(c=>(
                <button key={c.id} onClick={()=>setForm(p=>({...p,context:c.id}))}
                  style={{padding:"8px 12px",borderRadius:9,border:`2px solid ${fv("context")===c.id?C.navy:C.border}`,background:fv("context")===c.id?C.navy:"transparent",color:fv("context")===c.id?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <FL>Occasion / Details</FL>
            <input value={fv("contextNote")} onChange={sf("contextNote")} placeholder="e.g. TechConf Bangkok 2024…" style={INP} />
          </InfoCard>
          <InfoCard>
            <FL>Industry</FL>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {industries.map((ind,i)=>{const col=indColor(i);const sel=(fv("industryTags")||[]).includes(ind);return(
                <button key={ind} onClick={()=>toggleInd(ind)} style={{padding:"6px 12px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",border:`2px solid ${sel?col.fg:C.border}`,background:sel?col.bg:"transparent",color:sel?col.fg:C.muted}}>{ind}</button>
              );})}
            </div>
          </InfoCard>
          <InfoCard>
            <FL>Fun Fact</FL>
            <textarea value={fv("funFact")} onChange={sf("funFact")} rows={3} placeholder="e.g. Speaks 4 languages, ex-F1 engineer…" style={{...INP,resize:"none",lineHeight:1.55}} />
          </InfoCard>
          <InfoCard>
            <FL>Notes</FL>
            <textarea value={fv("notes")} onChange={sf("notes")} rows={3} placeholder="Anything else to remember…" style={{...INP,resize:"none",lineHeight:1.55}} />
          </InfoCard>
          <InfoCard>
            <FL>Social Media</FL>
            {SOCIALS.map((p,i)=>(
              <div key={p.id}>{i>0&&<Hr/>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:p.grad,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:900}}>{p.abbr}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",marginBottom:4}}>{p.label}</div>
                    <input value={fv("socials")?.[p.id]||""} onChange={e=>setForm(prev=>({...prev,socials:{...prev.socials,[p.id]:e.target.value}}))} placeholder={p.placeholder} style={INP} />
                  </div>
                </div>
              </div>
            ))}
          </InfoCard>
          <InfoCard>
            <FL>Photo / Business Card</FL>
            <input ref={photoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto} />
            {fv("photo")?(
              <div style={{position:"relative"}}>
                <img src={fv("photo")} alt="" style={{width:"100%",borderRadius:10,maxHeight:260,objectFit:"cover",display:"block"}} />
                <button onClick={()=>setForm(p=>({...p,photo:null,photoCleared:true}))} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.55)",border:"none",color:"#fff",borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
              </div>
            ):(
              <div onClick={()=>photoRef.current?.click()} style={{border:`2px dashed ${C.border}`,borderRadius:12,padding:"22px 16px",textAlign:"center",cursor:"pointer"}}>
                <div style={{fontSize:26,marginBottom:6}}>📷</div>
                <div style={{fontSize:13,color:C.muted,fontWeight:500}}>Tap to attach a photo or business card</div>
              </div>
            )}
          </InfoCard>
          <button onClick={isEdit?saveEdit:addContact} disabled={!ok}
            style={{background:ok?C.amber:C.border,border:"none",borderRadius:14,padding:15,color:ok?"#fff":C.muted,fontSize:15,fontWeight:800,cursor:ok?"pointer":"not-allowed",boxShadow:ok?"0 4px 14px rgba(245,158,11,0.4)":"none",fontFamily:"inherit"}}>
            {isEdit?"Save Changes":"Add to Network"}
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════ CONTACT DETAIL ════════════════ */
  if(view==="detail"&&selected) {
    const ctx=ctxFor(selected.context,contexts); const dn=displayName(selected);
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px 22px",position:"sticky",top:0,zIndex:10}}>
          <NavBack onClick={backFromDetail} />
          <div style={{width:72,height:72,borderRadius:20,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,fontWeight:800,letterSpacing:-0.5,marginTop:14}}>{initials(dn)}</div>
          <div style={{color:"#fff",fontSize:22,fontWeight:800,marginTop:10,letterSpacing:-0.5}}>{dn}</div>
          {selected.fullName&&<div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginTop:2,fontStyle:"italic"}}>{selected.fullName}</div>}
          {(selected.role||selected.company)&&<div style={{color:"#90A4C8",fontSize:13,marginTop:4}}>{[selected.role,selected.company].filter(Boolean).join(" · ")}</div>}
          <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
            <MiniChip bg="rgba(255,255,255,0.15)" fg="#fff">{ctx.icon} {ctx.label}</MiniChip>
            {selected.contextNote&&<MiniChip bg="rgba(255,255,255,0.1)" fg="rgba(255,255,255,0.75)">{selected.contextNote}</MiniChip>}
          </div>
        </div>
        <div style={{padding:"12px 13px",display:"flex",flexDirection:"column",gap:9}}>
          {(selected.industryTags||[]).length>0&&(
            <InfoCard><FL>Industry</FL><div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {selected.industryTags.map((ind,i)=>{const idx=industries.indexOf(ind);const col=indColor(idx>=0?idx:i);return <MiniChip key={i} bg={col.bg} fg={col.fg}>{ind}</MiniChip>;})}
            </div></InfoCard>
          )}
          {selected.funFact&&<InfoCard><FL>Fun Fact</FL><div style={{fontSize:15,color:C.text,lineHeight:1.6}}>{selected.funFact}</div></InfoCard>}
          {selected.notes&&<InfoCard><FL>Notes</FL><div style={{fontSize:15,color:C.text,lineHeight:1.6}}>{selected.notes}</div></InfoCard>}
          {SOCIALS.some(p=>selected.socials?.[p.id])&&(
            <InfoCard><FL>Social Media</FL><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {SOCIALS.filter(p=>selected.socials?.[p.id]).map(p=>{const url=socialUrl(p.id,selected.socials[p.id]);return(
                <button key={p.id} onClick={()=>url&&window.open(url,"_blank")} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 16px",borderRadius:10,border:"none",background:p.grad,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 6px rgba(0,0,0,0.15)"}}>
                  <span style={{fontSize:11,fontWeight:900,background:"rgba(255,255,255,0.25)",borderRadius:5,padding:"1px 5px"}}>{p.abbr}</span>{p.label}
                </button>
              );})}
            </div></InfoCard>
          )}
          {selectedPhoto&&<InfoCard style={{padding:0,overflow:"hidden"}}><img src={selectedPhoto} alt="" style={{width:"100%",borderRadius:14,display:"block",objectFit:"contain",maxHeight:340}} /></InfoCard>}
          {!fromTree&&(!delConfirm?(
            <div style={{display:"flex",gap:9,marginTop:2}}>
              <button onClick={openEdit} style={{flex:1,padding:13,border:`2px solid ${C.navy}`,background:"transparent",borderRadius:13,fontSize:15,fontWeight:700,color:C.navy,cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
              <button onClick={()=>setDelConfirm(true)} style={{flex:1,padding:13,border:"none",background:C.redBg,borderRadius:13,fontSize:15,fontWeight:700,color:C.red,cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
            </div>
          ):(
            <InfoCard style={{border:`1px solid ${C.redBg}`}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12,textAlign:"center"}}>Remove {dn} from your network?</div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setDelConfirm(false)} style={{flex:1,padding:11,border:`1px solid ${C.border}`,background:"transparent",borderRadius:11,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={removeContact} style={{flex:1,padding:11,border:"none",background:C.red,borderRadius:11,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Yes, Remove</button>
              </div>
            </InfoCard>
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════ TREE EDITOR ════════════════ */
  if(tView==="editor"&&editTree!==null) {
    const et=editTree; const okTree=et.name?.trim().length>0;
    const availableContacts=contacts
      .filter(c=>!pickerSearch||(displayName(c).toLowerCase().includes(pickerSearch.toLowerCase())||(c.role||"").toLowerCase().includes(pickerSearch.toLowerCase())))
      .sort((a,b)=>displayName(a).localeCompare(displayName(b)));
    const alreadyAdded=new Set(et.members.map(m=>m.contactId));
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
          <NavBack onClick={()=>{setTreeDelConfirm(false);setTView(selTree?"detail":"list");}} />
          <span style={{color:"#fff",fontSize:17,fontWeight:800}}>{et.id?"Edit Tree":"New Tree"}</span>
        </div>
        <div style={{padding:"12px 13px 20px",display:"flex",flexDirection:"column",gap:9}}>

          <InfoCard>
            <FL>Tree Name *</FL>
            <input value={et.name} onChange={e=>setEditTree(p=>({...p,name:e.target.value}))} placeholder="e.g. Acme Corp, Smith Family, Golf Club…" style={INP} />
          </InfoCard>

          <InfoCard>
            <FL>Type</FL>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {TREE_TYPES.map(t=>(
                <button key={t.id} onClick={()=>setEditTree(p=>({...p,type:t.id}))}
                  style={{padding:"8px 13px",borderRadius:9,border:`2px solid ${et.type===t.id?C.navy:C.border}`,background:et.type===t.id?C.navy:"transparent",color:et.type===t.id?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </InfoCard>

          {/* Members */}
          {et.members.length>0&&(
            <div>
              <div style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase",padding:"4px 2px 8px"}}>Members ({et.members.length})</div>
              {et.members.map(m=>{
                const contact=contacts.find(c=>c.id===m.contactId);
                const dn=contact?displayName(contact):"Unknown";
                return (
                  <InfoCard key={m.id} style={{marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                      <div style={{width:38,height:38,borderRadius:11,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:800,flexShrink:0}}>{initials(dn)}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:C.text}}>{dn}</div>
                        {contact?.role&&<div style={{fontSize:11,color:C.muted}}>{contact.role}</div>}
                      </div>
                      <button onClick={()=>removeTreeMember(m.id)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <span style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",width:46,flexShrink:0}}>Role</span>
                      <input value={m.role} onChange={e=>updateTreeMember(m.id,"role",e.target.value)} placeholder="e.g. CEO, Father, Captain…"
                        style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit",background:"transparent"}} />
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:10,fontWeight:800,color:C.muted,letterSpacing:0.8,textTransform:"uppercase",width:46,flexShrink:0}}>Under</span>
                      <select value={m.parentMemberId||""} onChange={e=>updateTreeMember(m.id,"parentMemberId",e.target.value||null)}
                        style={{flex:1,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",fontSize:13,color:C.text,background:C.white,fontFamily:"inherit",outline:"none"}}>
                        <option value="">— Root (no parent) —</option>
                        {et.members.filter(x=>x.id!==m.id).map(x=>{
                          const xc=contacts.find(c=>c.id===x.contactId);
                          const xn=xc?displayName(xc):"?";
                          return <option key={x.id} value={x.id}>{xn}{x.role?` (${x.role})`:""}</option>;
                        })}
                      </select>
                    </div>
                  </InfoCard>
                );
              })}
            </div>
          )}

          {/* Contact picker */}
          <InfoCard>
            <FL>Add from My Network</FL>
            <input value={pickerSearch} onChange={e=>setPickerSearch(e.target.value)} placeholder="Search contacts…"
              style={{...INP,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,marginBottom:8}} />
            {contacts.length===0?(
              <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"12px 0"}}>No contacts yet — add people in My Network first.</div>
            ):(
              <div style={{maxHeight:220,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
                {availableContacts.map(c=>{
                  const added=alreadyAdded.has(c.id);
                  return(
                    <div key={c.id} onClick={()=>!added&&addTreeMember(c.id)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:10,background:added?"#F9FAFB":C.white,cursor:added?"default":"pointer",border:`1px solid ${C.border}`,opacity:added?0.5:1}}>
                      <div style={{width:34,height:34,borderRadius:10,background:gradient(displayName(c)),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800,flexShrink:0}}>{initials(displayName(c))}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{displayName(c)}</div>
                        {(c.role||c.company)&&<div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[c.role,c.company].filter(Boolean).join(" · ")}</div>}
                      </div>
                      <span style={{fontSize:16,color:added?C.muted:C.amber,fontWeight:700,flexShrink:0}}>{added?"✓":"+"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </InfoCard>

          <button onClick={saveTree} disabled={!okTree}
            style={{background:okTree?C.amber:C.border,border:"none",borderRadius:14,padding:15,color:okTree?"#fff":C.muted,fontSize:15,fontWeight:800,cursor:okTree?"pointer":"not-allowed",boxShadow:okTree?"0 4px 14px rgba(245,158,11,0.4)":"none",fontFamily:"inherit"}}>
            Save Tree
          </button>

          {et.id&&(!treeDelConfirm?(
            <button onClick={()=>setTreeDelConfirm(true)} style={{background:"transparent",border:`1.5px solid ${C.red}`,borderRadius:14,padding:13,color:C.red,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Delete This Tree</button>
          ):(
            <InfoCard style={{border:`1px solid ${C.redBg}`}}>
              <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:12,textAlign:"center"}}>Delete "{et.name}"? This cannot be undone.</div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>setTreeDelConfirm(false)} style={{flex:1,padding:11,border:`1px solid ${C.border}`,background:"transparent",borderRadius:11,fontSize:14,fontWeight:600,color:C.muted,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={deleteTree} style={{flex:1,padding:11,border:"none",background:C.red,borderRadius:11,fontSize:14,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Yes, Delete</button>
              </div>
            </InfoCard>
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════ TREE DETAIL ════════════════ */
  if(tView==="detail"&&selTree) {
    const typeInfo=treeTypeFor(selTree.type);
    const roots=selTree.members.filter(m=>!m.parentMemberId);
    return (
      <div style={{...WRAP,paddingBottom:30}}>
        <div style={{background:C.navy,padding:"14px 16px 18px",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <NavBack onClick={()=>setTView("list")} />
            <button onClick={openTreeEditor} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>✏️ Edit</button>
          </div>
          <div style={{marginTop:12}}>
            <div style={{color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.5}}>{selTree.name}</div>
            <div style={{marginTop:7,display:"flex",gap:6,flexWrap:"wrap"}}>
              <MiniChip bg="rgba(255,255,255,0.15)" fg="#fff">{typeInfo.icon} {typeInfo.label}</MiniChip>
              <MiniChip bg="rgba(255,255,255,0.1)" fg="rgba(255,255,255,0.75)">{selTree.members.length} {selTree.members.length===1?"person":"people"}</MiniChip>
            </div>
          </div>
        </div>
        <div style={{padding:"12px 13px 90px"}}>
          {roots.length===0?(
            <div style={{textAlign:"center",padding:"52px 24px",color:C.muted}}>
              <div style={{fontSize:44,marginBottom:10}}>🌱</div>
              <div style={{fontSize:16,fontWeight:700,color:"#374151",marginBottom:6}}>This tree is empty</div>
              <div style={{fontSize:13,lineHeight:1.6}}>Tap Edit to add people and define who belongs under who.</div>
            </div>
          ):roots.map(root=>(
            <TreeNodeView key={root.id} memberId={root.id} members={selTree.members} contacts={contacts} onNodePress={(c)=>openDetail(c,true)} depth={0} />
          ))}
        </div>
      </div>
    );
  }

  /* ════════════════ MAIN LIST VIEWS (with tab bar) ════════════════ */
  return (
    <div style={{...WRAP,paddingBottom:TAB_H}}>

      {/* ─── MY NETWORK TAB ─── */}
      {activeTab==="network"&&(
        <div>
          <div style={{background:C.navy,padding:"14px 16px 13px",position:"sticky",top:0,zIndex:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:11}}>
              <div>
                <div style={{color:"#fff",fontSize:21,fontWeight:800,letterSpacing:-0.5}}>My Network</div>
                <div style={{color:"#8A9BC8",fontSize:11,marginTop:1}}>{contacts.length} {contacts.length===1?"person":"people"}</div>
              </div>
              <button onClick={()=>setSidebarOpen(true)} style={{background:"rgba(255,255,255,0.12)",border:"none",color:"#fff",borderRadius:9,padding:"8px 11px",cursor:"pointer",fontSize:18,lineHeight:1,fontFamily:"inherit"}}>☰</button>
            </div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,display:"flex",alignItems:"center",padding:"0 11px",gap:7}}>
              <span style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, industry, fun fact…"
                style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:14,padding:"10px 0",fontFamily:"inherit"}} />
              {search&&<span onClick={()=>setSearch("")} style={{color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:18,lineHeight:1}}>×</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:7,padding:"11px 13px 0",overflowX:"auto",scrollbarWidth:"none"}}>
            {["all",...industries].map(ind=>(
              <button key={ind} onClick={()=>setFilter(ind)}
                style={{flexShrink:0,padding:"6px 13px",borderRadius:999,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",outline:"none",fontFamily:"inherit",background:filter===ind?C.navy:C.white,color:filter===ind?"#fff":C.muted,boxShadow:filter===ind?"0 2px 8px rgba(27,42,92,0.18)":"0 1px 2px rgba(0,0,0,0.07)"}}>
                {ind==="all"?"All":ind}
              </button>
            ))}
          </div>
          <div style={{padding:"8px 11px 0"}}>
            {sorted.length===0?(
              <div style={{textAlign:"center",padding:"56px 22px",color:C.muted}}>
                <div style={{fontSize:44,marginBottom:10}}>{contacts.length===0?"👋":"🔍"}</div>
                <div style={{fontSize:17,fontWeight:700,color:"#374151",marginBottom:7}}>{contacts.length===0?"Start building your network":"No one found"}</div>
                <div style={{fontSize:13,lineHeight:1.6}}>{contacts.length===0?"Tap + to add your first contact.":"Try a different search or filter."}</div>
              </div>
            ):letters.map(letter=>(
              <div key={letter}>
                <div style={{fontSize:11,fontWeight:800,color:C.muted,letterSpacing:1.2,padding:"10px 4px 5px",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,marginBottom:4}}>{letter}</div>
                {grouped[letter].map(c=>{
                  const ctx=ctxFor(c.context,contexts); const dn=displayName(c);
                  return(
                    <div key={c.id} onClick={()=>openDetail(c)}
                      style={{background:C.white,borderRadius:13,marginBottom:6,padding:"13px",display:"flex",alignItems:"center",gap:11,boxShadow:"0 1px 3px rgba(0,0,0,0.06)",cursor:"pointer"}}>
                      <div style={{width:48,height:48,borderRadius:13,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:16,fontWeight:800,flexShrink:0,letterSpacing:-0.5}}>{initials(dn)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dn}</div>
                        {(c.role||c.company)&&<div style={{fontSize:11,color:C.muted,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{[c.role,c.company].filter(Boolean).join(" · ")}</div>}
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <MiniChip bg={ctx.bg} fg={ctx.fg}>{ctx.icon} {ctx.label}</MiniChip>
                          {(c.industryTags||[]).slice(0,1).map((ind,i)=>{const idx=industries.indexOf(ind);const col=indColor(idx>=0?idx:i);return <MiniChip key={i} bg={col.bg} fg={col.fg}>{ind}</MiniChip>;})}
                          {(c.industryTags||[]).length>1&&<MiniChip bg="#F3F4F6" fg={C.muted}>+{c.industryTags.length-1}</MiniChip>}
                        </div>
                      </div>
                      <span style={{color:"#D1D5DB",fontSize:18,flexShrink:0}}>›</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <button onClick={()=>{setForm(blank(contexts[0]?.id));setIsEdit(false);setView("form");}}
            style={{position:"fixed",bottom:TAB_H+16,right:22,width:54,height:54,borderRadius:27,background:C.amber,border:"none",color:"#fff",fontSize:30,lineHeight:"1",cursor:"pointer",boxShadow:"0 4px 16px rgba(245,158,11,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,fontFamily:"inherit",fontWeight:300}}>+</button>
        </div>
      )}

      {/* ─── TREES TAB ─── */}
      {activeTab==="trees"&&(
        <div>
          <div style={{background:C.navy,padding:"14px 16px 16px",position:"sticky",top:0,zIndex:10}}>
            <div style={{color:"#fff",fontSize:21,fontWeight:800,letterSpacing:-0.5}}>Trees</div>
            <div style={{color:"#8A9BC8",fontSize:11,marginTop:1}}>{trees.length} {trees.length===1?"tree":"trees"}</div>
          </div>
          <div style={{padding:"12px 11px 0"}}>
            {trees.length===0?(
              <div style={{textAlign:"center",padding:"60px 24px",color:C.muted}}>
                <div style={{fontSize:52,marginBottom:14}}>🌳</div>
                <div style={{fontSize:17,fontWeight:700,color:"#374151",marginBottom:8}}>No trees yet</div>
                <div style={{fontSize:13,lineHeight:1.7}}>Tap + to create your first tree and map out an organization, family, or social group.</div>
              </div>
            ):trees.map(tree=>{
              const typeInfo=treeTypeFor(tree.type);
              return(
                <div key={tree.id} onClick={()=>openTreeDetail(tree)}
                  style={{background:C.white,borderRadius:14,marginBottom:10,padding:"14px 16px",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                    <div style={{fontSize:16,fontWeight:800,color:C.text}}>{tree.name}</div>
                    <MiniChip bg={typeInfo.bg} fg={typeInfo.fg}>{typeInfo.icon} {typeInfo.label}</MiniChip>
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{tree.members.length} {tree.members.length===1?"person":"people"}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div style={{display:"flex"}}>
                      {tree.members.slice(0,6).map((m,i)=>{
                        const contact=contacts.find(c=>c.id===m.contactId);
                        const dn=contact?displayName(contact):"?";
                        return(
                          <div key={m.id} style={{width:30,height:30,borderRadius:9,background:gradient(dn),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800,border:"2px solid #fff",marginLeft:i>0?-8:0,zIndex:tree.members.length-i}}>
                            {initials(dn)}
                          </div>
                        );
                      })}
                      {tree.members.length>6&&(
                        <div style={{width:30,height:30,borderRadius:9,background:C.muted,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:800,border:"2px solid #fff",marginLeft:-8}}>
                          +{tree.members.length-6}
                        </div>
                      )}
                    </div>
                    <span style={{color:"#D1D5DB",fontSize:18}}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={startNewTree}
            style={{position:"fixed",bottom:TAB_H+16,right:22,width:54,height:54,borderRadius:27,background:C.amber,border:"none",color:"#fff",fontSize:30,lineHeight:"1",cursor:"pointer",boxShadow:"0 4px 16px rgba(245,158,11,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:20,fontFamily:"inherit",fontWeight:300}}>+</button>
        </div>
      )}

      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* ─── SIDEBAR ─── */}
      {sidebarOpen&&(
        <>
          <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:90}} />
          <div style={{position:"fixed",top:0,right:0,width:"min(300px, 85vw)",height:"100vh",background:C.white,zIndex:100,overflowY:"auto",boxShadow:"-4px 0 24px rgba(0,0,0,0.18)"}}>
            <div style={{background:C.navy,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0}}>
              <span style={{color:"#fff",fontSize:16,fontWeight:800}}>Manage Options</span>
              <button onClick={()=>setSidebarOpen(false)} style={{background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
            </div>
            <div style={{padding:"8px 0 30px"}}>
              <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,fontWeight:800,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Data Backup</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <button onClick={exportData} style={{padding:"10px 14px",background:C.navy,border:"none",borderRadius:10,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>⬇️ Export backup file</button>
                  <input ref={importRef} type="file" accept=".json" style={{display:"none"}} onChange={importData} />
                  <button onClick={()=>importRef.current?.click()} style={{padding:"10px 14px",background:"#F3F4F6",border:"none",borderRadius:10,color:C.text,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>⬆️ Import from backup</button>
                  {importStatus&&<div style={{fontSize:13,color:C.muted,padding:"4px 2px"}}>{importStatus}</div>}
                </div>
              </div>
              {/* Industries */}
              <button onClick={()=>setIndOpen(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:14,fontWeight:700,color:C.text}}>Industry</span>
                <span style={{fontSize:11,color:C.muted,display:"inline-block",transform:indOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
              </button>
              {indOpen&&(
                <div style={{padding:"6px 14px 14px"}}>
                  {industries.map((ind,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                      {editIndIdx===i?(
                        <>
                          <input value={editIndVal} onChange={e=>setEditIndVal(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter")commitEditInd(i);if(e.key==="Escape")setEditIndIdx(null);}} style={{flex:1,border:`1.5px solid ${C.navy}`,borderRadius:7,padding:"5px 8px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}} />
                          <button onClick={()=>commitEditInd(i)} style={{background:"#DCFCE7",border:"none",color:"#166534",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✓</button>
                          <button onClick={()=>setEditIndIdx(null)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
                        </>
                      ):(
                        <>
                          <span style={{flex:1,fontSize:13,color:C.text}}>{ind}</span>
                          <button onClick={()=>{setEditIndIdx(i);setEditIndVal(ind);setEditCtxId(null);}} style={{background:C.blueBg,border:"none",color:C.blue,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✏️</button>
                          <button onClick={()=>removeIndustry(i)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
                        </>
                      )}
                    </div>
                  ))}
                  <div style={{display:"flex",gap:7,marginTop:10}}>
                    <input value={newInd} onChange={e=>setNewInd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addIndustry()} placeholder="Add new industry…" style={{flex:1,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}} />
                    <button onClick={addIndustry} style={{background:C.amber,border:"none",borderRadius:9,width:36,height:36,color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>+</button>
                  </div>
                </div>
              )}
              {/* Where We Met */}
              <button onClick={()=>setCtxOpen(p=>!p)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",fontFamily:"inherit"}}>
                <span style={{fontSize:14,fontWeight:700,color:C.text}}>Where We Met</span>
                <span style={{fontSize:11,color:C.muted,display:"inline-block",transform:ctxOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
              </button>
              {ctxOpen&&(
                <div style={{padding:"6px 14px 14px"}}>
                  {contexts.map(c=>(
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                      {editCtxId===c.id?(
                        <>
                          <input value={editCtxVal} onChange={e=>setEditCtxVal(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter")commitEditCtx(c.id);if(e.key==="Escape")setEditCtxId(null);}} style={{flex:1,border:`1.5px solid ${C.navy}`,borderRadius:7,padding:"5px 8px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}} />
                          <button onClick={()=>commitEditCtx(c.id)} style={{background:"#DCFCE7",border:"none",color:"#166534",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✓</button>
                          <button onClick={()=>setEditCtxId(null)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
                        </>
                      ):(
                        <>
                          <span style={{flex:1,fontSize:13,color:C.text}}>{c.icon} {c.label}</span>
                          <button onClick={()=>{setEditCtxId(c.id);setEditCtxVal(c.label);setEditIndIdx(null);}} style={{background:C.blueBg,border:"none",color:C.blue,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✏️</button>
                          <button onClick={()=>removeContext(c.id)} style={{background:C.redBg,border:"none",color:C.red,borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>✕</button>
                        </>
                      )}
                    </div>
                  ))}
                  <div style={{display:"flex",gap:7,marginTop:10}}>
                    <input value={newCtx} onChange={e=>setNewCtx(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addContext()} placeholder="Add new occasion…" style={{flex:1,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 10px",fontSize:13,outline:"none",color:C.text,fontFamily:"inherit"}} />
                    <button onClick={addContext} style={{background:C.amber,border:"none",borderRadius:9,width:36,height:36,color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>+</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
