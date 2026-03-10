import { useState, useEffect, useCallback, useRef } from "react";

/* ═══ CONSTANTS ═══ */
const INGREDIENTS = ["pan","lechuga","tomate","carne","queso","pollo","huevo","cebolla","palta"];
const ING_EMOJI = {pan:"🍞",lechuga:"🥬",tomate:"🍅",carne:"🥩",queso:"🧀",pollo:"🍗",huevo:"🥚",cebolla:"🧅",palta:"🥑",perrito:"🌭"};
const ING_BG = {pan:"#D4A574",lechuga:"#7CB342",tomate:"#E53935",carne:"#8D6E63",queso:"#FFD54F",pollo:"#FF8A65",huevo:"#FFF9C4",cebolla:"#CE93D8",palta:"#66BB6A",perrito:"#E8B87A"};
const LANGUAGES = ["español","inglés","francés","italiano","alemán","portugués"];
const LANG_SHORT = {español:"ESP",inglés:"ING",francés:"FRA",italiano:"ITA",alemán:"ALE",portugués:"POR"};
// Colors matched from uploaded card images
const LANG_BORDER = {español:"#C41E1E",inglés:"#1a1a1a",francés:"#E65100",italiano:"#8D7B5A",alemán:"#2E7D32",portugués:"#5D4037"};
const LANG_BG =     {español:"#FFF2CC",inglés:"#2A2A2A",francés:"#FFF0E8",italiano:"#FFF8E1",alemán:"#E8F5E9",portugués:"#F5F0EB"};
const LANG_TEXT =   {español:"#C41E1E",inglés:"#E0E0E0",francés:"#E65100",italiano:"#8D7B5A",alemán:"#2E7D32",portugués:"#5D4037"};
const LANG_BADGE =  {español:"#DAA520",inglés:"#333",francés:"#E65100",italiano:"#8D7B5A",alemán:"#2E7D32",portugués:"#5D4037"};
const FRUITS_VEGS = ["lechuga","tomate","cebolla","palta"];

const ING_NAMES = {
  pan:     {español:"Pan",     inglés:"Bread",   francés:"Pain",    italiano:"Pane",    alemán:"Brot",     portugués:"Pão"},
  lechuga: {español:"Lechuga", inglés:"Lettuce", francés:"Laitue",  italiano:"Lattuga", alemán:"Salat",    portugués:"Alface"},
  tomate:  {español:"Tomate",  inglés:"Tomato",  francés:"Tomate",  italiano:"Pomodoro",alemán:"Tomate",   portugués:"Tomate"},
  carne:   {español:"Carne",   inglés:"Beef",    francés:"Viande",  italiano:"Carne",   alemán:"Fleisch",  portugués:"Carne"},
  queso:   {español:"Queso",   inglés:"Cheese",  francés:"Fromage", italiano:"Formaggio",alemán:"Käse",    portugués:"Queijo"},
  pollo:   {español:"Pollo",   inglés:"Chicken", francés:"Poulet",  italiano:"Pollo",   alemán:"Hähnchen", portugués:"Frango"},
  huevo:   {español:"Huevo",   inglés:"Egg",     francés:"Œuf",     italiano:"Uovo",    alemán:"Ei",       portugués:"Ovo"},
  cebolla: {español:"Cebolla", inglés:"Onion",   francés:"Oignon",  italiano:"Cipolla", alemán:"Zwiebel",  portugués:"Cebola"},
  palta:   {español:"Palta",   inglés:"Avocado", francés:"Avocat",  italiano:"Avocado", alemán:"Avocado",  portugués:"Abacate"},
  perrito: {español:"Comodín", inglés:"Wildcard", francés:"Joker",  italiano:"Jolly",   alemán:"Joker",    portugués:"Coringa"},
};

const getIngName = (ing, lang) => ING_NAMES[ing]?.[lang] || ing;

const ACTION_CARDS = [
  {id:"milanesa",name:"La Milanesa",emoji:"🍖",desc:"Todos descartan pan y huevo"},
  {id:"ensalada",name:"La Ensalada",emoji:"🥗",desc:"Todos descartan frutas/verduras"},
  {id:"pizza",name:"La Pizza",emoji:"🍕",desc:"Todos descartan queso"},
  {id:"parrilla",name:"La Parrilla",emoji:"🔥",desc:"Todos descartan pollo y carne"},
  {id:"tenedor",name:"El Tenedor",emoji:"🍴",desc:"Roba ingrediente de otro"},
  {id:"ladron",name:"Ladrón Sombreros",emoji:"🎩",desc:"Quita sombrero principal"},
  {id:"intercambio_sombreros",name:"Intercambio Sombreros",emoji:"🔄",desc:"Intercambia sombreros"},
  {id:"intercambio_hamburguesa",name:"Intercambio Mesa",emoji:"🍔",desc:"Intercambia ingredientes de mesa"},
  {id:"cambio_sombrero",name:"Cambio Sombrero",emoji:"👒",desc:"Cambia perchero + juega"},
  {id:"basurero",name:"El Basurero",emoji:"🗑️",desc:"Busca en descartes"},
  {id:"gloton",name:"El Glotón",emoji:"😋",desc:"Vacía mesa de otro"},
  {id:"negacion",name:"Negación",emoji:"🚫",desc:"Bloquea acción enemiga"},
];

const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; };
const uid = () => Math.random().toString(36).substr(2,9);
const gAI = id => ACTION_CARDS.find(a=>a.id===id);

/* ═══ SVG HATS ═══ */
const HatSVG = ({lang, size=40}) => {
  const h = size, w = size * 1.3;
  const hats = {
    español: (
      <svg viewBox="0 0 120 76" width={w} height={h}><ellipse cx="60" cy="60" rx="55" ry="13" fill="#C8960F" stroke="#1a1a1a" strokeWidth="2.5"/><path d="M28 60Q28 34 60 26Q92 34 92 60" fill="#DAA520" stroke="#1a1a1a" strokeWidth="2.5"/><ellipse cx="60" cy="26" rx="19" ry="5" fill="#E0B030" stroke="#1a1a1a" strokeWidth="1.5"/><path d="M30 49Q60 43 90 49" fill="none" stroke="#C41E1E" strokeWidth="3.5"/><circle cx="44" cy="45" r="3" fill="#C41E1E"/><circle cx="76" cy="45" r="3" fill="#C41E1E"/><path d="M15 64L30 60 45 66 60 60 75 66 90 60 105 64" fill="none" stroke="#C41E1E" strokeWidth="3"/></svg>
    ),
    inglés: (
      <svg viewBox="0 0 80 85" width={h*0.9} height={h}><ellipse cx="40" cy="72" rx="30" ry="8" fill="#222" stroke="#111" strokeWidth="2.5"/><rect x="18" y="16" width="44" height="56" rx="3" fill="#2D2D2D" stroke="#111" strokeWidth="2.5"/><ellipse cx="40" cy="16" rx="22" ry="6" fill="#353535" stroke="#111" strokeWidth="1.5"/><rect x="18" y="56" width="44" height="6" fill="#252525"/></svg>
    ),
    francés: (
      <svg viewBox="0 0 85 50" width={w*0.9} height={h*0.65}><ellipse cx="42" cy="38" rx="38" ry="10" fill="#B71C1C" stroke="#1a1a1a" strokeWidth="2.5"/><ellipse cx="42" cy="28" rx="30" ry="13" fill="#D32F2F" stroke="#1a1a1a" strokeWidth="2"/><ellipse cx="40" cy="20" rx="20" ry="10" fill="#E53935"/><path d="M26 22Q40 10 56 22" fill="#EF5350" opacity="0.5"/></svg>
    ),
    italiano: (
      <svg viewBox="0 0 108 65" width={w} height={h*0.82}><ellipse cx="54" cy="54" rx="48" ry="9" fill="#C5B896" stroke="#1a1a1a" strokeWidth="2.5"/><path d="M20 54Q20 30 54 24Q88 30 88 54" fill="#E8D5B0" stroke="#1a1a1a" strokeWidth="2.5"/><ellipse cx="54" cy="24" rx="18" ry="5" fill="#EDE0C4" stroke="#1a1a1a" strokeWidth="1.5"/><path d="M24 44Q54 39 84 44" fill="none" stroke="#2A2A2A" strokeWidth="3"/></svg>
    ),
    alemán: (
      <svg viewBox="0 0 108 68" width={w} height={h*0.85}><path d="M16 56Q16 52 54 48Q92 52 92 56Q92 62 54 64Q16 62 16 56Z" fill="#2E7D32" stroke="#1a1a1a" strokeWidth="2.5"/><path d="M28 54Q28 26 54 20Q80 26 80 54" fill="#388E3C" stroke="#1a1a1a" strokeWidth="2.5"/><ellipse cx="54" cy="20" rx="15" ry="5" fill="#43A047" stroke="#1a1a1a" strokeWidth="1.5"/><path d="M30 42Q54 38 78 42" fill="none" stroke="#C41E1E" strokeWidth="3.5"/><line x1="82" y1="30" x2="98" y2="12" stroke="#DAA520" strokeWidth="2.5" strokeLinecap="round"/><path d="M96 12Q100 18 94 24" fill="none" stroke="#DAA520" strokeWidth="2" strokeLinecap="round"/></svg>
    ),
    portugués: (
      <svg viewBox="0 0 108 60" width={w} height={h*0.75}><ellipse cx="54" cy="50" rx="50" ry="8" fill="#6D4C41" stroke="#1a1a1a" strokeWidth="2.5"/><path d="M22 50Q22 34 54 28Q86 34 86 50" fill="#8D6E63" stroke="#1a1a1a" strokeWidth="2.5"/><rect x="22" y="28" width="64" height="8" rx="2" fill="#795548"/><path d="M26 42Q54 38 82 42" fill="none" stroke="#3E2723" strokeWidth="3"/></svg>
    ),
  };
  return <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:0}}>{hats[lang]}</div>;
};

/* ═══ LOTERÍA-STYLE INGREDIENT CARD ═══ */
const IngredientCard = ({card, onClick, selected, small, playable}) => {
  const {language: lang, ingredient: ing} = card;
  const isWild = ing === "perrito";
  const border = LANG_BORDER[lang];
  const bg = LANG_BG[lang];
  const txtColor = LANG_TEXT[lang];
  const isDark = lang === "inglés";
  const w = small ? 64 : 86, h = small ? 94 : 126;
  const dimmed = playable === false;
  return (
    <div onClick={onClick} style={{
      width:w, height:h, borderRadius:8, overflow:"hidden", cursor:"pointer",
      border: selected ? "3px solid #FFD700" : `4px solid ${border}`,
      boxShadow: selected ? "0 0 18px rgba(255,215,0,0.6),0 4px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.25)",
      transform: selected ? "translateY(-10px) scale(1.06)" : "scale(1)",
      transition:"all 0.2s", background:bg, display:"flex", flexDirection:"column", alignItems:"center", position:"relative",
      opacity: dimmed ? 0.4 : 1,
      filter: dimmed ? "grayscale(0.5)" : "none",
    }}>
      {/* Playable glow */}
      {playable === true && !selected && (
        <div style={{position:"absolute",inset:0,borderRadius:6,boxShadow:"inset 0 0 8px rgba(76,175,80,0.4)",pointerEvents:"none"}}/>
      )}
      {/* Ingredient badge top-left */}
      <div style={{position:"absolute",top:2,left:2,width:small?16:20,height:small?16:20,borderRadius:"50%",
        background:LANG_BADGE[lang],display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:small?9:12,lineHeight:1,boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}>
        {isWild ? <span style={{fontWeight:900,color:isDark?"#eee":"#fff"}}>?</span> : ING_EMOJI[ing]}
      </div>
      {/* Language */}
      <div style={{marginTop:small?3:5,fontSize:small?10:14,fontWeight:900,color:txtColor,letterSpacing:2,
        fontFamily:"'Fredoka',sans-serif",textShadow:isDark?"none":"0 1px 0 rgba(255,255,255,0.3)"}}>
        {LANG_SHORT[lang]}
      </div>
      {/* Center: hat on ingredient */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginTop:-2}}>
        <div style={{transform:small?"scale(0.38)":"scale(0.48)",transformOrigin:"bottom center",lineHeight:0,marginBottom:small?-6:-4}}>
          <HatSVG lang={lang} size={36}/>
        </div>
        <div style={{position:"relative",display:"inline-block"}}>
          <span style={{fontSize:small?26:36,lineHeight:1,filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.15))"}}>
            {ING_EMOJI[ing]}
          </span>
          {/* Ojitos */}
          <div style={{position:"absolute",top:small?"2px":"3px",left:"50%",transform:"translateX(-50%)",display:"flex",gap:small?3:4,pointerEvents:"none"}}>
            <div style={{width:small?5:7,height:small?5:7,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              <div style={{width:small?2.5:3.5,height:small?2.5:3.5,borderRadius:"50%",background:"#1a1a1a"}}/>
            </div>
            <div style={{width:small?5:7,height:small?5:7,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              <div style={{width:small?2.5:3.5,height:small?2.5:3.5,borderRadius:"50%",background:"#1a1a1a"}}/>
            </div>
          </div>
        </div>
      </div>
      {/* Name */}
      <div style={{marginBottom:small?3:6,fontSize:small?7:10,fontWeight:700,color:isDark?"#ccc":"#444",
        fontFamily:"'Fredoka',sans-serif"}}>
        {getIngName(ing, lang)}
      </div>
    </div>
  );
};

/* ═══ ACTION CARD ═══ */
const ActionCard = ({card, onClick, selected, small}) => {
  const info = gAI(card.action);
  const w = small ? 64 : 86, h = small ? 94 : 126;
  return (
    <div onClick={onClick} style={{
      width:w, height:h, borderRadius:8, cursor:"pointer",
      border: selected ? "3px solid #FFD700" : "3px solid #555",
      background:"linear-gradient(170deg,#1A1A2E 0%,#16213E 100%)",
      boxShadow: selected ? "0 0 18px rgba(255,215,0,0.6)" : "0 2px 8px rgba(0,0,0,0.3)",
      transform: selected ? "translateY(-10px) scale(1.06)" : "scale(1)",
      transition:"all 0.2s", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      gap:2, color:"#eee", fontFamily:"'Fredoka',sans-serif", padding:"4px 3px",
    }}>
      <span style={{fontSize:small?22:32}}>{info?.emoji}</span>
      <span style={{fontSize:small?7:9,fontWeight:700,textAlign:"center",lineHeight:1.1}}>{info?.name}</span>
      <span style={{fontSize:small?5:7,color:"#777",textAlign:"center",lineHeight:1.1}}>{info?.desc}</span>
    </div>
  );
};

const GameCard = ({card,playable,...p}) => card.type==="ingredient" ? <IngredientCard card={card} playable={playable} {...p}/> : <ActionCard card={card} {...p}/>;

/* ═══ HAT BADGE ═══ */
const HatBadge = ({lang, isMain, onClick, size="md"}) => {
  const s = size==="sm"?22:size==="lg"?42:32;
  return (
    <div onClick={onClick} style={{
      display:"inline-flex",flexDirection:"column",alignItems:"center",gap:1,
      padding:4,borderRadius:8,cursor:onClick?"pointer":"default",
      border:isMain?`2px solid #FFD700`:`2px solid ${LANG_BORDER[lang]}44`,
      background:isMain?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.03)",
      boxShadow:isMain?"0 0 8px rgba(255,215,0,0.25)":"none",transition:"all 0.2s",
    }}>
      <HatSVG lang={lang} size={s}/>
      <span style={{fontSize:size==="sm"?6:7,fontWeight:800,color:isMain?"#FFD700":LANG_TEXT[lang],letterSpacing:0.5}}>
        {LANG_SHORT[lang]}
      </span>
    </div>
  );
};

/* ═══ PERCHERO (Hat Rack) ═══ */
const PercheroSVG = ({hats, onClickHat, height=120}) => {
  // Branch positions (alternating left/right) — up to 5 hats
  const branches = [
    {x:22, y:30, side:"left"},
    {x:78, y:25, side:"right"},
    {x:18, y:55, side:"left"},
    {x:82, y:50, side:"right"},
    {x:25, y:75, side:"left"},
  ];
  const w = 100, h = 100;
  return (
    <div style={{position:"relative",width:height*1.1,height,display:"inline-block"}}>
      <svg viewBox={`0 0 ${w} ${h}`} width={height*1.1} height={height}>
        {/* Base feet */}
        <path d="M35 95 Q50 92 65 95" stroke="#2D5A27" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M30 97 Q50 93 70 97" stroke="#2D5A27" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Main pole */}
        <line x1="50" y1="12" x2="50" y2="95" stroke="#2D5A27" strokeWidth="3.5" strokeLinecap="round"/>
        {/* Top knob */}
        <circle cx="50" cy="10" r="3" fill="#3A7A32"/>
        {/* Branches */}
        {hats.map((_, i) => {
          if(i >= branches.length) return null;
          const b = branches[i];
          const bx = b.side==="left" ? 50 : 50;
          return (
            <line key={`br-${i}`} x1={bx} y1={b.y} x2={b.x} y2={b.y - 4}
              stroke="#3A7A32" strokeWidth="2.5" strokeLinecap="round"/>
          );
        })}
      </svg>
      {/* Hats positioned on branches */}
      {hats.map((lang, i) => {
        if(i >= branches.length) return null;
        const b = branches[i];
        const leftPx = (b.x / w) * height * 1.1;
        const topPx = ((b.y - 16) / h) * height;
        return (
          <div key={i} onClick={onClickHat ? () => onClickHat(i) : undefined}
            style={{
              position:"absolute", left:leftPx - 18, top:topPx,
              transform:`rotate(${b.side==="left"?-12:12}deg)`,
              cursor:onClickHat?"pointer":"default",
              transition:"transform 0.2s",
              filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.3))",
            }}
            onMouseOver={e=>{if(onClickHat)e.currentTarget.style.transform=`rotate(${b.side==="left"?-12:12}deg) scale(1.2)`;}}
            onMouseOut={e=>{e.currentTarget.style.transform=`rotate(${b.side==="left"?-12:12}deg) scale(1)`;}}
          >
            <HatSVG lang={lang} size={22}/>
            <div style={{textAlign:"center",fontSize:5,fontWeight:800,color:LANG_TEXT[lang],marginTop:-2}}>{LANG_SHORT[lang]}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ═══ BURGER TARGET ═══ */
const BurgerTarget = ({ingredients, table, isCurrent}) => {
  // Group ingredients to detect duplicates
  const counts = {};
  ingredients.forEach(ing => { counts[ing] = (counts[ing]||0)+1; });
  // Track which occurrence we're rendering
  const rendered = {};
  
  return (
    <div style={{display:"flex",flexDirection:"row",flexWrap:"wrap",alignItems:"center",gap:3,padding:"6px 10px",borderRadius:10,
      background:isCurrent?"rgba(255,215,0,0.1)":"rgba(255,255,255,0.03)",
      border:isCurrent?"2px solid #FFD700":"2px solid transparent"}}>
      {ingredients.map((ing,i) => {
        rendered[ing] = (rendered[ing]||0)+1;
        const thisOccurrence = rendered[ing];
        const have = table.filter(t=>t===ing).length;
        const filled = have >= thisOccurrence;
        const isDupe = counts[ing] > 1;
        return (
          <div key={i} style={{position:"relative",width:26,height:26,borderRadius:6,
            background:filled?ING_BG[ing]:"rgba(255,255,255,0.06)",
            display:"flex",alignItems:"center",justifyContent:"center",
            border:filled?"none":`2px dashed ${ING_BG[ing]}44`,
            fontSize:15,opacity:filled?1:0.35,transition:"all 0.3s"}}>
            {ING_EMOJI[ing]}
            {isDupe && (
              <div style={{position:"absolute",top:-4,right:-6,fontSize:6,fontWeight:900,
                background:"#FF6B35",color:"#fff",borderRadius:4,padding:"0 2px",lineHeight:"10px",
                boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}>
                x{thisOccurrence}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const LogEntry = ({e}) => (
  <div style={{padding:"3px 8px",fontSize:10,color:"#888",borderLeft:`3px solid ${e.color||"#555"}`,marginBottom:2,fontFamily:"monospace"}}>
    <span style={{color:e.color||"#FFD700",fontWeight:700}}>{e.player}</span>{" "}{e.text}
  </div>
);

/* ═══ DECK ═══ */
function generateDeck(){
  let d=[];
  INGREDIENTS.forEach(ing=>LANGUAGES.forEach(lang=>d.push({type:"ingredient",ingredient:ing,language:lang,id:uid()})));
  INGREDIENTS.forEach(ing=>{shuffle(LANGUAGES).slice(0,2).forEach(lang=>d.push({type:"ingredient",ingredient:ing,language:lang,id:uid()}));});
  LANGUAGES.forEach(lang=>{for(let i=0;i<2;i++)d.push({type:"ingredient",ingredient:"perrito",language:lang,id:uid()});});
  ACTION_CARDS.forEach(ac=>{for(let i=0;i<3;i++)d.push({type:"action",action:ac.id,id:uid()});});
  return shuffle(d);
}
function genBurger(s){
  const others = shuffle(INGREDIENTS.filter(i=>i!=="pan"));
  
  if(s <= 4){
    // 4 ingredients: all unique
    return shuffle(["pan", ...others.slice(0, s-1)]);
  }
  
  // 5-7: start with pan + pick some unique, then allow repeats
  const uniqueCount = randInt(Math.min(s-1, 4), Math.min(s, 8)); // at least some unique
  const base = ["pan", ...others.slice(0, uniqueCount)];
  const result = [...base];
  // Fill remaining with duplicates of existing ingredients
  while(result.length < s){
    const dupe = result[randInt(0, result.length-1)];
    result.push(dupe);
  }
  return shuffle(result);
}
function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

function initPlayer(name,deck,chosenHat,diff,isAI=false){
  const hand=deck.splice(0,6);
  const perchero=LANGUAGES.filter(l=>l!==chosenHat);
  const burgerSets = {
    facil: [genBurger(randInt(4,6))],
    medio: [genBurger(randInt(5,6)),genBurger(randInt(5,6))],
    dificil: [genBurger(randInt(5,7)),genBurger(randInt(5,7)),genBurger(randInt(5,7))],
  };
  const burgers = burgerSets[diff] || burgerSets.medio;
  const totalBurgers = burgers.length;
  return{name,hand,mainHats:[chosenHat],perchero,table:[],burgers,totalBurgers,currentBurger:0,maxHand:6,won:false,isAI};
}

/* ═══════════════════ GAME ═══════════════════ */
export default function PoliglotaHambriento(){
  const[screen,setScreen]=useState("menu");
  const[gameMode,setGameMode]=useState("local"); // "local" or "vsAI"
  const[playerCount,setPlayerCount]=useState(2);
  const[aiCount,setAiCount]=useState(1);
  const[difficulty,setDifficulty]=useState("medio");
  const[names,setNames]=useState(["Jugador 1","Jugador 2","Jugador 3","Jugador 4"]);
  const AI_NAMES = ["Chef Bot","Cocinerito","Señor Hambre"];
  const[hatChoices,setHatChoices]=useState({});
  const[hatPickPlayer,setHatPickPlayer]=useState(0);
  const[players,setPlayers]=useState([]);
  const[cp,setCp]=useState(0);
  const[deck,setDeck]=useState([]);
  const[discard,setDiscard]=useState([]);
  const[sel,setSel]=useState(null);
  const[phase,setPhase]=useState("play");
  const[actTarget,setActTarget]=useState(null);
  const[actData,setActData]=useState(null);
  const[log,setLog]=useState([]);
  const[winner,setWinner]=useState(null);
  const[didAction,setDidAction]=useState(false);
  const[didIngredient,setDidIngredient]=useState(false);
  const[didAnything,setDidAnything]=useState(false); // blocks extra actions once any card is played
  const[negPrompt,setNegPrompt]=useState(null);
  const[perritoChoice,setPerritoChoice]=useState(null);
  const[wildcardPending,setWildcardPending]=useState(null);
  const[basPhase,setBasPhase]=useState(null);
  const[hatStolenVictim,setHatStolenVictim]=useState(null); // {playerIdx} when victim needs to pick from perchero
  const[showTransition,setShowTransition]=useState(false);
  const logRef=useRef(null);

  const addLog=useCallback((p,t,c)=>setLog(prev=>[...prev.slice(-60),{player:p,text:t,color:c||"#FFD700"}]),[]);
  useEffect(()=>{logRef.current&&(logRef.current.scrollTop=logRef.current.scrollHeight);},[log]);

  const goToHatPick=()=>{
    setHatChoices({});setHatPickPlayer(0);setScreen("hatpick");
  };

  const totalPlayers = gameMode==="vsAI" ? 1 + aiCount : playerCount;

  const startWithHats=(allChoices)=>{
    const d=generateDeck(),ps=[];
    const nms = gameMode==="vsAI" 
      ? [names[0], ...AI_NAMES.slice(0, aiCount)]
      : names.slice(0, totalPlayers);
    for(let i=0;i<totalPlayers;i++){
      const isAI = gameMode==="vsAI" && i > 0;
      ps.push(initPlayer(nms[i],d,allChoices[i],difficulty,isAI));
    }
    setPlayers(ps);setDeck(d);setDiscard([]);setCp(0);setLog([]);setWinner(null);
    setDidAction(false);setDidIngredient(false);setDidAnything(false);setPhase("play");setScreen("game");
    addLog("Sistema","¡El juego ha comenzado!","#4CAF50");
  };

  const pickHat=(lang)=>{
    const nc={...hatChoices,[hatPickPlayer]:lang};
    setHatChoices(nc);
    
    if(gameMode==="vsAI"){
      // Human picked (player 0), now auto-assign AI hats
      const taken = [lang];
      const finalChoices = {...nc};
      for(let i=1;i<=aiCount;i++){
        const available = LANGUAGES.filter(l=>!taken.includes(l));
        const pick = available[randInt(0, available.length-1)];
        finalChoices[i] = pick;
        taken.push(pick);
      }
      setHatChoices(finalChoices);
      startWithHats(finalChoices);
    } else {
      if(hatPickPlayer<totalPlayers-1){setHatPickPlayer(hatPickPlayer+1);}
      else{ startWithHats(nc); }
    }
  };

  const drawCards=(p,n)=>{const nd=[...deck],drawn=[];for(let i=0;i<n&&nd.length>0;i++){if(p.maxHand-(p.hand.length+drawn.length)<=0)break;drawn.push(nd.shift());}setDeck(nd);return drawn;};

  const canPlay=(p,card)=>{
    if(!p.mainHats.includes(card.language)) return false;
    if(card.ingredient==="perrito") return true; // wildcards always playable if language matches
    if(p.currentBurger>=p.totalBurgers) return false;
    const target = p.burgers[p.currentBurger];
    // Check if this ingredient is still needed (not yet fulfilled on table)
    const needed = [...target];
    const tableCopy = [...p.table];
    for(let i=needed.length-1;i>=0;i--){
      const idx=tableCopy.indexOf(needed[i]);
      if(idx!==-1){needed.splice(i,1);tableCopy.splice(idx,1);}
    }
    return needed.includes(card.ingredient);
  };

  const checkComplete=(p)=>{
    if(p.currentBurger>=p.totalBurgers)return false;
    const t=p.burgers[p.currentBurger],tc=[...p.table];
    for(const ing of t){const i=tc.indexOf(ing);if(i===-1){const w=tc.indexOf("perrito");if(w===-1)return false;tc.splice(w,1);}else tc.splice(i,1);}
    return true;
  };

  const completeBurger=(p)=>{
    const np={...p};addLog(p.name,`¡completó hamburguesa #${p.currentBurger+1}! 🎉`,"#4CAF50");
    np.currentBurger++;if(np.currentBurger>=np.totalBurgers){np.won=true;setWinner(np.name);return np;}
    const next=np.burgers[np.currentBurger],kept=[],tc=[...np.table];
    for(const ing of next){const i=tc.indexOf(ing);if(i!==-1){kept.push(ing);tc.splice(i,1);}}
    if(tc.filter(x=>x==="perrito").length>0)setPerritoChoice({pi:players.indexOf(p),rem:tc.filter(x=>x==="perrito").length});
    setDiscard(prev=>[...prev,...tc.filter(x=>x!=="perrito").map(ing=>({type:"ingredient",ingredient:ing,language:shuffle(LANGUAGES)[0],id:uid()}))]);
    np.table=kept;return np;
  };

  const playIngredient=(ci)=>{
    const ps=[...players],p={...ps[cp]},card=p.hand[ci];
    if(!canPlay(p,card)){addLog("Sistema",`No coincide sombrero — necesitás ${LANG_SHORT[card.language]}`,"#f44336");return;}
    if(card.ingredient==="perrito"){
      // Show choice modal — don't place yet
      setWildcardPending({cardIdx:ci,lang:card.language});
      return;
    }
    p.hand.splice(ci,1);p.table.push(card.ingredient);
    addLog(p.name,`jugó ${ING_EMOJI[card.ingredient]} ${getIngName(card.ingredient,card.language)} (${LANG_SHORT[card.language]})`,ING_BG[card.ingredient]);
    const completed = checkComplete(p);
    if(completed)ps[cp]=completeBurger(p);else ps[cp]=p;
    setPlayers(ps);setSel(null);setDidIngredient(true);setDidAnything(true);
    setTimeout(()=>finishTurn(ps), completed ? 2200 : 1200);
  };

  const confirmWildcard=(chosenIng)=>{
    if(!wildcardPending)return;
    const ps=[...players],p={...ps[cp]};
    p.hand.splice(wildcardPending.cardIdx,1);
    p.table.push(chosenIng);
    addLog(p.name,`jugó 🌭 Comodín como ${ING_EMOJI[chosenIng]} ${chosenIng} (${LANG_SHORT[wildcardPending.lang]})`,ING_BG[chosenIng]);
    const completed = checkComplete(p);
    if(completed)ps[cp]=completeBurger(p);else ps[cp]=p;
    ps[cp]=ps[cp]||p;
    setPlayers(ps);setSel(null);setDidIngredient(true);setDidAnything(true);setWildcardPending(null);
    setTimeout(()=>finishTurn(ps), completed ? 2200 : 1200);
  };

  const playAction=(ci)=>{
    const ps=[...players],p={...ps[cp]},card=p.hand[ci],a=card.action;
    if(["tenedor","ladron","intercambio_sombreros","intercambio_hamburguesa","gloton"].includes(a)){setActData({action:a,ci});setPhase("selectTarget");return;}
    p.hand.splice(ci,1);setDiscard(prev=>[...prev,card]);
    const massRm=(fn)=>{for(let i=0;i<ps.length;i++){if(i===cp)continue;const o={...ps[i]};const rm=o.table.filter(fn);o.table=o.table.filter(t=>!fn(t));if(rm.length)addLog(o.name,`perdió ${rm.map(r=>ING_EMOJI[r]).join("")}`,"#f44336");ps[i]=o;}};
    if(a==="milanesa")massRm(t=>t==="pan"||t==="huevo");
    else if(a==="ensalada")massRm(t=>FRUITS_VEGS.includes(t));
    else if(a==="pizza")massRm(t=>t==="queso");
    else if(a==="parrilla")massRm(t=>t==="pollo"||t==="carne");
    else if(a==="cambio_sombrero"){setPhase("selectPercheroHat");ps[cp]=p;setPlayers(ps);setDidAction(true);setDidAnything(true);addLog(p.name,"jugó Cambio de Sombrero 👒","#9C27B0");return;}
    else if(a==="basurero"){setBasPhase("choose");ps[cp]=p;setPlayers(ps);setDidAction(true);setDidAnything(true);addLog(p.name,"jugó El Basurero 🗑️","#795548");return;}
    addLog(p.name,`jugó ${gAI(a)?.emoji} ${gAI(a)?.name}`,"#FF9800");
    ps[cp]=p;setPlayers(ps);setSel(null);setDidAction(true);setDidAnything(true);
    setTimeout(()=>finishTurn(ps),1400);
  };

  const execTargeted=(ti)=>{
    if(!actData)return;const ps=[...players],p={...ps[cp]},t={...ps[ti]},card=p.hand[actData.ci];
    if(t.hand.some(c=>c.type==="action"&&c.action==="negacion")){setNegPrompt({ti,action:actData.action,ci:actData.ci});setPhase("negPrompt");return;}
    p.hand.splice(actData.ci,1);setDiscard(prev=>[...prev,card]);
    if(actData.action==="tenedor"&&t.table.length>0){setPhase("selectSteal");setActTarget(ti);ps[cp]=p;setPlayers(ps);addLog(p.name,`usa El Tenedor contra ${t.name}`,"#FF9800");return;}
    else if(actData.action==="ladron"){const s=t.mainHats.shift();if(s){p.mainHats.push(s);addLog(p.name,`robó sombrero ${LANG_SHORT[s]} de ${t.name}`,"#9C27B0");}
      if(t.mainHats.length===0 && t.perchero.length>0){
        // Victim needs to pick a replacement from perchero
        if(t.isAI){
          // AI auto-picks first perchero hat
          const replacement=t.perchero.shift();t.mainHats=[replacement];
          addLog(t.name,`reemplazó con ${LANG_SHORT[replacement]} del perchero`,"#9C27B0");
        } else {
          ps[cp]=p;ps[ti]=t;setPlayers(ps);setPhase("play");setActData(null);setActTarget(null);setSel(null);setDidAction(true);setDidAnything(true);
          setHatStolenVictim({playerIdx:ti});
          return; // Don't auto-end yet, wait for victim to pick
        }
      }
    }
    else if(actData.action==="intercambio_sombreros"){const tmp=[...p.mainHats];p.mainHats=[...t.mainHats];t.mainHats=tmp;addLog(p.name,`intercambió sombreros con ${t.name}`,"#9C27B0");}
    else if(actData.action==="intercambio_hamburguesa"){const pt=[...p.table],tt=[...t.table];const pT=p.burgers[p.currentBurger]||[],tT=t.burgers[t.currentBurger]||[];p.table=tt.filter(i=>pT.includes(i));t.table=pt.filter(i=>tT.includes(i));addLog(p.name,`intercambió mesa con ${t.name}`,"#FF9800");}
    else if(actData.action==="gloton"){t.table=[];addLog(p.name,`usó El Glotón contra ${t.name}`,"#f44336");}
    ps[cp]=p;ps[ti]=t;setPlayers(ps);setPhase("play");setActData(null);setActTarget(null);setSel(null);setDidAction(true);setDidAnything(true);
    setTimeout(()=>finishTurn(ps),1400);
  };

  const handleNeg=(use)=>{
    const ps=[...players],t={...ps[negPrompt.ti]};
    if(use){const ni=t.hand.findIndex(c=>c.type==="action"&&c.action==="negacion");if(ni!==-1){setDiscard(prev=>[...prev,t.hand[ni]]);t.hand.splice(ni,1);}addLog(t.name,"usó Negación 🚫","#2196F3");ps[negPrompt.ti]=t;setPlayers(ps);setNegPrompt(null);setPhase("play");setActData(null);setDidAction(true);setDidAnything(true);setTimeout(()=>finishTurn(ps),1400);}
    else{setNegPrompt(null);execTargeted(negPrompt.ti);}
  };

  const stealIng=(ii)=>{
    const ps=[...players],p={...ps[cp]},t={...ps[actTarget]};
    const stolen=t.table.splice(ii,1)[0];p.table.push(stolen);
    addLog(p.name,`robó ${ING_EMOJI[stolen]} de ${t.name}`,"#FF9800");
    if(checkComplete(p))ps[cp]=completeBurger(p);else ps[cp]=p;
    ps[actTarget]=t;setPlayers(ps);setPhase("play");setActData(null);setActTarget(null);setDidAction(true);setDidAnything(true);
    setTimeout(()=>finishTurn(ps),1400);
  };

  const changeHat=()=>{const p=players[cp];if(!p.perchero.length){addLog("Sistema","Sin sombreros en perchero","#f44336");return;}setPhase("selectDiscardForHat");setActData({type:"ch",needed:Math.ceil(p.hand.length/2),selected:[]});};
  const addExtraHat=()=>{const p=players[cp];if(!p.hand.length||!p.perchero.length){addLog("Sistema","Sin cartas/sombreros suficientes","#f44336");return;}setPhase("selectPercheroExtra");};

  const execAddExtra=(hi)=>{
    const ps=[...players],p={...ps[cp]};const hat=p.perchero.splice(hi,1)[0];p.mainHats.push(hat);
    setDiscard(prev=>[...prev,...p.hand]);p.hand=[];p.maxHand=Math.max(1,p.maxHand-1);
    const drawn=drawCards(p,p.maxHand);p.hand=drawn;
    addLog(p.name,`agregó ${LANG_SHORT[hat]} al principal (máx mano: ${p.maxHand})`,"#9C27B0");
    ps[cp]=p;setPlayers(ps);setPhase("playAfterHat");setDidAction(true);setDidAnything(true);
  };

  const selPercheroHat=(hi)=>{
    const ps=[...players],p={...ps[cp]};const hat=p.perchero.splice(hi,1)[0];
    p.perchero.push(p.mainHats[0]);p.mainHats=[hat,...p.mainHats.slice(1)];
    addLog(p.name,`cambió sombrero a ${LANG_SHORT[hat]}`,"#9C27B0");
    ps[cp]=p;setPlayers(ps);setPhase("playAfterHat");setDidAnything(true);
  };

  const endTurn=()=>{
    // If nothing was played, must discard a card first
    if(!didAnything && P.hand.length > 0){
      setPhase("discardToPass");
      return;
    }
    finishTurn();
  };

  const discardToPass=(cardIdx)=>{
    const ps=[...players],p={...ps[cp]};
    const card = p.hand.splice(cardIdx,1)[0];
    setDiscard(prev=>[...prev,card]);
    const label = card.type==="ingredient" ? `${ING_EMOJI[card.ingredient]} ${getIngName(card.ingredient,card.language||"español")}` : `${gAI(card.action)?.emoji} ${gAI(card.action)?.name}`;
    addLog(p.name,`descartó ${label} para pasar turno`,"#888");
    ps[cp]=p;setPlayers(ps);setSel(null);
    finishTurn(ps);
  };

  const finishTurn=(existingPs)=>{
    const ps=existingPs||[...players];const p={...ps[cp]};
    if(basPhase!=="noDrawThisTurn"){const n=p.maxHand-p.hand.length;if(n>0){const d=drawCards(p,n);p.hand=[...p.hand,...d];ps[cp]=p;setPlayers(ps);}}
    const tp = gameMode==="vsAI" ? 1+aiCount : playerCount;
    const next=(cp+1)%tp;setCp(next);setSel(null);
    setDidAction(false);setDidIngredient(false);setDidAnything(false);setBasPhase(null);
    setShowTransition(true);
    const nextNames = gameMode==="vsAI" ? [names[0],...AI_NAMES.slice(0,aiCount)] : names;
    addLog(nextNames[next],"comienza su turno","#2196F3");
  };

  const dismissTransition=()=>{
    setShowTransition(false);setPhase("play");
    // If it's an AI player's turn, run AI logic after a short delay
    const tp = gameMode==="vsAI" ? 1+aiCount : playerCount;
    const nextP = players[cp];
    if(nextP && nextP.isAI){
      setTimeout(()=>runAITurn(), 1000);
    }
  };

  const pickReplacementHat=(hatIdx)=>{
    if(!hatStolenVictim)return;
    const ps=[...players],victim={...ps[hatStolenVictim.playerIdx]};
    const hat=victim.perchero.splice(hatIdx,1)[0];
    victim.mainHats=[hat];
    addLog(victim.name,`eligió ${LANG_SHORT[hat]} como nuevo sombrero principal`,"#9C27B0");
    ps[hatStolenVictim.playerIdx]=victim;
    setPlayers(ps);
    const pendingAI = hatStolenVictim.pendingAIFinish;
    setHatStolenVictim(null);
    if(pendingAI){
      // Resume AI turn finish
      setTimeout(()=>doAIFinish(ps),1000);
    } else {
      setTimeout(()=>finishTurn(ps),1400);
    }
  };

  /* ═══ AI LOGIC ═══ */
  const runAITurn = () => {
    const ps = [...players];
    const ai = {...ps[cp]};
    if(ai.currentBurger >= ai.totalBurgers) { doAIFinish(ps); return; }
    const target = ai.burgers[ai.currentBurger];
    
    // Calculate what ingredients are still needed
    const needed = [...target];
    const tableCopy = [...ai.table];
    for(let i=needed.length-1;i>=0;i--){
      const idx=tableCopy.indexOf(needed[i]);
      if(idx!==-1){needed.splice(i,1);tableCopy.splice(idx,1);}
    }
    
    // Strategy 1: Try to play a needed ingredient
    let played = false;
    const playableIngs = ai.hand
      .map((c,i)=>({card:c,idx:i}))
      .filter(({card})=>{
        if(card.type!=="ingredient") return false;
        if(!ai.mainHats.includes(card.language)) return false;
        if(card.ingredient==="perrito") return true;
        return needed.includes(card.ingredient);
      });
    
    const usefulPlay = playableIngs[0];
    
    if(usefulPlay){
      const card = usefulPlay.card;
      ai.hand.splice(usefulPlay.idx,1);
      const actualIng = card.ingredient==="perrito" 
        ? (needed.find(n=>n!=="pan") || needed[0] || "pan") 
        : card.ingredient;
      ai.table.push(actualIng);
      addLog(ai.name,`jugó ${ING_EMOJI[actualIng]} ${actualIng} (${LANG_SHORT[card.language]})`,ING_BG[actualIng]);
      played = true;
      
      // Check burger complete
      if(checkComplete(ai)){
        ps[cp] = completeBurger(ai);
      } else {
        ps[cp] = ai;
      }
      setPlayers(ps);
    }
    
    // Strategy 2: If can't play useful ingredient, try an action card
    if(!played){
      const actionCards = ai.hand
        .map((c,i)=>({card:c,idx:i}))
        .filter(({card})=>card.type==="action" && !["negacion","basurero"].includes(card.action));
      
      if(actionCards.length > 0){
        const actionPlay = actionCards[randInt(0, actionCards.length-1)];
        const card = actionPlay.card;
        const action = card.action;
        ai.hand.splice(actionPlay.idx,1);
        setDiscard(prev=>[...prev,card]);
        
        // Execute action effects
        if(["milanesa","ensalada","pizza","parrilla"].includes(action)){
          const filter = {
            milanesa: t=>t==="pan"||t==="huevo",
            ensalada: t=>FRUITS_VEGS.includes(t),
            pizza: t=>t==="queso",
            parrilla: t=>t==="pollo"||t==="carne",
          }[action];
          for(let i=0;i<ps.length;i++){
            if(i===cp)continue;
            const o={...ps[i]};const rm=o.table.filter(filter);
            o.table=o.table.filter(t=>!filter(t));
            if(rm.length)addLog(o.name,`perdió ${rm.map(r=>ING_EMOJI[r]).join("")}`,"#f44336");
            ps[i]=o;
          }
        } else if(action==="gloton"){
          // Target the player with most ingredients on table
          let bestTarget=-1, bestCount=-1;
          for(let i=0;i<ps.length;i++){
            if(i===cp)continue;
            if(ps[i].table.length>bestCount){bestCount=ps[i].table.length;bestTarget=i;}
          }
          if(bestTarget>=0){
            const t={...ps[bestTarget]};t.table=[];ps[bestTarget]=t;
            addLog(ai.name,`usó El Glotón contra ${t.name}`,"#f44336");
          }
        } else if(action==="tenedor"){
          // Steal from player with most ingredients
          let bestTarget=-1, bestCount=-1;
          for(let i=0;i<ps.length;i++){
            if(i===cp||!ps[i].table.length)continue;
            if(ps[i].table.length>bestCount){bestCount=ps[i].table.length;bestTarget=i;}
          }
          if(bestTarget>=0){
            const t={...ps[bestTarget]};
            const stolen=t.table.splice(randInt(0,t.table.length-1),1)[0];
            ai.table.push(stolen);
            addLog(ai.name,`robó ${ING_EMOJI[stolen]} de ${t.name}`,"#FF9800");
            ps[bestTarget]=t;
          }
        } else if(action==="cambio_sombrero" && ai.perchero.length > 0){
          // Change to a hat that matches needed ingredients
          const neededLangs = ai.hand
            .filter(c=>c.type==="ingredient"&&needed.includes(c.ingredient))
            .map(c=>c.language);
          const bestHat = ai.perchero.find(h=>neededLangs.includes(h)) || ai.perchero[0];
          const hi = ai.perchero.indexOf(bestHat);
          ai.perchero.splice(hi,1);
          ai.perchero.push(ai.mainHats[0]);
          ai.mainHats=[bestHat,...ai.mainHats.slice(1)];
          addLog(ai.name,`cambió sombrero a ${LANG_SHORT[bestHat]}`,"#9C27B0");
        } else if(["ladron","intercambio_sombreros","intercambio_hamburguesa"].includes(action)){
          // Target random other player for these
          const others = ps.map((_,i)=>i).filter(i=>i!==cp);
          const ti = others[randInt(0,others.length-1)];
          const t={...ps[ti]};
          if(action==="ladron"){
            const s=t.mainHats.shift();if(s){ai.mainHats.push(s);addLog(ai.name,`robó sombrero ${LANG_SHORT[s]} de ${t.name}`,"#9C27B0");}
            if(t.mainHats.length===0 && t.perchero.length>0){
              if(t.isAI){
                const rep=t.perchero.shift();t.mainHats=[rep];
                addLog(t.name,`reemplazó con ${LANG_SHORT[rep]} del perchero`,"#9C27B0");
              } else {
                // Human victim needs to pick - pause AI and show modal
                ps[ti]=t;ps[cp]=ai;setPlayers(ps);
                setHatStolenVictim({playerIdx:ti,pendingAIFinish:true});
                addLog(ai.name,`jugó ${gAI(action)?.emoji} ${gAI(action)?.name}`,"#FF9800");
                return;
              }
            }
          } else if(action==="intercambio_sombreros"){
            const tmp=[...ai.mainHats];ai.mainHats=[...t.mainHats];t.mainHats=tmp;
            addLog(ai.name,`intercambió sombreros con ${t.name}`,"#9C27B0");
          } else {
            const pt=[...ai.table],tt=[...t.table];
            const pT=ai.burgers[ai.currentBurger]||[],tT=t.burgers[t.currentBurger]||[];
            ai.table=tt.filter(ing=>pT.includes(ing));t.table=pt.filter(ing=>tT.includes(ing));
            addLog(ai.name,`intercambió mesa con ${t.name}`,"#FF9800");
          }
          ps[ti]=t;
        }
        
        addLog(ai.name,`jugó ${gAI(action)?.emoji} ${gAI(action)?.name}`,"#FF9800");
        played = true;
        ps[cp]=ai;
        setPlayers(ps);
      }
    }
    
    // If nothing was played, discard worst card
    if(!played && ai.hand.length > 0){
      // Discard action card or non-matching ingredient
      const discardIdx = ai.hand.findIndex(c=>c.type==="action") ?? 0;
      const card = ai.hand.splice(discardIdx>=0?discardIdx:0,1)[0];
      setDiscard(prev=>[...prev,card]);
      addLog(ai.name,"descartó una carta para pasar","#888");
      ps[cp]=ai;
      setPlayers(ps);
    }
    
    // End AI turn after delay
    setTimeout(()=>doAIFinish(ps), 1400);
  };

  const doAIFinish = (ps) => {
    const p={...ps[cp]};
    const n=p.maxHand-p.hand.length;
    if(n>0){const d=drawCards(p,n);p.hand=[...p.hand,...d];ps[cp]=p;setPlayers(ps);}
    const tp = gameMode==="vsAI" ? 1+aiCount : playerCount;
    const next=(cp+1)%tp;setCp(next);setSel(null);
    setDidAction(false);setDidIngredient(false);setDidAnything(false);setBasPhase(null);
    const nextP = ps[next];
    if(nextP && nextP.isAI){
      // Next player is also AI, skip transition
      addLog(nextP.name,"comienza su turno","#2196F3");
      setTimeout(()=>runAITurn(), 1000);
    } else {
      setShowTransition(true);
      const nextNames = gameMode==="vsAI" ? [names[0],...AI_NAMES.slice(0,aiCount)] : names;
      addLog(nextNames[next],"comienza su turno","#2196F3");
    }
  };

  const P = players[cp]; // current player

  /* ═══ MENU ═══ */
  if(screen==="menu"){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0D0D1A 0%,#1A0F2E 40%,#0F2847 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka',sans-serif",color:"#fff",padding:20}}>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Bangers&display=swap" rel="stylesheet"/>
        <div style={{fontSize:80,marginBottom:4,filter:"drop-shadow(0 4px 20px rgba(255,107,53,0.3))"}}>🍔</div>
        <h1 style={{fontSize:44,fontWeight:700,margin:0,fontFamily:"'Bangers',cursive",letterSpacing:3,color:"#FFD700",textShadow:"0 0 20px rgba(255,107,53,0.5), 0 2px 4px rgba(0,0,0,0.3)"}}>POLÍGLOTA HAMBRIENTO</h1>
        <p style={{color:"#555",fontSize:12,marginBottom:28,letterSpacing:3,textTransform:"uppercase"}}>El juego de cartas de hamburguesas</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24,flexWrap:"wrap"}}>
          {LANGUAGES.map(l=><HatBadge key={l} lang={l} size="md"/>)}
        </div>
        <div style={{background:"rgba(255,255,255,0.03)",borderRadius:20,padding:28,border:"1px solid rgba(255,255,255,0.06)",maxWidth:400,width:"100%"}}>
          {/* Game mode */}
          <div style={{marginBottom:20}}>
            <label style={{display:"block",marginBottom:8,fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Modo de juego</label>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[
                {key:"local",label:"Local",icon:"👥",desc:"Pasar dispositivo"},
                {key:"vsAI",label:"vs IA",icon:"🤖",desc:"Jugar contra bots"},
              ].map(m=>(
                <button key={m.key} onClick={()=>setGameMode(m.key)} style={{
                  flex:1,padding:"10px 6px",borderRadius:12,
                  border:gameMode===m.key?"2px solid #FFD700":"2px solid rgba(255,255,255,0.06)",
                  background:gameMode===m.key?"rgba(255,215,0,0.12)":"rgba(255,255,255,0.02)",
                  color:gameMode===m.key?"#FFD700":"#555",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all 0.2s",
                }}>
                  <span style={{fontSize:24}}>{m.icon}</span>
                  <span style={{fontSize:12,fontWeight:700}}>{m.label}</span>
                  <span style={{fontSize:8,opacity:0.7}}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player/AI count */}
          {gameMode==="local" ? (
          <div style={{marginBottom:20}}>
            <label style={{display:"block",marginBottom:8,fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Jugadores</label>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[2,3,4].map(n=>(
                <button key={n} onClick={()=>setPlayerCount(n)} style={{width:56,height:56,borderRadius:12,border:playerCount===n?"2px solid #FFD700":"2px solid rgba(255,255,255,0.06)",background:playerCount===n?"rgba(255,215,0,0.12)":"rgba(255,255,255,0.02)",color:playerCount===n?"#FFD700":"#444",fontSize:22,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",transition:"all 0.2s"}}>{n}</button>
              ))}
            </div>
          </div>
          ) : (
          <div style={{marginBottom:20}}>
            <label style={{display:"block",marginBottom:8,fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Oponentes IA</label>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[1,2,3].map(n=>(
                <button key={n} onClick={()=>setAiCount(n)} style={{
                  flex:1,padding:"8px 4px",borderRadius:12,
                  border:aiCount===n?"2px solid #42A5F5":"2px solid rgba(255,255,255,0.06)",
                  background:aiCount===n?"rgba(66,165,245,0.12)":"rgba(255,255,255,0.02)",
                  color:aiCount===n?"#42A5F5":"#555",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.2s",
                }}>
                  <span style={{fontSize:18}}>{"🤖".repeat(n)}</span>
                  <span style={{fontSize:11,fontWeight:700}}>{n} bot{n>1?"s":""}</span>
                </button>
              ))}
            </div>
          </div>
          )}
          <div style={{marginBottom:20}}>
            <label style={{display:"block",marginBottom:8,fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Dificultad</label>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              {[
                {key:"facil",label:"Fácil",desc:"1 hamburguesa (4-6 ing.)",color:"#4CAF50"},
                {key:"medio",label:"Medio",desc:"2 hamburguesas (5-6 ing.)",color:"#FF9800"},
                {key:"dificil",label:"Difícil",desc:"3 hamburguesas (5-7 ing.)",color:"#f44336"},
              ].map(d=>(
                <button key={d.key} onClick={()=>setDifficulty(d.key)} style={{
                  flex:1,padding:"8px 4px",borderRadius:12,
                  border:difficulty===d.key?`2px solid ${d.color}`:"2px solid rgba(255,255,255,0.06)",
                  background:difficulty===d.key?`${d.color}18`:"rgba(255,255,255,0.02)",
                  color:difficulty===d.key?d.color:"#555",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",
                  display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.2s",
                }}>
                  {/* Políglota face */}
                  <svg viewBox="0 0 100 100" width="52" height="52">
                    {/* Head */}
                    <ellipse cx="50" cy="52" rx="38" ry="42" fill="#DEBB9B"/>
                    <ellipse cx="50" cy="22" rx="30" ry="14" fill="#E5C8A0"/>
                    {/* Hair sides */}
                    <path d="M14 46 Q8 30 13 14 Q15 6 20 12" fill="#2A2A2A"/>
                    <path d="M86 46 Q92 30 87 14 Q85 6 80 12" fill="#2A2A2A"/>
                    {/* Hair strand */}
                    <path d="M50 8 Q48 -2 51 -6" stroke="#2A2A2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    {/* Ears */}
                    <ellipse cx="12" cy="50" rx="5" ry="8" fill="#D4A880"/>
                    <ellipse cx="88" cy="50" rx="5" ry="8" fill="#D4A880"/>
                    {/* Nose */}
                    <ellipse cx="50" cy="54" rx="7" ry="5" fill="#D4A880"/>
                    {/* Mustache */}
                    <path d="M36 64 Q43 60 50 64 Q57 60 64 64" stroke="#2A2A2A" strokeWidth="2.5" fill="none"/>
                    {/* Expression per difficulty */}
                    {d.key==="facil" && <>
                      {/* Happy closed eyes */}
                      <path d="M32 42 Q38 36 44 42" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      <path d="M56 42 Q62 36 68 42" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      {/* Gentle smile */}
                      <path d="M34 70 Q50 84 66 70" fill="#1A1A1A"/>
                      <path d="M37 70 Q50 76 63 70" fill="#fff"/>
                    </>}
                    {d.key==="medio" && <>
                      {/* Determined eyes - open */}
                      <ellipse cx="38" cy="40" rx="6" ry="5" fill="#fff"/>
                      <ellipse cx="62" cy="40" rx="6" ry="5" fill="#fff"/>
                      <circle cx="38" cy="40" r="3" fill="#2A2A2A"/>
                      <circle cx="62" cy="40" r="3" fill="#2A2A2A"/>
                      {/* Slight frown eyebrows */}
                      <path d="M28 34 Q35 30 44 33" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      <path d="M72 34 Q65 30 56 33" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      {/* Teeth gritting smile */}
                      <path d="M32 68 Q50 82 68 68" fill="#1A1A1A"/>
                      <path d="M35 68 Q50 74 65 68" fill="#fff"/>
                      <path d="M38 78 Q50 82 62 78" fill="#fff"/>
                    </>}
                    {d.key==="dificil" && <>
                      {/* Angry eyes */}
                      <ellipse cx="38" cy="40" rx="7" ry="6" fill="#fff"/>
                      <ellipse cx="62" cy="40" rx="7" ry="6" fill="#fff"/>
                      <circle cx="39" cy="41" r="3.5" fill="#C62828"/>
                      <circle cx="63" cy="41" r="3.5" fill="#C62828"/>
                      <circle cx="39" cy="41" r="1.5" fill="#1A1A1A"/>
                      <circle cx="63" cy="41" r="1.5" fill="#1A1A1A"/>
                      {/* Angry eyebrows */}
                      <path d="M26 30 Q35 34 46 30" stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      <path d="M74 30 Q65 34 54 30" stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      {/* Wide open screaming mouth */}
                      <path d="M28 68 Q50 98 72 68" fill="#1A1A1A"/>
                      <path d="M32 68 Q50 75 68 68" fill="#fff"/>
                      <path d="M36 86 Q50 92 64 86" fill="#fff"/>
                      {/* Rage lines */}
                      <line x1="8" y1="28" x2="16" y2="32" stroke={d.color} strokeWidth="2" strokeLinecap="round"/>
                      <line x1="6" y1="36" x2="14" y2="38" stroke={d.color} strokeWidth="2" strokeLinecap="round"/>
                      <line x1="92" y1="28" x2="84" y2="32" stroke={d.color} strokeWidth="2" strokeLinecap="round"/>
                      <line x1="94" y1="36" x2="86" y2="38" stroke={d.color} strokeWidth="2" strokeLinecap="round"/>
                    </>}
                  </svg>
                  <span style={{fontSize:12,fontWeight:700}}>{d.label}</span>
                  <span style={{fontSize:8,opacity:0.7}}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
          {gameMode==="local" ? (
            Array.from({length:playerCount}).map((_,i)=>(
              <input key={i} value={names[i]} onChange={e=>{const n=[...names];n[i]=e.target.value;setNames(n);}}
                style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"2px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",color:"#fff",fontSize:14,fontFamily:"'Fredoka',sans-serif",boxSizing:"border-box",outline:"none",marginBottom:8}}
                placeholder={`Jugador ${i+1}`}/>
            ))
          ) : (
            <>
              <input value={names[0]} onChange={e=>{const n=[...names];n[0]=e.target.value;setNames(n);}}
                style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"2px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",color:"#fff",fontSize:14,fontFamily:"'Fredoka',sans-serif",boxSizing:"border-box",outline:"none",marginBottom:8}}
                placeholder="Tu nombre"/>
              <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                {AI_NAMES.slice(0,aiCount).map((n,i)=>(
                  <div key={i} style={{flex:1,padding:"8px 10px",borderRadius:8,background:"rgba(66,165,245,0.08)",border:"1px solid rgba(66,165,245,0.15)",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:14}}>🤖</span>
                    <span style={{fontSize:11,color:"#64B5F6"}}>{n}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button onClick={goToHatPick} style={{width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#FFD700,#FF6B35)",color:"#1a0a2e",fontSize:20,fontWeight:700,cursor:"pointer",fontFamily:"'Bangers',cursive",marginTop:12,letterSpacing:2}}>¡JUGAR! 🍔</button>
        </div>
      </div>
    );
  }

  /* ═══ WINNER ═══ */

  /* ═══ HAT PICK ═══ */
  if(screen==="hatpick"){
    const currentPicker = hatPickPlayer;
    const alreadyChosen = Object.values(hatChoices);
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0D0D1A 0%,#1A0F2E 40%,#0F2847 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka',sans-serif",color:"#fff",padding:20}}>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Bangers&display=swap" rel="stylesheet"/>
        <div style={{fontSize:56,marginBottom:8}}>🎩</div>
        <h2 style={{fontSize:32,fontFamily:"'Bangers',cursive",letterSpacing:2,margin:0,color:"#FFD700",textShadow:"0 0 15px rgba(255,107,53,0.5), 0 2px 4px rgba(0,0,0,0.3)"}}>Elegí tu Sombrero</h2>
        <p style={{color:"#888",fontSize:14,marginBottom:8}}>{gameMode==="vsAI" ? "Elegí tu idioma" : `Jugador ${currentPicker+1} de ${totalPlayers}`}</p>
        <div style={{
          background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"20px 28px",marginBottom:20,
          border:"2px solid #FFD700",boxShadow:"0 0 20px rgba(255,215,0,0.15)",textAlign:"center",
        }}>
          <span style={{fontSize:22,fontWeight:700,color:"#FFD700"}}>{gameMode==="vsAI" ? names[0] : names[currentPicker]}</span>
        </div>

        {/* Already chosen display */}
        {alreadyChosen.length > 0 && (
          <div style={{marginBottom:16,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
            {Object.entries(hatChoices).map(([pi,lang])=>(
              <div key={pi} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,opacity:0.5}}>
                <HatBadge lang={lang} isMain size="md"/>
                <span style={{fontSize:9,color:"#666"}}>{names[pi]}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"center",maxWidth:500}}>
          {LANGUAGES.map(lang=>{
            const taken = alreadyChosen.includes(lang);
            return(
              <div key={lang} onClick={taken?undefined:()=>pickHat(lang)} style={{
                display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                padding:"16px 18px",borderRadius:16,cursor:taken?"not-allowed":"pointer",
                background:taken?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",
                border:taken?"2px solid rgba(255,255,255,0.05)":`2px solid ${LANG_BORDER[lang]}88`,
                opacity:taken?0.25:1,transition:"all 0.25s",minWidth:100,
                boxShadow:taken?"none":`0 4px 15px ${LANG_BORDER[lang]}22`,
              }}
                onMouseOver={e=>{if(!taken)e.currentTarget.style.transform="scale(1.08)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="scale(1)";}}
              >
                <HatSVG lang={lang} size={48}/>
                <span style={{fontSize:16,fontWeight:800,color:LANG_TEXT[lang],letterSpacing:2,fontFamily:"'Fredoka',sans-serif"}}>
                  {LANG_SHORT[lang]}
                </span>
                <span style={{fontSize:10,color:"#888",textTransform:"capitalize"}}>{lang}</span>
                {taken && <span style={{fontSize:8,color:"#555"}}>Ya elegido</span>}
              </div>
            );
          })}
        </div>

        <button onClick={()=>setScreen("menu")} style={{
          marginTop:24,padding:"8px 24px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",
          background:"rgba(255,255,255,0.04)",color:"#666",fontSize:12,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",
        }}>← Volver al menú</button>
      </div>
    );
  }

  /* ═══ WINNER (continued) ═══ */
  if(winner){
    return(
      <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0D0D1A 0%,#1A0F2E 40%,#0F2847 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka',sans-serif",color:"#fff"}}>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Bangers&display=swap" rel="stylesheet"/>
        <div style={{fontSize:90}}>🏆</div>
        <h1 style={{fontSize:44,fontFamily:"'Bangers',cursive",letterSpacing:3,color:"#FFD700",textShadow:"0 0 15px rgba(255,107,53,0.5), 0 2px 4px rgba(0,0,0,0.3)"}}>¡{winner} GANA!</h1>
        <button onClick={()=>setScreen("menu")} style={{padding:"12px 40px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#FFD700,#FF6B35)",color:"#1a0a2e",fontSize:18,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginTop:20}}>Jugar de nuevo</button>
      </div>
    );
  }

  if(!P) return null;

  /* ═══ TURN TRANSITION ═══ */
  if(showTransition){
    return(
      <div onClick={dismissTransition} style={{
        minHeight:"100vh",background:"linear-gradient(160deg,#0D0D1A 0%,#1A0F2E 40%,#0F2847 100%)",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        fontFamily:"'Fredoka',sans-serif",color:"#fff",cursor:"pointer",userSelect:"none",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Bangers&display=swap" rel="stylesheet"/>
        
        {/* Políglota Hambriento with stacked hats */}
        <div style={{position:"relative",width:220,height:300,marginBottom:4}}>
          {/* Stacked hats on head */}
          <div style={{position:"absolute",top: Math.max(0, 30 - P.mainHats.length * 20),left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column-reverse",alignItems:"center",zIndex:10}}>
            {P.mainHats.map((h,i)=>(
              <div key={i} style={{
                marginBottom: i===0 ? 0 : -10,
                transform:`rotate(${(i%2===0?-1:1)*(3+i*2)}deg)`,
                filter:"drop-shadow(0 3px 5px rgba(0,0,0,0.5))",
                zIndex:10+i,
              }}>
                <HatSVG lang={h} size={48 - i*3}/>
              </div>
            ))}
          </div>
          
          {/* Character body SVG */}
          <svg viewBox="0 0 240 340" width="220" height="300" style={{position:"absolute",top:30,left:0}}>
            {/* Legs */}
            <rect x="82" y="255" width="20" height="65" rx="8" fill="#6D5040"/>
            <rect x="138" y="255" width="20" height="65" rx="8" fill="#6D5040"/>
            {/* Pants */}
            <path d="M78 245 Q120 260 162 245 L158 275 Q120 285 82 275 Z" fill="#7D6050"/>
            {/* Body / shirt */}
            <ellipse cx="120" cy="215" rx="68" ry="58" fill="#E8DDD0"/>
            {/* Suspenders */}
            <path d="M82 168 L92 278" stroke="#2A2A2A" strokeWidth="7" strokeLinecap="round"/>
            <path d="M158 168 L148 278" stroke="#2A2A2A" strokeWidth="7" strokeLinecap="round"/>
            {/* Buttons */}
            <circle cx="120" cy="210" r="3.5" fill="#2A2A2A"/>
            <circle cx="120" cy="232" r="3.5" fill="#2A2A2A"/>
            {/* Red neckerchief */}
            <path d="M96 162 Q120 158 144 162 L134 198 Q120 208 106 198 Z" fill="#D43030"/>
            <circle cx="113" cy="183" r="1.8" fill="#B02020" opacity="0.5"/>
            <circle cx="124" cy="188" r="1.8" fill="#B02020" opacity="0.5"/>
            <circle cx="118" cy="193" r="1.5" fill="#B02020" opacity="0.5"/>
            {/* Arms spread wide */}
            <path d="M52 205 Q32 178 22 148 Q18 135 28 130" stroke="#E0D0C0" strokeWidth="16" fill="none" strokeLinecap="round"/>
            <path d="M188 205 Q208 178 218 148 Q222 135 212 130" stroke="#E0D0C0" strokeWidth="16" fill="none" strokeLinecap="round"/>
            {/* Left hand with fingers */}
            <g transform="translate(20,124)">
              <circle cx="0" cy="0" r="7" fill="#DEBB9B"/>
              <path d="M-4 -7 Q-7 -15 -3 -17" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M0 -8 Q-1 -17 2 -19" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M4 -7 Q5 -16 8 -17" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M8 -4 Q11 -11 13 -11" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </g>
            {/* Right hand with fingers */}
            <g transform="translate(220,124)">
              <circle cx="0" cy="0" r="7" fill="#DEBB9B"/>
              <path d="M4 -7 Q7 -15 3 -17" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M0 -8 Q1 -17 -2 -19" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M-4 -7 Q-5 -16 -8 -17" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M-8 -4 Q-11 -11 -13 -11" stroke="#DEBB9B" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </g>
            {/* Head */}
            <ellipse cx="120" cy="108" rx="50" ry="55" fill="#DEBB9B"/>
            {/* Bald top */}
            <ellipse cx="120" cy="68" rx="40" ry="18" fill="#E5C8A0"/>
            {/* Hair on sides */}
            <path d="M74 100 Q67 78 72 58 Q74 48 80 54" fill="#2A2A2A"/>
            <path d="M166 100 Q173 78 168 58 Q166 48 160 54" fill="#2A2A2A"/>
            {/* Single hair strand */}
            <path d="M120 50 Q117 36 121 26" stroke="#2A2A2A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Closed happy eyes */}
            <path d="M99 96 Q105 89 111 96" stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M129 96 Q135 89 141 96" stroke="#2A2A2A" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* Big nose */}
            <ellipse cx="120" cy="110" rx="9" ry="7" fill="#D4A880"/>
            {/* Mustache */}
            <path d="M106 120 Q113 116 120 120 Q127 116 134 120" stroke="#2A2A2A" strokeWidth="3" fill="none"/>
            {/* BIG open laughing mouth */}
            <path d="M93 126 Q120 164 147 126" fill="#1A1A1A"/>
            {/* Top teeth */}
            <path d="M97 126 Q120 134 143 126" fill="#fff"/>
            {/* Bottom teeth */}
            <path d="M101 150 Q120 157 139 150" fill="#fff"/>
            {/* Tongue hint */}
            <ellipse cx="120" cy="148" rx="10" ry="5" fill="#C44040" opacity="0.5"/>
            {/* Ears */}
            <ellipse cx="70" cy="106" rx="7" ry="11" fill="#D4A880"/>
            <ellipse cx="170" cy="106" rx="7" ry="11" fill="#D4A880"/>
          </svg>
        </div>

        <div style={{fontSize:14,color:"#555",letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>Es el turno de</div>
        <div style={{
          fontSize:36,fontFamily:"'Bangers',cursive",letterSpacing:3,
          color:"#FFD700",textShadow:"0 0 15px rgba(255,107,53,0.5), 0 2px 4px rgba(0,0,0,0.3)",
          marginBottom:20,
        }}>{P.name}</div>
        <div style={{
          padding:"12px 32px",borderRadius:12,
          background:"rgba(255,255,255,0.04)",border:"2px solid rgba(255,255,255,0.08)",
          animation:"pulse 2s infinite",
        }}>
          <span style={{fontSize:14,color:"#888"}}>Tocá para comenzar tu turno</span>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    );
  }

  /* ═══ GAME ═══ */

  const ActionPanel = () => (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {/* Steps */}
      {(()=>{
        const inSP=["selectTarget","selectSteal","selectPercheroHat","selectPercheroExtra","selectDiscardForHat","negPrompt","discardToPass"].includes(phase);
        const s1D=didAnything&&phase!=="playAfterHat", s1A=!didAnything&&phase==="play";
        const s2A=(!didAnything&&phase==="play")||phase==="playAfterHat", s2D=didAnything&&phase!=="playAfterHat";
        const s3A=didAnything||phase==="playAfterHat";
        if(inSP)return null;
        const Step=({n,done,active,label})=>(
          <div style={{display:"flex",alignItems:"center",gap:4,opacity:done?0.35:1}}>
            <div style={{width:14,height:14,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:800,
              background:done?"#4CAF50":active?(n===1?"#9C27B0":n===2?"#FF9800":"#1976D2"):"rgba(255,255,255,0.06)",
              color:done||active?"#fff":"#444"}}>{done?"✓":n}</div>
            <span style={{fontSize:7,color:active?(n===1?"#CE93D8":n===2?"#FFB74D":"#64B5F6"):"#555"}}>{label}</span>
          </div>
        );
        return <div style={{display:"flex",gap:6,marginBottom:2}}><Step n={1} done={s1D} active={s1A} label="Extra"/><Step n={2} done={s2D} active={s2A&&!s2D} label="Carta"/><Step n={3} done={false} active={s3A} label="Fin"/></div>;
      })()}

      {phase==="selectTarget"&&<div style={{background:"rgba(255,107,53,0.08)",borderRadius:8,padding:6,fontSize:10,color:"#FF6B35"}}>👆 Elegí un jugador</div>}
      {phase==="selectSteal"&&<div style={{background:"rgba(255,107,53,0.08)",borderRadius:8,padding:6,fontSize:10,color:"#FF6B35"}}>👆 Elegí ingrediente</div>}
      {phase==="selectPercheroHat"&&<div style={{background:"rgba(156,39,176,0.08)",borderRadius:8,padding:6,fontSize:10,color:"#CE93D8"}}>👆 Elegí sombrero del perchero</div>}
      {phase==="selectPercheroExtra"&&<div style={{background:"rgba(156,39,176,0.08)",borderRadius:8,padding:6,fontSize:10,color:"#CE93D8"}}>👆 Elegí sombrero para agregar</div>}
      {phase==="playAfterHat"&&(()=>{
        const hasPlayable = P.hand.some(c=>c.type==="ingredient"&&canPlay(P,c));
        return hasPlayable
          ? <div style={{background:"rgba(76,175,80,0.08)",borderRadius:8,padding:6,fontSize:10,color:"#66BB6A"}}>Podés jugar un ingrediente</div>
          : <div style={{background:"rgba(255,152,0,0.08)",borderRadius:8,padding:6,fontSize:10,color:"#FFB74D"}}>No tenés ingredientes jugables</div>;
      })()}
      {phase==="discardToPass"&&(
        <div style={{background:"rgba(244,67,54,0.08)",borderRadius:8,padding:6}}>
          <div style={{fontSize:10,color:"#EF5350",fontWeight:700,marginBottom:4}}>🗑️ Descartá para pasar</div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
            {P.hand.map((c,i)=><div key={i} onClick={()=>discardToPass(i)} style={{width:26,height:26,borderRadius:5,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(244,67,54,0.15)",cursor:"pointer",border:"1px solid rgba(244,67,54,0.3)"}}>{c.type==="ingredient"?ING_EMOJI[c.ingredient]:gAI(c.action)?.emoji}</div>)}
          </div>
        </div>
      )}
      {negPrompt&&(
        <div style={{background:"rgba(33,150,243,0.08)",borderRadius:8,padding:6}}>
          <div style={{fontSize:10,color:"#42A5F5",fontWeight:700,marginBottom:4}}>🚫 Negación</div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>handleNeg(true)} style={{flex:1,padding:5,borderRadius:6,border:"none",background:"#1565C0",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Usar</button>
            <button onClick={()=>handleNeg(false)} style={{flex:1,padding:5,borderRadius:6,border:"none",background:"rgba(255,255,255,0.06)",color:"#777",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>No</button>
          </div>
        </div>
      )}
      {basPhase==="choose"&&(
        <div style={{background:"rgba(121,85,72,0.1)",borderRadius:8,padding:6}}>
          <div style={{fontSize:9,color:"#A1887F",fontWeight:700,marginBottom:4}}>🗑️ Basurero</div>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>{const f=discard.find(c=>c.type!=="ingredient");if(f){const ps=[...players],p={...ps[cp]};if(p.hand.length<p.maxHand){p.hand.push(f);setDiscard(prev=>prev.filter(c=>c.id!==f.id));addLog(p.name,`sacó ${gAI(f.action)?.emoji}`,"#795548");}ps[cp]=p;setPlayers(ps);}else addLog("Sistema","Vacío","#f44336");setBasPhase("noDrawThisTurn");setTimeout(()=>finishTurn(),1200);}} style={{flex:1,padding:4,borderRadius:5,border:"none",background:"rgba(255,255,255,0.05)",color:"#bbb",fontSize:7,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>No-ingrediente</button>
            <button onClick={()=>{if(discard.length>0){const top=discard[discard.length-1];const ps=[...players],p={...ps[cp]};if(p.hand.length<p.maxHand){p.hand.push(top);setDiscard(prev=>prev.slice(0,-1));addLog(p.name,"tomó tope","#795548");}ps[cp]=p;setPlayers(ps);}else addLog("Sistema","Vacío","#f44336");setBasPhase("noDrawThisTurn");setTimeout(()=>finishTurn(),1200);}} style={{flex:1,padding:4,borderRadius:5,border:"none",background:"rgba(255,255,255,0.05)",color:"#bbb",fontSize:7,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Tomar tope</button>
          </div>
        </div>
      )}
      {sel!==null&&P.hand[sel]&&(phase==="play"||phase==="playAfterHat")&&(<>
      </>)}
      {phase==="play"&&!didAnything&&(<div style={{display:"flex",gap:4}}>
        {P.perchero.length>0&&P.hand.length>0&&<button onClick={changeHat} style={{flex:1,padding:5,borderRadius:7,border:"1px solid rgba(156,39,176,0.2)",background:"rgba(156,39,176,0.06)",color:"#BA68C8",fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>🎩 Cambiar</button>}
        {P.perchero.length>0&&P.hand.length>0&&<button onClick={addExtraHat} style={{flex:1,padding:5,borderRadius:7,border:"1px solid rgba(156,39,176,0.2)",background:"rgba(156,39,176,0.06)",color:"#BA68C8",fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>➕ Agregar</button>}
      </div>)}
      {phase==="selectDiscardForHat"&&actData&&(
        <div style={{background:"rgba(156,39,176,0.06)",borderRadius:8,padding:6}}>
          <div style={{fontSize:9,color:"#CE93D8",marginBottom:4}}>Descartá {actData.needed} ({actData.selected.length}/{actData.needed})</div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:4}}>
            {P.hand.map((c,i)=><div key={i} onClick={()=>{const s=[...actData.selected];if(s.includes(i))s.splice(s.indexOf(i),1);else if(s.length<actData.needed)s.push(i);setActData({...actData,selected:s});}} style={{width:22,height:22,borderRadius:4,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",background:actData.selected.includes(i)?"#C62828":"rgba(255,255,255,0.05)",cursor:"pointer"}}>{c.type==="ingredient"?ING_EMOJI[c.ingredient]:gAI(c.action)?.emoji}</div>)}
          </div>
          {actData.selected.length===actData.needed&&<button onClick={()=>{const ps=[...players],p={...ps[cp]};actData.selected.sort((a,b)=>b-a).forEach(idx=>{setDiscard(prev=>[...prev,p.hand[idx]]);p.hand.splice(idx,1);});ps[cp]=p;setPlayers(ps);setPhase("selectPercheroHat");setActData(null);}} style={{width:"100%",padding:5,borderRadius:5,border:"none",background:"#7B1FA2",color:"#fff",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Confirmar</button>}
        </div>
      )}
      {!didAnything&&<button onClick={endTurn} style={{width:"100%",padding:8,borderRadius:8,border:"none",background:"linear-gradient(135deg,#78909C,#90A4AE)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginTop:2}}>Pasar ⏭️</button>}
      {phase==="playAfterHat"&&<button onClick={()=>finishTurn()} style={{width:"100%",padding:8,borderRadius:8,border:"none",background:"linear-gradient(135deg,#78909C,#90A4AE)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginTop:2}}>Pasar ⏭️</button>}
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0D0D1A 0%,#120E24 40%,#0C1F3A 100%)",fontFamily:"'Fredoka',sans-serif",color:"#fff",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Bangers&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
      <style>{`@media(max-width:700px){.gds{display:none!important}.gma{display:flex!important}}@keyframes popIn{0%{transform:translateX(-50%) scale(0.5);opacity:0}100%{transform:translateX(-50%) scale(1);opacity:1}}`}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:18}}>🍔</span>
          <span style={{fontWeight:700,fontSize:12}}><span style={{color:"#FFD700"}}>{P.name}</span></span>
          <span style={{fontSize:9,color:"#555"}}>🍔{P.currentBurger+1}/{P.totalBurgers}</span>
        </div>
        <div style={{display:"flex",gap:6,fontSize:9,color:"#444"}}><span>🃏{deck.length}</span><span>🗑️{discard.length}</span></div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* Main */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto",padding:8,gap:6,paddingBottom:16}}>
          {/* Opponents */}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {players.map((p,i)=>{
              if(i===cp)return null;
              const isTgt=phase==="selectTarget";
              return(<div key={i} onClick={()=>{if(isTgt)execTargeted(i);}} style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:6,flex:"1 1 110px",minWidth:100,cursor:isTgt?"pointer":"default",border:isTgt?"2px solid #FF6B35":"2px solid rgba(255,255,255,0.03)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontWeight:600,fontSize:10}}>{p.isAI?"🤖":""}{p.name}</span>
                  <span style={{fontSize:8,color:"#444"}}>🃏{p.hand.length}</span>
                </div>
                <div style={{display:"flex",gap:2,marginBottom:3,flexWrap:"wrap",alignItems:"center"}}>
                  {p.mainHats.map((h,j)=><HatBadge key={j} lang={h} isMain size="sm"/>)}
                  {p.perchero.length>0&&<span style={{color:"#222",fontSize:7}}>+{p.perchero.length}</span>}
                </div>
                <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                  {p.table.map((ing,j)=>(
                    <div key={j} onClick={e=>{if(phase==="selectSteal"&&actTarget===i){e.stopPropagation();stealIng(j);}}}
                      style={{width:18,height:18,borderRadius:3,background:ING_BG[ing],display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,cursor:phase==="selectSteal"&&actTarget===i?"pointer":"default",border:phase==="selectSteal"&&actTarget===i?"2px solid #FFD700":"none"}}>{ING_EMOJI[ing]}</div>
                  ))}
                  {!p.table.length&&<span style={{fontSize:7,color:"#333"}}>vacío</span>}
                </div>
                <div style={{display:"flex",gap:2,marginTop:2}}>
                  {p.burgers.map((b,j)=><span key={j} style={{fontSize:7,color:j<p.currentBurger?"#4CAF50":j===p.currentBurger?"#FFD700":"#222"}}>{j<p.currentBurger?"✅":"🍔"}{b.length}</span>)}
                </div>
              </div>);
            })}
          </div>

          {/* Principal + Perchero + Objetivo */}
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:8,display:"flex",gap:8,alignItems:"stretch",flexWrap:"wrap"}}>
            {/* Principal hat */}
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,justifyContent:"center"}}>
              <span style={{fontSize:7,color:"#FFD700",fontWeight:800}}>PRINCIPAL</span>
              <div style={{display:"flex",gap:3}}>
                {P.mainHats.map((h,i)=><HatBadge key={i} lang={h} isMain size="sm"/>)}
              </div>
            </div>
            {/* Perchero */}
            {P.perchero.length > 0 && (
              <PercheroSVG 
                hats={P.perchero} 
                height={90}
                onClickHat={phase==="selectPercheroHat"
                  ? (i)=>selPercheroHat(i)
                  : phase==="selectPercheroExtra"
                    ? (i)=>execAddExtra(i)
                    : undefined
                }
              />
            )}
            {!P.perchero.length&&<span style={{fontSize:7,color:"#333",alignSelf:"center"}}>Perchero vacío</span>}
            {/* Divider */}
            <div style={{width:1,background:"rgba(255,255,255,0.06)",alignSelf:"stretch"}}/>
            {/* Objetivo */}
            <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",minWidth:80}}>
              <div style={{fontSize:8,color:"#444",marginBottom:4,fontWeight:700,letterSpacing:1}}>🍔 OBJETIVO ({P.currentBurger+1}/{P.totalBurgers})</div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                {Array.from({length:P.currentBurger}).map((_,i)=><span key={i} style={{fontSize:14}}>✅</span>)}
                {P.currentBurger<P.totalBurgers&&<BurgerTarget ingredients={P.burgers[P.currentBurger]} table={P.table} isCurrent={true}/>}
                {Array.from({length:Math.max(0,P.totalBurgers-1-P.currentBurger)}).map((_,i)=>(
                  <div key={i} style={{width:28,height:38,borderRadius:5,background:"rgba(255,255,255,0.02)",border:"2px dashed rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:14,opacity:0.12}}>❓</span></div>
                ))}
              </div>
            </div>
          </div>

          {/* Tu Mesa */}
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:8}}>
            <div style={{fontSize:8,color:"#444",marginBottom:4,fontWeight:700,letterSpacing:1}}>🍽️ TU MESA</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",minHeight:28,alignItems:"center"}}>
              {P.table.map((ing,i)=><div key={i} style={{width:26,height:26,borderRadius:5,background:ING_BG[ing],display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}>{ING_EMOJI[ing]}</div>)}
              {!P.table.length&&<span style={{fontSize:8,color:"#333"}}>Vacía</span>}
            </div>
          </div>

          {/* Hand - fan layout like holding cards */}
          <div style={{background:"rgba(255,255,255,0.02)",borderRadius:10,padding:8,paddingBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:8,color:"#444",fontWeight:700,letterSpacing:1}}>🃏 MANO ({P.hand.length}/{P.maxHand})</span>
              <div style={{display:"flex",gap:2}}>{P.mainHats.map((h,i)=><span key={i} style={{fontSize:6,fontWeight:800,color:LANG_TEXT[h],background:`${LANG_BORDER[h]}22`,padding:"1px 3px",borderRadius:3}}>{LANG_SHORT[h]}</span>)}</div>
            </div>
            <div style={{display:"flex",justifyContent:"center",alignItems:"flex-end",position:"relative",minHeight:120,paddingTop:10}}>
              {P.hand.map((card,i)=>{
                const ok=card.type==="ingredient"?canPlay(P,card):true;
                const total=P.hand.length;
                const mid=(total-1)/2;
                const offset=i-mid;
                const maxAngle=total<=3?6:total<=5?8:10;
                const angle=offset*maxAngle;
                const rise=Math.abs(offset)*Math.abs(offset)*(total<=3?3:2);
                const spread=total<=3?40:total<=5?32:26;
                const tx=offset*spread;
                const isSelected=sel===i;
                return(
                  <div key={card.id} style={{
                    position:"absolute",
                    left:`calc(50% + ${tx}px - 32px)`,
                    bottom:isSelected?rise+24:rise,
                    transform:`rotate(${isSelected?0:angle}deg)`,
                    transformOrigin:"bottom center",
                    transition:"all 0.25s ease",
                    zIndex:isSelected?50:i,
                    filter:isSelected?"drop-shadow(0 -4px 12px rgba(255,215,0,0.4))":"drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    cursor:"pointer",
                  }} onClick={()=>setSel(sel===i?null:i)}>
                    {/* Play button above selected card */}
                    {isSelected && (phase==="play"||phase==="playAfterHat") && (()=>{
                      const c=P.hand[sel];
                      if(!c)return null;
                      const isIng=c.type==="ingredient";
                      const canDo=isIng?((!didAnything)||(phase==="playAfterHat"&&didAnything)):(!didAnything&&phase==="play");
                      if(!canDo)return null;
                      const playable=isIng?canPlay(P,c):true;
                      return(
                        <button onClick={(e)=>{e.stopPropagation();isIng?playIngredient(sel):playAction(sel);}} style={{
                          position:"absolute",top:-32,left:"50%",transform:"translateX(-50%)",whiteSpace:"nowrap",
                          padding:"5px 10px",borderRadius:8,border:"none",zIndex:60,
                          background:isIng
                            ?(playable?"linear-gradient(135deg,#2E7D32,#43A047)":"rgba(255,255,255,0.1)")
                            :"linear-gradient(135deg,#E65100,#FF9800)",
                          color:"#fff",fontSize:10,fontWeight:700,cursor:playable?"pointer":"default",
                          fontFamily:"'Fredoka',sans-serif",opacity:playable?1:0.4,
                          boxShadow:"0 3px 10px rgba(0,0,0,0.4)",
                          animation:"popIn 0.2s ease",
                        }}>
                          {isIng?`▶ ${ING_EMOJI[c.ingredient]}`:`▶ ${gAI(c.action)?.emoji}`}
                        </button>
                      );
                    })()}
                    <GameCard card={card} selected={isSelected} playable={ok} small/>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile actions - visible only on narrow screens */}
          <div className="gma" style={{display:"none",flexDirection:"column",background:"rgba(0,0,0,0.3)",borderRadius:10,padding:10}}>
            <ActionPanel/>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="gds" style={{width:210,borderLeft:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",background:"rgba(0,0,0,0.3)"}}>
          <div style={{padding:10,borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <ActionPanel/>
          </div>
          <div ref={logRef} style={{flex:1,overflow:"auto",padding:6}}>
            <div style={{fontSize:8,color:"#333",marginBottom:4,fontWeight:700,letterSpacing:1}}>REGISTRO</div>
            {log.map((e,i)=><LogEntry key={i} e={e}/>)}
          </div>
        </div>
      </div>

      {/* Perrito modal */}
      {perritoChoice&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#1A1A2E",borderRadius:20,padding:20,maxWidth:340,width:"90%",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:10,textAlign:"center"}}>🌭 Elegí ingrediente para comodín</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
              {INGREDIENTS.map(ing=>(
                <div key={ing} onClick={()=>{const ps=[...players],p={...ps[perritoChoice.pi]};const idx=p.table.indexOf("perrito");if(idx!==-1)p.table[idx]=ing;ps[perritoChoice.pi]=p;setPlayers(ps);if(perritoChoice.rem>1)setPerritoChoice({...perritoChoice,rem:perritoChoice.rem-1});else setPerritoChoice(null);}} style={{width:44,height:44,borderRadius:10,background:ING_BG[ing],display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,cursor:"pointer",border:"2px solid rgba(0,0,0,0.15)"}}>{ING_EMOJI[ing]}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wildcard choice modal */}
      {wildcardPending&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
          <div style={{background:"#1A1A2E",borderRadius:20,padding:20,maxWidth:360,width:"90%",border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:4,textAlign:"center"}}>🌭 ¿Qué ingrediente representa?</div>
            <div style={{fontSize:10,color:"#888",textAlign:"center",marginBottom:10}}>Elegí el ingrediente del comodín</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
              {INGREDIENTS.map(ing=>(
                <div key={ing} onClick={()=>confirmWildcard(ing)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,width:48,padding:"6px 2px",borderRadius:8,background:ING_BG[ing],cursor:"pointer",border:"2px solid rgba(0,0,0,0.15)"}}>
                  <span style={{fontSize:22}}>{ING_EMOJI[ing]}</span>
                  <span style={{fontSize:6,fontWeight:700,color:"#333"}}>{ing}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setWildcardPending(null)} style={{width:"100%",marginTop:10,padding:6,borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#666",fontSize:10,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Hat stolen - victim picks replacement */}
      {hatStolenVictim&&(()=>{
        const victim = players[hatStolenVictim.playerIdx];
        if(!victim || victim.perchero.length===0) return null;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
            <div style={{background:"#1A1A2E",borderRadius:20,padding:24,maxWidth:380,width:"90%",border:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{fontSize:18,marginBottom:4,textAlign:"center"}}>🎩</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:4,textAlign:"center",color:"#EF5350"}}>¡Te robaron el sombrero!</div>
              <div style={{fontSize:11,color:"#888",textAlign:"center",marginBottom:14}}>
                <span style={{color:"#FFD700",fontWeight:700}}>{victim.name}</span>, elegí un sombrero del perchero como nuevo principal
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
                {victim.perchero.map((lang,i)=>(
                  <div key={i} onClick={()=>pickReplacementHat(i)} style={{
                    display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                    padding:"12px 14px",borderRadius:12,cursor:"pointer",
                    background:"rgba(255,255,255,0.04)",border:`2px solid ${LANG_BORDER[lang]}88`,
                    transition:"all 0.2s",
                  }}
                    onMouseOver={e=>e.currentTarget.style.transform="scale(1.1)"}
                    onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
                    <HatSVG lang={lang} size={36}/>
                    <span style={{fontSize:10,fontWeight:800,color:LANG_TEXT[lang]}}>{LANG_SHORT[lang]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
