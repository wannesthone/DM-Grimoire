// ===== LIBRARY — AI-Powered Web Search =====
let libSearchDebounce=null;
let libCurrentCategory=''; // kept for compatibility, unused in new flow

function debouncedLibSearch(){clearTimeout(libSearchDebounce);libSearchDebounce=setTimeout(searchLibrary,380);}
function setLibCategory(cat,btn){libCurrentCategory=cat;document.querySelectorAll('#page-library .type-tab').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');searchLibrary();}

function closeLibDetail(){
  document.getElementById('lib-detail-view').style.display='none';
  document.getElementById('lib-search-view').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}

const TOME_ICONS=['📖','📜'];
const TOME_SEALS=['⚜','🔮'];

async function searchLibrary(){
  const q=(document.getElementById('library-search').value||'').trim();
  const loading=document.getElementById('library-loading');
  const results=document.getElementById('library-results');
  if(!q){results.innerHTML='';return;}

  loading.style.display='';results.innerHTML='';
  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        tools:[{type:'web_search_20250305',name:'web_search'}],
        system:`You are a D&D 5e librarian. The user searches for a D&D topic. Use web_search to find the top two most trusted, currently recommended external websites for that topic (e.g. D&D Beyond, Roll20 Wiki, Forgotten Realms Wiki, Reddit r/DnD, etc.). Return ONLY a JSON array of exactly 2 objects, no markdown, no preamble:
[{"title":"Site Name – Page Title","url":"https://...","description":"One punchy sentence describing what this page offers, written in an arcane library style."},...]`,
        messages:[{role:'user',content:`D&D search: ${q}`}]
      })
    });
    const data=await resp.json();
    // Extract the final text block which contains our JSON
    const textBlock=data.content?.filter(b=>b.type==='text').pop();
    let tomes=[];
    if(textBlock?.text){
      try{
        const clean=textBlock.text.replace(/```json|```/g,'').trim();
        tomes=JSON.parse(clean);
      }catch{}
    }
    renderTomeResults(tomes,q);
  }catch(e){
    console.error(e);
    results.innerHTML=`<div class="lib-error-scroll"><strong style="font-family:Cinzel,serif;color:var(--red2);">⚠ The arcane connection faltered</strong><br><br>The library could not reach the outer planes. Check your connection and try again.</div>`;
  }
  loading.style.display='none';
}

function renderTomeResults(tomes,q){
  const results=document.getElementById('library-results');
  if(!Array.isArray(tomes)||!tomes.length){
    results.innerHTML=`<div class="lib-empty-scroll"><span class="empty-rune">🔍</span><p>No scrolls were found for "<em>${q}</em>". Try rephrasing your query.</p></div>`;
    return;
  }
  const cards=tomes.slice(0,2).map((t,i)=>{
    const safeName=(t.title||'Unknown Tome').replace(/</g,'&lt;');
    const safeDesc=(t.description||'').replace(/</g,'&lt;');
    const safeUrl=t.url&&t.url.startsWith('http')?t.url:'#';
    return`<a class="lib-tome-card" href="${safeUrl}" target="_blank" rel="noopener">
      <div class="tome-spine"></div>
      <div class="tome-body">
        <div class="tome-number">Volume ${['I','II'][i]}</div>
        <span class="tome-icon">${TOME_ICONS[i]}</span>
        <div class="tome-title">${safeName}</div>
        <hr class="tome-divider">
        <div class="tome-desc">${safeDesc}</div>
        <div class="tome-link-row"><span>${new URL(safeUrl).hostname.replace('www.','')}</span><span class="tome-link-arrow">→</span></div>
        ${i===0?`<div class="tome-seal">${TOME_SEALS[i]}</div>`:''}
      </div>
    </a>`;
  }).join('');
  results.innerHTML=`<div class="lib-tome-grid">${cards}</div>`;
}



// ===== RANDOM CHARACTER GENERATOR =====
const RCG_RACE_DATA={
  'Human':            {asi:{str:1,dex:1,con:1,int:1,wis:1,cha:1},speed:30,size:'Medium'},
  'Variant Human':    {asi:{},speed:30,size:'Medium',note:'Choose 2 stats +1, 1 skill, 1 feat'},
  'High Elf':         {asi:{dex:2,int:1},speed:30,size:'Medium'},
  'Wood Elf':         {asi:{dex:2,wis:1},speed:35,size:'Medium'},
  'Drow':             {asi:{dex:2,cha:1},speed:30,size:'Medium'},
  'Hill Dwarf':       {asi:{con:2,wis:1},speed:25,size:'Medium'},
  'Mountain Dwarf':   {asi:{con:2,str:2},speed:25,size:'Medium'},
  'Lightfoot Halfling':{asi:{dex:2,cha:1},speed:25,size:'Small'},
  'Stout Halfling':   {asi:{dex:2,con:1},speed:25,size:'Small'},
  'Half-Elf':         {asi:{cha:2},speed:30,size:'Medium',note:'+1 to any 2 other stats'},
  'Half-Orc':         {asi:{str:2,con:1},speed:30,size:'Medium'},
  'Tiefling':         {asi:{int:1,cha:2},speed:30,size:'Medium'},
  'Dragonborn':       {asi:{str:2,cha:1},speed:30,size:'Medium'},
  'Forest Gnome':     {asi:{int:2,dex:1},speed:25,size:'Small'},
  'Rock Gnome':       {asi:{int:2,con:1},speed:25,size:'Small'},
  'Deep Gnome':       {asi:{int:2,dex:1},speed:25,size:'Small'},
  // Volo's Guide
  'Aasimar':          {asi:{cha:2},speed:30,size:'Medium'},
  'Fallen Aasimar':   {asi:{str:1,cha:2},speed:30,size:'Medium'},
  'Protector Aasimar':{asi:{wis:1,cha:2},speed:30,size:'Medium'},
  'Scourge Aasimar':  {asi:{con:1,cha:2},speed:30,size:'Medium'},
  'Firbolg':          {asi:{wis:2,str:1},speed:30,size:'Medium'},
  'Goliath':          {asi:{str:2,con:1},speed:30,size:'Medium'},
  'Kenku':            {asi:{dex:2,wis:1},speed:30,size:'Medium'},
  'Lizardfolk':       {asi:{con:2,wis:1},speed:30,size:'Medium'},
  'Tabaxi':           {asi:{dex:2,cha:1},speed:30,size:'Medium'},
  'Triton':           {asi:{str:1,con:1,cha:1},speed:30,size:'Medium'},
  'Bugbear':          {asi:{str:2,dex:1},speed:30,size:'Medium'},
  'Goblin':           {asi:{dex:2,con:1},speed:30,size:'Small'},
  'Hobgoblin':        {asi:{con:2,int:1},speed:30,size:'Medium'},
  'Kobold':           {asi:{dex:2},speed:30,size:'Small'},
  'Orc':              {asi:{str:2,con:1},speed:30,size:'Medium'},
  'Yuan-Ti Pureblood':{asi:{int:1,cha:2},speed:30,size:'Medium'},
  // Mordenkainen's
  'Githyanki':        {asi:{str:2,int:1},speed:30,size:'Medium'},
  'Githzerai':        {asi:{wis:2,int:1},speed:30,size:'Medium'},
  // Eberron / other
  'Changeling':       {asi:{cha:2},speed:30,size:'Medium',note:'+1 to 2 other stats'},
  'Kalashtar':        {asi:{wis:2,cha:1},speed:30,size:'Medium'},
  'Shifter (Beasthide)':{asi:{con:1},speed:30,size:'Medium'},
  'Shifter (Longtooth)':{asi:{str:1},speed:30,size:'Medium'},
  'Shifter (Swiftstride)':{asi:{dex:1,cha:1},speed:35,size:'Medium'},
  'Shifter (Wildhunt)':{asi:{wis:2},speed:30,size:'Medium'},
  'Warforged':        {asi:{con:2},speed:30,size:'Medium',note:'+1 to 1 other stat'},
  // Ravnica / Theros
  'Centaur':          {asi:{str:2,wis:1},speed:40,size:'Medium'},
  'Loxodon':          {asi:{con:2,wis:1},speed:30,size:'Medium'},
  'Minotaur':         {asi:{str:2,con:1},speed:30,size:'Medium'},
  'Simic Hybrid':     {asi:{con:2},speed:30,size:'Medium',note:'+1 to 1 other stat'},
  'Vedalken':         {asi:{int:2,wis:1},speed:30,size:'Medium'},
  'Leonin':           {asi:{str:1,con:2},speed:35,size:'Medium'},
  'Satyr':            {asi:{dex:1,cha:2},speed:35,size:'Medium'},
  // Tasha's / other
  'Fairy':            {asi:{dex:1,wis:1},speed:30,size:'Small'},
  'Harengon':         {asi:{dex:1},speed:30,size:'Small'},
  'Hexblood':         {asi:{wis:1,cha:1},speed:30,size:'Medium'},
  'Reborn':           {asi:{con:1,int:1},speed:30,size:'Medium'},
  'Dhampir':          {asi:{dex:1,cha:1},speed:35,size:'Medium'},
  'Owlfolk':          {asi:{int:1,wis:2},speed:25,size:'Small'},
  'Rabbitfolk':       {asi:{dex:2,wis:1},speed:30,size:'Small'},
  'Dragonkin':        {asi:{str:1,cha:1},speed:30,size:'Medium'},
  'Tortle':           {asi:{str:2,wis:1},speed:30,size:'Medium'},
  'Grung':            {asi:{dex:2,con:1},speed:25,size:'Small'},
  'Sea Elf':          {asi:{dex:2,con:1},speed:30,size:'Medium'},
  'Eladrin':          {asi:{dex:2,int:1},speed:30,size:'Medium'},
  'Shadar-kai':       {asi:{dex:2,con:1},speed:30,size:'Medium'},
};
const RCG_RACES=Object.keys(RCG_RACE_DATA);
const RCG_CLASSES=['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard','Artificer'];
const RCG_BACKGROUNDS=['Acolyte','Charlatan','Criminal','Entertainer','Folk Hero','Guild Artisan','Hermit','Noble','Outlander','Sage','Sailor','Soldier','Urchin','Anthropologist','Archaeologist','City Watch','Clan Crafter','Cloistered Scholar','Courtier','Far Traveler','Feylost','Fisher','Gladiator','Haunted One','Inheritor','Knight','Marine','Mercenary Veteran','Outlander','Pirate','Ruined','Urban Bounty Hunter'];
const RCG_ALIGN=['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral'];
// Stat priority: [primary, secondary, tertiary, ...rest in order]
const RCG_STAT_PRIORITY={
  Barbarian: ['str','con','dex','wis','int','cha'],
  Bard:      ['cha','dex','con','wis','int','str'],
  Cleric:    ['wis','con','str','cha','dex','int'],
  Druid:     ['wis','con','dex','int','cha','str'],
  Fighter:   ['str','con','dex','wis','int','cha'],
  Monk:      ['dex','wis','con','str','int','cha'],
  Paladin:   ['str','cha','con','wis','dex','int'],
  Ranger:    ['dex','wis','con','str','int','cha'],
  Rogue:     ['dex','cha','int','con','wis','str'],
  Sorcerer:  ['cha','con','dex','wis','int','str'],
  Warlock:   ['cha','con','dex','wis','int','str'],
  Wizard:    ['int','con','dex','wis','cha','str'],
  Artificer: ['int','con','dex','wis','cha','str'],
};
const RCG_EQUIP={Barbarian:'Greataxe, 2 handaxes, explorer\'s pack, 4 javelins',Bard:'Rapier, diplomat\'s pack, lute, leather armor, dagger',Cleric:'Mace, scale mail, shield, holy symbol, priest\'s pack',Druid:'Wooden shield, scimitar, leather armor, explorer\'s pack, druidic focus',Fighter:'Chain mail, longsword, shield, light crossbow, dungeoneer\'s pack',Monk:'Shortsword, dungeoneer\'s pack, 10 darts',Paladin:'Longsword, shield, 5 javelins, priest\'s pack, holy symbol',Ranger:'Scale mail, 2 shortswords, explorer\'s pack, longbow, 20 arrows',Rogue:'Rapier, shortbow, burglar\'s pack, leather armor, 2 daggers, thieves\' tools',Sorcerer:'Light crossbow, 20 bolts, component pouch, dungeoneer\'s pack, 2 daggers',Warlock:'Light crossbow, 20 bolts, component pouch, scholar\'s pack, leather armor, 2 daggers',Wizard:'Quarterstaff, component pouch, scholar\'s pack, spellbook',Artificer:'Light crossbow, 20 bolts, thieves\' tools, dungeoneer\'s pack'};
const RCG_HIT_DIE={Barbarian:12,Fighter:10,Paladin:10,Ranger:10,Bard:8,Cleric:8,Druid:8,Monk:8,Rogue:8,Warlock:8,Sorcerer:6,Wizard:6,Artificer:8};
const RCG_NAME_PRE=['Aer','Bran','Cal','Dar','Eld','Fal','Gor','Hel','Ith','Jor','Kal','Lir','Myr','Nor','Ost','Pyr','Ran','Ser','Thal','Urn','Val','Wen','Xan','Yor','Zar','Adr','Bel','Cor','Dev','Fen'];
const RCG_NAME_SUF=['an','en','in','on','us','ar','er','ir','or','ax','ex','as','es','is','os','ald','eld','orn','ath','eth','ith','ara','ira','ona','una'];

function generateRandomCharacter(){
  const rand=arr=>arr[Math.floor(Math.random()*arr.length)];
  const roll4d6=()=>{const d=[rollDie(6),rollDie(6),rollDie(6),rollDie(6)].sort((a,b)=>b-a);return d[0]+d[1]+d[2];};
  const race=rand(RCG_RACES);
  const cls=rand(RCG_CLASSES);
  const bg=rand(RCG_BACKGROUNDS);
  const align=rand(RCG_ALIGN);
  const name=rand(RCG_NAME_PRE)+rand(RCG_NAME_SUF);
  const raceData=RCG_RACE_DATA[race]||{asi:{},speed:30};
  const bonuses=raceData.asi||{};
  const priority=RCG_STAT_PRIORITY[cls]||['str','dex','con','int','wis','cha'];
  // Roll 6 values, assign highest → primary stat priority
  const rolls=[roll4d6(),roll4d6(),roll4d6(),roll4d6(),roll4d6(),roll4d6()].sort((a,b)=>b-a);
  const raw={};
  priority.forEach((stat,i)=>{raw[stat]=rolls[i]||8;});
  const stats={};
  ['str','dex','con','int','wis','cha'].forEach(s=>{
    stats[s]=Math.min(20,(raw[s]||8)+(bonuses[s]||0));
  });
  const hd=RCG_HIT_DIE[cls]||8;
  const conMod=Math.floor((stats.con-10)/2);
  const maxHp=hd+conMod;
  const dexMod=Math.floor((stats.dex-10)/2);
  const char={
    id:Date.now(),type:state.currentCharType||'player',name,race,class:cls,subclass:'',level:1,background:bg,alignment:align,
    ...stats,hp:maxHp,maxHp,ac:10+dexMod,speed:raceData.speed||30,profBonus:2,initiative:dexMod,
    skills:[],equipment:RCG_EQUIP[cls]||'',charEquipItems:[],charFeats:[],
    features:'',spellsKnown:'',spellSlots:'',backstory:name+' is a '+race+' '+cls+' with a '+bg+' background.',
  };
  state.characters.push(char);
  state.activeCharIdx=state.characters.length-1;
  renderCharList();renderCharSheet(state.characters[state.activeCharIdx]);save();
  const toast=document.createElement('div');
  toast.style.cssText='position:fixed;bottom:1.5rem;right:1.5rem;background:var(--panel);border:1px solid var(--gold);color:var(--gold3);font-family:Cinzel,serif;font-size:.75rem;padding:.65rem 1.2rem;z-index:9999;border-radius:2px;box-shadow:0 4px 20px rgba(0,0,0,.7);';
  toast.textContent='🎲 '+name+' the '+race+' '+cls+' has been created!';
  document.body.appendChild(toast);setTimeout(()=>toast.remove(),3000);
}

// ===== COMPREHENSIVE SUBCLASS DATA (SRD + Non-SRD) =====
// Used to supplement the Open5e API which only has SRD subclasses
const ALL_SUBCLASSES={
  Barbarian:[
    {name:'Path of the Berserker',desc:'Frenzied rage, bonus attacks and mindless frenzy at the cost of exhaustion.'},
    {name:'Path of the Totem Warrior',desc:'Spirit animal totem grants magical boons — Bear, Eagle, Wolf, Elk, or Tiger.'},
    {name:'Path of the Ancestral Guardian',desc:'Spectral ancestors protect your allies and distract your foes.'},
    {name:'Path of the Battlerager',desc:'Spiked armor becomes a weapon. Dwarf-only in most settings.'},
    {name:'Path of the Beast',desc:'Unleash an inner beast — claws, bite, tail. Gain bestial transformation features.'},
    {name:'Path of Wild Magic',desc:'Rage triggers surges of wild magic. Roll on a wild surge table each rage.'},
    {name:'Path of the Zealot',desc:'Divine fury channels deity power — radiant/necrotic damage and resurrection boons.'},
    {name:'Path of the Storm Herald',desc:'Rage creates an aura of arctic, desert, or sea storm effects.'},
    {name:'Path of Giants',desc:'Speak Giant, hurl weapons, grow to Large size during rage.'},
    {name:'Path of the Depths',desc:'Aquatic fury — water breath, swim speed, tentacle attacks.'},
  ],
  Bard:[
    {name:'College of Lore',desc:'Additional Magical Secrets, Cutting Words to reduce enemy rolls.'},
    {name:'College of Valor',desc:'Combat inspiration, medium armor and shields, extra attack.'},
    {name:'College of Glamour',desc:'Enchanting presence — Mantle of Inspiration, charm effects from the Feywild.'},
    {name:'College of Swords',desc:'Fighting style, Blade Flourish — Defensive, Slashing, Mobile flourishes.'},
    {name:'College of Whispers',desc:'Psychic blades, shadow lore to impersonate, steal shadow.'},
    {name:'College of Creation',desc:'Note of Potential, Animating Performance — bring objects to life.'},
    {name:'College of Eloquence',desc:'Universal Speech, Unfailing Inspiration, powerful Cutting Words.'},
    {name:'College of Spirits',desc:'Tales from Beyond — channel spirits through a focus for random effects.'},
    {name:'College of Tragedy',desc:'Performance of Grief, Poetry in Misery — inspiration through sadness.'},
  ],
  Cleric:[
    {name:'Knowledge Domain',desc:'Blessings of Knowledge, Channel Divinity: Read Thoughts, Visions of the Past.'},
    {name:'Life Domain',desc:'Disciple of Life, Preserve Life, Supreme Healing.'},
    {name:'Light Domain',desc:'Radiance of the Dawn, Warding Flare, Corona of Light.'},
    {name:'Nature Domain',desc:'Acolyte of Nature, Dampen Elements, Master of Nature.'},
    {name:'Tempest Domain',desc:'Destructive Wrath, Thunderbolt Strike, Storm Born.'},
    {name:'Trickery Domain',desc:'Invoke Duplicity, Cloak of Shadows, Divine Strike with poison.'},
    {name:'War Domain',desc:'War Priest, Channel Divinity: Guided Strike, Avatar of Battle.'},
    {name:'Arcana Domain',desc:'Arcane Initiate, Channel Divinity: Arcane Abjuration, Spell Breaker.'},
    {name:'Death Domain',desc:'Reaper, Channel Divinity: Touch of Death, Improved Reaper.'},
    {name:'Forge Domain',desc:'Blessing of the Forge, Channel Divinity: Artisan\'s Blessing, Soul of the Forge.'},
    {name:'Grave Domain',desc:'Circle of Mortality, Sentinel at Death\'s Door, Keeper of Souls.'},
    {name:'Order Domain',desc:'Voice of Authority, Channel Divinity: Order\'s Demand, Order\'s Wrath.'},
    {name:'Peace Domain',desc:'Emboldening Bond, Channel Divinity: Balm of Peace, Protective Bond.'},
    {name:'Twilight Domain',desc:'Twilight Sanctuary, Steps of Night, Twilight Shroud.'},
    {name:'Unity Domain',desc:'Shared Burden, Channel Divinity: Shared Solace (Ravnica).'},
  ],
  Druid:[
    {name:'Circle of the Land',desc:'Land types grant bonus spells: Arctic, Coast, Desert, Forest, Grassland, Mountain, Swamp, Underdark.'},
    {name:'Circle of the Moon',desc:'Combat Wild Shape, elemental forms, powerful beast CR scaling.'},
    {name:'Circle of Dreams',desc:'Balm of the Summer Court, Hearth of Moonlight and Shadow, Walker in Dreams.'},
    {name:'Circle of the Shepherd',desc:'Spirit Totem (Bear, Hawk, Unicorn), Faithful Summons, Guardian Spirit.'},
    {name:'Circle of Spores',desc:'Halo of Spores, Symbiotic Entity, Spreading Spores, Fungal Body.'},
    {name:'Circle of Stars',desc:'Star Map, Starry Form (Archer, Chalice, Dragon), Twinkling Constellations.'},
    {name:'Circle of Wildfire',desc:'Wildfire Spirit, Enhanced Bond, Blazing Revival, Cauterizing Flames.'},
    {name:'Circle of the Ascendant Dragon',desc:'Draconic Wild Shape, elemental damage options, dragon features.'},
    {name:'Circle of the Isle',desc:'Aquatic wild shapes, swimming, coastal magic.'},
    {name:'Circle of the Primeval',desc:'Titanic Beast — dinosaur wild shapes, increased CR cap.'},
  ],
  Fighter:[
    {name:'Champion',desc:'Improved Critical (19-20), Remarkable Athlete, Additional Fighting Style.'},
    {name:'Battle Master',desc:'Maneuvers using Superiority Dice — 16 tactical options.'},
    {name:'Eldritch Knight',desc:'Spellcasting (Abjuration/Evocation), War Magic, Eldritch Strike.'},
    {name:'Arcane Archer',desc:'Arcane Shot options — Banishing Arrow, Grasping Arrow, Shadow Arrow, etc.'},
    {name:'Cavalier',desc:'Mounted Combatant focus — Unwavering Mark, Hold the Line, Ferocious Charge.'},
    {name:'Echo Knight',desc:'Manifest Echo, Legion of One, Unleash Incarnation. (Explorer\'s Guide)'},
    {name:'Psi Warrior',desc:'Psionic Power, Telekinetic Adept, Guarded Mind. (Tasha\'s)'},
    {name:'Rune Knight',desc:'Rune Carving — Cloud Rune, Fire Rune, Stone Rune, etc., Giant form.'},
    {name:'Samurai',desc:'Fighting Spirit, Elegant Courtier, Strength Before Death.'},
    {name:'Banneret (Purple Dragon Knight)',desc:'Rallying Cry, Royal Envoy, Bulwark.'},
  ],
  Monk:[
    {name:'Way of the Open Hand',desc:'Open Hand Technique — knock prone, push, prevent reactions. Wholeness of Body.'},
    {name:'Way of Shadow',desc:'Shadow Arts spellcasting, Shadow Step teleportation, Cloak of Shadows.'},
    {name:'Way of the Four Elements',desc:'Elemental Disciplines — fire, water, earth, air abilities costing ki.'},
    {name:'Way of the Astral Self',desc:'Astral Arms, Body, and Visage — Wisdom-based attacks.'},
    {name:'Way of the Drunken Master',desc:'Drunken Technique, Tipsy Sway, Drunkard\'s Luck, Intoxicated Frenzy.'},
    {name:'Way of the Kensei',desc:'Kensei Weapons, One with the Blade, Sharpen the Blade, Unerring Accuracy.'},
    {name:'Way of the Long Death',desc:'Touch of Death, Hour of Reaping, Mastery of Death.'},
    {name:'Way of Mercy',desc:'Hands of Healing and Harm, Physician\'s Touch, Flurry of Healing and Harm.'},
    {name:'Way of the Sun Soul',desc:'Radiant Sun Bolt, Searing Arc Strike, Searing Sunburst.'},
    {name:'Way of the Ascendant Dragon',desc:'Draconic Disciple, Dragon Wings, Aspect of the Wyrm, Draconic Presence.'},
    {name:'Way of the Cobalt Soul',desc:'Extract Aspects, Extort Truth, Mind of Mercury. (Critical Role)'},
  ],
  Paladin:[
    {name:'Oath of Devotion',desc:'Sacred Weapon, Aura of Devotion, Holy Nimbus.'},
    {name:'Oath of the Ancients',desc:'Nature\'s Wrath, Aura of Warding, Undying Sentinel.'},
    {name:'Oath of Vengeance',desc:'Vow of Enmity, Relentless Avenger, Soul of Vengeance, Avenging Angel.'},
    {name:'Oath of Conquest',desc:'Conquering Presence, Guided Strike, Aura of Conquest, Scornful Rebuke.'},
    {name:'Oath of the Crown',desc:'Champion Challenge, Turn the Tide, Unyielding Saint.'},
    {name:'Oath of Glory',desc:'Inspiring Smite, Aura of Alacrity, Glorious Defense, Living Legend.'},
    {name:'Oath of Redemption',desc:'Emissary of Peace, Protective Spirit, Emissary of Redemption.'},
    {name:'Oath of the Watchers',desc:'Abjure the Extraplanar, Vigilant Rebuke, Mortal Bulwark.'},
    {name:'Oathbreaker',desc:'Broken oath — Control Undead, Aura of Hate, Dread Lord.'},
    {name:'Oath of Treachery',desc:'Poison Strike, Aura of Treachery (Unearthed Arcana).'},
  ],
  Ranger:[
    {name:'Hunter',desc:'Hunter\'s Prey — Colossus Slayer, Giant Killer, Horde Breaker. Defensive Tactics.'},
    {name:'Beast Master',desc:'Ranger\'s Companion — a beast that fights beside you.'},
    {name:'Gloom Stalker',desc:'Dread Ambusher, Stalker\'s Flurry, Shadowy Dodge. Underdark specialist.'},
    {name:'Horizon Walker',desc:'Ethereal Step, Distant Strike, Spectral Defense. Planar hunter.'},
    {name:'Monster Slayer',desc:'Hunter\'s Sense, Slayer\'s Prey, Supernatural Defense, Slayer\'s Counter.'},
    {name:'Drake Warden',desc:'Drake Companion — bond with a drake that grows in power.'},
    {name:'Fey Wanderer',desc:'Dreadful Strikes, Otherworldly Glamour, Beguiling Twist, Misty Wanderer.'},
    {name:'Swarmkeeper',desc:'Gathered Swarm — swarm of spirits assists with attacks and movement.'},
  ],
  Rogue:[
    {name:'Thief',desc:'Fast Hands, Second-Story Work, Supreme Sneak, Use Magic Device, Thief\'s Reflexes.'},
    {name:'Arcane Trickster',desc:'Spellcasting (Enchantment/Illusion), Magical Ambush, Spell Thief.'},
    {name:'Assassin',desc:'Assassinate — always Surprise on first round. Impostor, Death Strike.'},
    {name:'Inquisitive',desc:'Ear for Deceit, Eye for Detail, Insightful Fighting, Steady Eye, Unerring Eye.'},
    {name:'Mastermind',desc:'Master of Intrigue, Master of Tactics (Help as bonus action), Soul of Deceit.'},
    {name:'Phantom',desc:'Whispers of the Dead, Wails from the Grave, Ghost Walk, Death\'s Friend.'},
    {name:'Scout',desc:'Skirmisher, Survivalist, Superior Mobility, Ambush Master, Sudden Strike.'},
    {name:'Soulknife',desc:'Psychic Blades, Soul Blades, Psychic Veil, Rend Mind.'},
    {name:'Swashbuckler',desc:'Fancy Footwork, Rakish Audacity, Panache, Elegant Maneuver, Master Duelist.'},
  ],
  Sorcerer:[
    {name:'Draconic Bloodline',desc:'Dragon Ancestor, Draconic Resilience, Elemental Affinity, Dragon Wings, Draconic Presence.'},
    {name:'Wild Magic',desc:'Wild Magic Surge table, Tides of Chaos, Bend Luck, Controlled Chaos, Spell Bombardment.'},
    {name:'Aberrant Mind',desc:'Psionic Spells, Telepathic Speech, Psionic Sorcery, Revelation in Flesh, Warping Implosion.'},
    {name:'Clockwork Soul',desc:'Restore Balance, Bastion of Law, Trance of Order, Clockwork Cavalcade.'},
    {name:'Divine Soul',desc:'Divine Magic spell access, Favored by the Gods, Empowered Healing, Otherworldly Wings, Unearthly Recovery.'},
    {name:'Shadow Magic',desc:'Eyes of the Dark, Strength of the Grave, Hound of Ill Omen, Shadow Walk, Umbral Form.'},
    {name:'Storm Sorcery',desc:'Wind Speaker, Tempestuous Magic, Heart of the Storm, Storm Guide, Storm\'s Fury, Wind Soul.'},
    {name:'Lunar Sorcery',desc:'Moon Fire, Lunar Embodiment, Lunar Boons, Waxing and Waning phases.'},
  ],
  Warlock:[
    {name:'The Archfey',desc:'Fey Presence, Misty Escape, Beguiling Defenses, Dark Delirium.'},
    {name:'The Fiend',desc:'Dark One\'s Blessing, Dark One\'s Own Luck, Fiendish Resilience, Hurl Through Hell.'},
    {name:'The Great Old One',desc:'Awakened Mind, Entropic Ward, Thought Shield, Create Thrall.'},
    {name:'The Celestial',desc:'Bonus Cantrips, Healing Light, Radiant Soul, Celestial Resilience, Searing Vengeance.'},
    {name:'The Fathomless',desc:'Tentacle of the Deeps, Gift of the Sea, Oceanic Soul, Guardian Coil, Grasping Tentacles.'},
    {name:'The Genie',desc:'Genie\'s Vessel — Dao, Djinni, Efreeti, or Marid. Bottled Respite, Genie\'s Wrath.'},
    {name:'The Hexblade',desc:'Hexblade\'s Curse, Hex Warrior, Accursed Specter, Armor of Hexes, Master of Hexes.'},
    {name:'The Undead',desc:'Form of Dread, Grave Touched, Necrotic Husk, Spirit Projection.'},
    {name:'The Undying',desc:'Among the Dead, Defy Death, Undying Nature, Indestructible Life.'},
    {name:'The Seeker',desc:'Seeker\'s Speech, Astral Refuge, Far Wanderer, Astral Sequestration (UA).'},
  ],
  Wizard:[
    {name:'School of Abjuration',desc:'Abjuration Savant, Arcane Ward, Projected Ward, Improved Abjuration, Spell Resistance.'},
    {name:'School of Conjuration',desc:'Conjuration Savant, Minor Conjuration, Benign Transposition, Focused Conjuration, Durable Summons.'},
    {name:'School of Divination',desc:'Divination Savant, Portent (2 dice), Expert Divination, The Third Eye, Greater Portent.'},
    {name:'School of Enchantment',desc:'Enchantment Savant, Hypnotic Gaze, Instinctive Charm, Split Enchantment, Alter Memories.'},
    {name:'School of Evocation',desc:'Evocation Savant, Sculpt Spells, Potent Cantrip, Empowered Evocation, Overchannel.'},
    {name:'School of Illusion',desc:'Illusion Savant, Improved Minor Illusion, Malleable Illusions, Illusory Self, Illusory Reality.'},
    {name:'School of Necromancy',desc:'Necromancy Savant, Grim Harvest, Undead Thralls, Inured to Undeath, Command Undead.'},
    {name:'School of Transmutation',desc:'Transmutation Savant, Minor Alchemy, Transmuter\'s Stone, Shapechanger, Master Transmuter.'},
    {name:'Bladesinging',desc:'Bladesong (AC, speed, concentration bonus), Extra Attack, Song of Defense, Song of Victory.'},
    {name:'Chronurgy Magic',desc:'Chronal Shift, Temporal Awareness, Momentary Stasis, Convergent Future.'},
    {name:'Graviturgy Magic',desc:'Adjust Density, Gravity Well, Violent Attraction, Event Horizon.'},
    {name:'Order of Scribes',desc:'Awakened Spellbook, Manifest Mind, Master Scrivener, One with the Word.'},
    {name:'War Magic',desc:'Arcane Deflection, Tactical Wit, Power Surge, Durable Magic, Deflecting Shroud.'},
  ],
  Artificer:[
    {name:'Alchemist',desc:'Experimental Elixir (6 random effects each day), Alchemical Savant, Restorative Reagents, Chemical Mastery.'},
    {name:'Armorer',desc:'Arcane Armor (Guardian or Infiltrator mode), Armor Modifications, Perfected Armor.'},
    {name:'Artillerist',desc:'Eldritch Cannon (Flamethrower, Force Ballista, Protector), Arcane Firearm, Fortified Position.'},
    {name:'Battle Smith',desc:'Battle Ready, Steel Defender construct companion, Arcane Jolt, Improved Defender.'},
  ],
};


// ===== SESSION SETUP =====
const campId=sessionStorage.getItem('grimoire-active-camp');
const campName=sessionStorage.getItem('grimoire-active-camp-name');
const activeUser=sessionStorage.getItem('grimoire-active-user');
if(!campId){window.location.href='index.html';}
document.getElementById('header-camp-name').textContent=campName||'Unknown Campaign';
document.getElementById('dash-camp-label').textContent=campName||'';
function goHome(){window.location.href='index.html';}
function getKey(){return'grimoire-camp-'+campId;}

let state={characters:[],monsters:[],spells:[],customSpells:[],notes:[],combatants:[],currentRound:1,currentTurn:0,currentCharType:'player',activeCharIdx:null,activeMonsterIdx:null,activeNoteIdx:null,moodPlaylists:[],campaignInfo:{name:campName||'',session:1,date:'',location:''}};

function save(){
  localStorage.setItem(getKey(),JSON.stringify(state));
  const users=JSON.parse(localStorage.getItem('grimoire-users')||'{}');
  const idx=parseInt(sessionStorage.getItem('grimoire-active-camp-idx'));
  if(activeUser&&users[activeUser]&&users[activeUser].campaigns&&users[activeUser].campaigns[idx]){
    users[activeUser].campaigns[idx].session=state.campaignInfo.session||1;
    users[activeUser].campaigns[idx].characters=state.characters.filter(c=>c.type==='player').length;
    localStorage.setItem('grimoire-users',JSON.stringify(users));
  }
}

function loadState(){
  const raw=localStorage.getItem(getKey());
  if(raw){try{const l=JSON.parse(raw);state={...state,...l};}catch(e){}}
  if(!state.moodPlaylists||!state.moodPlaylists.length)state.moodPlaylists=getDefaultPlaylists();
  if(!state.customSpells)state.customSpells=[];
  renderAll();
}

function renderAll(){
  renderCharList();renderMonsterList();renderNoteList();renderInitiative();renderMoodPlaylists();updateDashboard();renderReferenceContent();
  const ci=state.campaignInfo||{};
  ['campaign-name','campaign-session','campaign-date','campaign-location'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const key=id.replace('campaign-','').replace('-','');
    const map={'name':'name','session':'session','date':'date','location':'location'};
    el.value=ci[key]||ci[id.replace('campaign-','')]||'';
  });
  if(document.getElementById('campaign-session'))document.getElementById('campaign-session').value=ci.session||1;
  if(document.getElementById('campaign-name'))document.getElementById('campaign-name').value=ci.name||campName||'';
  if(document.getElementById('campaign-date'))document.getElementById('campaign-date').value=ci.date||'';
  if(document.getElementById('campaign-location'))document.getElementById('campaign-location').value=ci.location||'';
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  const page=document.getElementById('page-'+id);
  if(page)page.classList.add('active');
  document.querySelectorAll('nav button').forEach(b=>{if(b.getAttribute('onclick')&&b.getAttribute('onclick').includes("'"+id+"'"))b.classList.add('active');});
  if(id==='spells'){renderSpells();renderSpellBackBtn();}
  if(id!=='spells'){const b=document.getElementById('spell-back-btn');if(b&&spellReturnCharIdx===null)b.remove();}
  if(id==='map')setTimeout(()=>mb3Init(),60);
  else{if(MB.raf){cancelAnimationFrame(MB.raf);MB.raf=null;}}
  if(id==='dashboard')updateDashboard();
  if(id==='music')renderAmbientSounds();
  if(id==='reference')renderReferenceContent();
  if(id==='encounter')calcEncounterDifficulty();
  if(id==='initiative'){renderInitiativeV2();updateXPDisplay();}
}

function updateDashboard(){
  document.getElementById('dash-players').textContent=state.characters.filter(c=>c.type==='player').length;
  document.getElementById('dash-monsters').textContent=state.monsters.length;
  document.getElementById('dash-spells').textContent=(state.spells||[]).length+(state.customSpells||[]).length;
  document.getElementById('dash-notes').textContent=state.notes.length;
  document.getElementById('dash-session').textContent=state.campaignInfo?.session||1;
  renderPartyStatus();
  renderCombatStatus();
}

function renderPartyStatus(){
  const el=document.getElementById('dash-party-status');if(!el)return;
  const players=state.characters.filter(c=>c.type==='player');
  if(!players.length){el.innerHTML='<div class="text-dim" style="padding:.8rem;">No player characters yet.</div>';return;}
  el.innerHTML=players.map(c=>{
    const hp=parseInt(c.hp)||0,maxHp=parseInt(c.maxHp)||1;
    const pct=Math.max(0,Math.min(100,hp/maxHp*100));
    const col=pct>50?'var(--green2)':pct>25?'#f39c12':'var(--red2)';
    return`<div style="background:var(--bg3);border:1px solid var(--border);padding:.65rem;border-radius:2px;cursor:pointer;" onclick="showPage('characters');selectChar(${state.characters.indexOf(c)})">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.35rem;">
        <span style="font-family:Cinzel,serif;font-size:.78rem;color:var(--gold3);">${getClassEmoji(c.class)} ${c.name}</span>
        <span style="font-size:.72rem;color:var(--text3);">${c.class||'?'} ${c.level||1}</span>
      </div>
      <div style="display:flex;align-items:center;gap:.4rem;">
        <div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${col};border-radius:3px;transition:width .4s;"></div></div>
        <span style="font-size:.72rem;color:${col};font-family:Cinzel,serif;">${hp}/${maxHp}</span>
      </div>
      <div style="display:flex;gap:.2rem;margin-top:.3rem;flex-wrap:wrap;">
        ${(c.charFeats||[]).map(f=>`<span style="font-size:.58rem;background:rgba(241,196,15,.12);color:#f9e79f;border:1px solid #b7950b;padding:.06rem .3rem;border-radius:2px;">${f.name}</span>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderCombatStatus(){
  const el=document.getElementById('dash-combat-status');if(!el)return;
  if(!state.combatants.length){el.innerHTML='<div class="text-dim" style="text-align:center;padding:1rem;">No active combat</div>';return;}
  const active=state.combatants[state.currentTurn];
  el.innerHTML=`<div style="text-align:center;margin-bottom:.65rem;">
    <div style="font-family:Cinzel,serif;font-size:.68rem;color:var(--text3);">Round ${state.currentRound} — Active Turn</div>
    <div style="font-family:'Cinzel Decorative',cursive;font-size:1.2rem;color:var(--gold2);margin:.2rem 0;">${active?active.name:'—'}</div>
  </div>
  <div style="display:flex;flex-direction:column;gap:.25rem;max-height:140px;overflow-y:auto;">
    ${state.combatants.slice(0,6).map((c,i)=>{
      const pct=Math.max(0,Math.min(100,c.hp/c.maxHp*100));
      return`<div style="display:flex;align-items:center;gap:.4rem;${i===state.currentTurn?'opacity:1':'opacity:.6'}">
        <span style="font-size:.65rem;color:var(--gold);font-family:Cinzel,serif;min-width:18px;">${c.init}</span>
        <span style="font-size:.75rem;flex:1;color:${i===state.currentTurn?'var(--gold2)':'var(--text2)'};">${c.name}</span>
        <div style="width:50px;height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${pct>50?'var(--green2)':pct>25?'#f39c12':'var(--red2)'};"></div></div>
      </div>`;
    }).join('')}
    ${state.combatants.length>6?`<div style="text-align:center;color:var(--text3);font-size:.72rem;">+${state.combatants.length-6} more</div>`:''}
  </div>
  <button class="btn btn-sm mt1" style="width:100%;" onclick="showPage('initiative')">View Full Initiative</button>`;
}

function saveCampaignInfo(){
  state.campaignInfo={name:document.getElementById('campaign-name').value,session:document.getElementById('campaign-session').value,date:document.getElementById('campaign-date').value,location:document.getElementById('campaign-location').value};
  document.getElementById('dash-session').textContent=state.campaignInfo.session||1;
  save();
}

// ===== DICE =====
let rollHistoryArr=[];
function rollDie(s){return Math.floor(Math.random()*s)+1;}
function quickRoll(s){const r=rollDie(s);showResult([r],s,0,'1d'+s);if(s===20){const btns=document.querySelectorAll('.die-btn');btns.forEach(b=>{if(b.textContent.includes('d20')){b.classList.remove('crit','fumble');if(r===20)b.classList.add('crit');else if(r===1)b.classList.add('fumble');setTimeout(()=>b.classList.remove('crit','fumble'),700);}});}}
function setAndRoll(c,s,m,a){document.getElementById('dice-count').value=c;document.getElementById('dice-sides').value=s;document.getElementById('dice-mod').value=m;document.getElementById('dice-adv').value=a;customRoll();}
function customRoll(){
  const count=parseInt(document.getElementById('dice-count').value)||1;
  const sides=parseInt(document.getElementById('dice-sides').value);
  const mod=parseInt(document.getElementById('dice-mod').value)||0;
  const adv=document.getElementById('dice-adv').value;
  let rolls=Array.from({length:count},()=>rollDie(sides));
  let label=count+'d'+sides;
  if(adv!=='none'&&count===1){
    const r2=rollDie(sides);
    const kept=adv==='adv'?Math.max(rolls[0],r2):Math.min(rolls[0],r2);
    const dropped=adv==='adv'?Math.min(rolls[0],r2):Math.max(rolls[0],r2);
    label='d'+sides+' '+(adv==='adv'?'Adv':'Dis')+' ['+kept+', '+dropped+']';
    rolls=[kept];
  }
  if(mod!==0)label+=' '+(mod>=0?'+':'')+mod;
  showResult(rolls,sides,mod,label);
}
function showResult(rolls,sides,mod,label){
  const total=rolls.reduce((a,b)=>a+b,0)+mod;
  const el=document.getElementById('roll-total');
  el.textContent=total;el.classList.remove('rolling');void el.offsetWidth;el.classList.add('rolling');
  el.style.color=sides===20&&rolls.length===1?(rolls[0]===20?'#58d68d':rolls[0]===1?'#e74c3c':'var(--gold2)'):'var(--gold2)';
  document.getElementById('roll-breakdown').textContent='['+rolls.join(', ')+']'+(mod!==0?' '+(mod>=0?'+':'')+mod+' = '+total:'');
  rollHistoryArr.unshift({label,total,time:new Date().toLocaleTimeString()});
  if(rollHistoryArr.length>40)rollHistoryArr.pop();
  renderRollHistory();
}
function renderRollHistory(){
  const el=document.getElementById('roll-history');
  if(!rollHistoryArr.length){el.innerHTML='<div class="text-dim" style="text-align:center;padding:.8rem;">No rolls yet</div>';return;}
  el.innerHTML=rollHistoryArr.map(r=>{const isCrit=r.label.includes('d20')&&r.total===20,isFumble=r.label.includes('d20')&&r.total===1;const col=isCrit?'#58d68d':isFumble?'#c0392b':'var(--gold)';const bg=isCrit?'rgba(88,214,141,.06)':isFumble?'rgba(192,57,43,.06)':'transparent';return'<div style="display:flex;justify-content:space-between;padding:.32rem .38rem;border-bottom:1px solid rgba(74,58,37,.2);font-size:.86rem;color:var(--text2);border-radius:2px;background:'+bg+'"><span style="font-family:Cinzel,serif;font-size:.72rem;">'+r.label+(isCrit?' 🎉':isFumble?' 💀':'')+'</span><span style="color:var(--text3);font-size:.7rem;">'+r.time+'</span><span style="color:'+col+';font-weight:700;font-family:\'Cinzel Decorative\',cursive;">'+r.total+'</span></div>';}).join('');
}

// ===== INITIATIVE =====
const CONDITIONS=['Blinded','Charmed','Frightened','Paralyzed','Poisoned','Stunned','Prone','Invisible','Unconscious','Exhausted','Grappled','Petrified','Restrained'];
const COND_CLASS={Blinded:'cond-blinded',Charmed:'cond-charmed',Frightened:'cond-frightened',Paralyzed:'cond-paralyzed',Poisoned:'cond-poisoned',Stunned:'cond-stunned',Prone:'cond-prone',Invisible:'cond-invisible',Unconscious:'cond-unconscious',Exhausted:'cond-exhausted',Grappled:'cond-grappled',Petrified:'cond-petrified',Restrained:'cond-restrained'};

function addCombatant(){
  const name=document.getElementById('init-name').value.trim();if(!name)return alert('Enter a name!');
  const hp=parseInt(document.getElementById('init-hp').value)||10;
  const ac=parseInt(document.getElementById('init-ac').value)||10;
  const initVal=document.getElementById('init-roll').value;
  const init=initVal?parseInt(initVal):rollDie(20);
  const type=document.getElementById('init-type').value;
  state.combatants.push({name,hp,maxHp:hp,ac,init,type,conditions:[],dead:false,usedAction:false,usedBonus:false,usedReact:false,id:Date.now()+Math.random()});
  ['init-name','init-roll','init-hp','init-ac'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('hud-toggle').style.display='block';
  logEvent('turn','➕ '+name+' added to Initiative','log-turn');
  renderInitiative();save();syncCombatantsToMap();
}
function rollInitAll(){state.combatants.forEach(c=>c.init=rollDie(20));sortInitiative();}
function sortInitiative(){state.combatants.sort((a,b)=>{if(b.init!==a.init)return b.init-a.init;// Tie-break: players first, then by name
if(a.type==='player'&&b.type!=='player')return -1;if(b.type==='player'&&a.type!=='player')return 1;return a.name.localeCompare(b.name);});state.currentTurn=0;renderInitiative();save();}
function nextTurn(){
  if(!state.combatants.length)return;
  // Reset actions for combatant who just went
  const prev=state.combatants[state.currentTurn];
  if(prev){prev.usedAction=false;prev.usedBonus=false;prev.usedReact=false;}
  state.currentTurn++;
  if(state.currentTurn>=state.combatants.length){state.currentTurn=0;state.currentRound++;document.getElementById('round-num').textContent=state.currentRound;}
  const active=state.combatants[state.currentTurn];
  logEvent('turn','⏭ '+(active?.name||'—')+' — Round '+state.currentRound,'log-turn');
  renderInitiative();save();
  if(hudOpen)renderHUD();
  if(document.getElementById('page-dashboard')?.classList.contains('active'))renderCombatStatus();
  syncCombatantsToMap();
  if(timerOn)startTimer();
}
function prevTurn(){
  if(!state.combatants.length)return;
  state.currentTurn--;
  if(state.currentTurn<0){state.currentTurn=state.combatants.length-1;if(state.currentRound>1){state.currentRound--;document.getElementById('round-num').textContent=state.currentRound;}}
  renderInitiative();
}
function loadPlayersToInit(){
  state.characters.filter(c=>c.type==='player').forEach(p=>{
    if(!state.combatants.find(c=>c.name===p.name)){
      state.combatants.push({name:p.name,hp:parseInt(p.maxHp)||20,maxHp:parseInt(p.maxHp)||20,ac:parseInt(p.ac)||10,init:rollDie(20),type:'player',conditions:[],dead:false,id:Date.now()+Math.random()});
    }
  });
  renderInitiative();save();
}
function clearCombat(){if(confirm('Clear all combatants?')){state.combatants=[];state.currentRound=1;state.currentTurn=0;document.getElementById('round-num').textContent=1;renderInitiative();save();}}
function dmgHeal(id,isDmg){
  const v=parseInt(document.getElementById('hpi-'+id).value);if(!v)return;
  const com=state.combatants.find(x=>x.id===id);if(!com)return;
  const before=com.hp;
  com.hp=isDmg?Math.max(0,com.hp-v):Math.min(com.maxHp,com.hp+v);
  com.dead=com.hp<=0;
  document.getElementById('hpi-'+id).value='';
  const delta=Math.abs(com.hp-before);
  if(delta>0)logEvent(isDmg?'dmg':'heal',(isDmg?'💥 ':'💚 ')+com.name+' '+(isDmg?'-':'+')+delta+' HP',isDmg?'log-dmg':'log-heal');
  if(com.hp<=0&&before>0)logEvent('kill','☠ '+com.name+' is down!','log-kill');
  if(hudOpen)renderHUD();
  // Update map token border color based on HP
  const tok=MB.tokens.find(t=>t.combatantId===com.id);
  if(tok&&tok.mesh){const ring=tok.mesh.children.find(c=>c.userData.isRing);if(ring){const col=com.hp/com.maxHp>0.5?0xe8b84b:com.hp/com.maxHp>0.25?0xf39c12:0xc0392b;ring.material.color.set(col);ring.material.emissive.set(col);}}
  renderInitiative();save();
}
function toggleCond(id,cond){
  const c=state.combatants.find(x=>x.id===id);if(!c)return;
  if(!c.conditions)c.conditions=[];
  const i=c.conditions.indexOf(cond);
  if(i===-1)c.conditions.push(cond);else c.conditions.splice(i,1);
  renderInitiative();save();
}
function toggleCondActive(cond){
  if(!state.combatants.length)return;
  const c=state.combatants[state.currentTurn];if(!c)return;
  toggleCond(c.id,cond);
}
function removeCombatant(id){state.combatants=state.combatants.filter(c=>c.id!==id);if(state.currentTurn>=state.combatants.length)state.currentTurn=0;renderInitiative();save();}

// renderInitiative defined below (v2 version)

// ===== CHARACTERS =====
function calcMod(s){const m=Math.floor((s-10)/2);return(m>=0?'+':'')+m;}

const SKILLS=[{n:'Acrobatics',s:'dex'},{n:'Animal Handling',s:'wis'},{n:'Arcana',s:'int'},{n:'Athletics',s:'str'},{n:'Deception',s:'cha'},{n:'History',s:'int'},{n:'Insight',s:'wis'},{n:'Intimidation',s:'cha'},{n:'Investigation',s:'int'},{n:'Medicine',s:'wis'},{n:'Nature',s:'int'},{n:'Perception',s:'wis'},{n:'Performance',s:'cha'},{n:'Persuasion',s:'cha'},{n:'Religion',s:'int'},{n:'Sleight of Hand',s:'dex'},{n:'Stealth',s:'dex'},{n:'Survival',s:'wis'}];

function switchCharType(type,btn){state.currentCharType=type;document.querySelectorAll('.type-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.activeCharIdx=null;closeCharFullView();renderCharList();}

function newCharacter(){
  const name=prompt('Character name:');if(!name)return;
  state.characters.push({id:Date.now(),type:state.currentCharType,name,race:'',class:'',subclass:'',level:1,hp:10,maxHp:10,ac:10,speed:30,profBonus:2,initiative:0,str:10,dex:10,con:10,int:10,wis:10,cha:10,skills:[],equipment:'',features:'',spellsKnown:'',spellSlots:'',backstory:'',background:'',alignment:''});
  state.activeCharIdx=state.characters.length-1;renderCharList();renderCharSheet(state.characters[state.activeCharIdx]);save();
}
function deleteCharacter(){if(state.activeCharIdx===null)return alert('Select a character first');if(!confirm('Delete?'))return;state.characters.splice(state.activeCharIdx,1);state.activeCharIdx=null;closeCharFullView();renderCharList();save();}

function renderCharList(){
  const el=document.getElementById('char-list');
  const filtered=state.characters.filter(c=>c.type===state.currentCharType);
  if(!filtered.length){el.innerHTML='<div class="empty-state"><span class="empty-icon">📜</span>No characters yet</div>';return;}
  el.innerHTML=filtered.map(c=>{
    const ri=state.characters.indexOf(c);
    return'<div class="char-item'+(state.activeCharIdx===ri?' active':'')+'" onclick="selectChar('+ri+')">'
      +'<div class="char-avatar">'+getClassEmoji(c.class)+'</div>'
      +'<div class="char-info"><div class="char-name">'+c.name+'</div><div class="char-sub">'+(c.race||'?')+' '+(c.class||'Unknown')+' Lv'+c.level+'</div></div>'
      +'</div>';
  }).join('');
}
function selectChar(idx){state.activeCharIdx=idx;renderCharList();renderCharSheet(state.characters[idx]);}
function closeCharFullView(){
  document.getElementById('char-full-view').style.display='none';
  document.getElementById('char-list-view').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function addCharToInitFromFull(){
  if(state.activeCharIdx===null)return;
  addCharToInit(state.activeCharIdx);
}

function deleteCharFromFull(){
  if(state.activeCharIdx===null)return;
  if(!confirm('Delete this character?'))return;
  state.characters.splice(state.activeCharIdx,1);
  state.activeCharIdx=null;
  save();renderCharList();closeCharFullView();
}
function renderCharSpellSearch(idx){
  const c=state.characters[idx];
  const searchEl=document.getElementById('char-spell-search-'+idx);
  const levelEl=document.getElementById('char-spell-level-'+idx);
  const resultsEl=document.getElementById('char-spell-results-'+idx);
  if(!searchEl||!resultsEl)return;

  const search=searchEl.value.toLowerCase();
  const levelFilter=levelEl?levelEl.value:'';
  const allSpells=[...(state.spells||[]),...(state.customSpells||[])];
  const charSpellNames=(c.spellList||[]).map(s=>s.name);

  if(!allSpells.length){
    resultsEl.innerHTML='<div style="padding:.6rem;color:var(--text3);font-size:.8rem;">No spells loaded — go to the Spells tab and click "Load All SRD Spells" first.</div>';
    return;
  }

  let filtered=allSpells.filter(s=>{
    if(levelFilter&&s.level!==levelFilter)return false;
    if(search&&!s.name.toLowerCase().includes(search))return false;
    return true;
  }).slice(0,40);

  if(!filtered.length){resultsEl.innerHTML='<div style="padding:.6rem;color:var(--text3);font-size:.8rem;">No spells found.</div>';return;}

  resultsEl.innerHTML=filtered.map(s=>{
    const already=charSpellNames.includes(s.name);
    const sc='school-'+(s.school||'').toLowerCase();
    return`<div style="display:flex;align-items:center;justify-content:space-between;padding:.35rem .6rem;border-bottom:1px solid rgba(74,58,37,.25);${already?'opacity:.5':''}">
      <div>
        <span style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--gold3);">${s.name}</span>
        <span class="tag ${sc}" style="margin-left:.35rem;">${s.level}</span>
        <span style="font-size:.72rem;color:var(--text3);margin-left:.3rem;">${s.school||''}</span>
      </div>
      <button onclick="${already?'':'addSpellToChar('+idx+',\''+s.name.replace(/'/g,"\\'")+'\')'}" 
        style="background:${already?'transparent':'var(--gold)'};border:1px solid ${already?'var(--border)':'var(--gold)'};color:${already?'var(--text3)':'#0d0a07'};font-family:'Cinzel',serif;font-size:.6rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:.2rem .55rem;cursor:${already?'default':'pointer'};border-radius:2px;">
        ${already?'Added':'+ Add'}
      </button>
    </div>`;
  }).join('');
}

function addSpellToChar(idx,spellName){
  const c=state.characters[idx];
  if(!c.spellList)c.spellList=[];
  if(c.spellList.find(s=>s.name===spellName))return;
  const allSpells=[...(state.spells||[]),...(state.customSpells||[])];
  const spell=allSpells.find(s=>s.name===spellName);
  if(!spell)return;
  // Ensure level is always a string label
  const levelNames = ["Cantrip","1st","2nd","3rd","4th","5th","6th","7th","8th","9th"];
  let spellLevel = spell.level;
  if (typeof spellLevel === 'number') {
    spellLevel = levelNames[spellLevel] || String(spellLevel);
  }
  // If it's a string but a number (e.g. '1'), convert to label
  if (typeof spellLevel === 'string' && /^[0-9]$/.test(spellLevel)) {
    spellLevel = levelNames[parseInt(spellLevel)] || spellLevel;
  }
  c.spellList.push({
    name: spell.name,
    level: spellLevel,
    school: spell.school,
    castTime: spell.castTime,
    concentration: spell.concentration,
    ritual: spell.ritual
  });
  console.log('DEBUG: spellList after add:', c.spellList);
  save();
  renderCharSheet(c);
}

function removeSpellFromChar(idx,spellName){
  const c=state.characters[idx];
  if(!c.spellList)return;
  c.spellList=c.spellList.filter(s=>s.name!==spellName);
  save();
}
function getClassEmoji(cls){const m={fighter:'⚔',wizard:'🧙',rogue:'🗡',cleric:'✝',druid:'🌿',bard:'🎵',ranger:'🏹',paladin:'🛡',sorcerer:'✨',warlock:'👁',barbarian:'💪',monk:'🥋'};return m[(cls||'').toLowerCase()]||'⚔';}
function updateChar(idx,field,val){state.characters[idx][field]=val;if(field==='hp'||field==='maxHp'){const c=state.characters[idx];const el=document.getElementById('hpbar-'+idx);if(el){const pct=Math.max(0,Math.min(100,parseInt(c.hp)/parseInt(c.maxHp)*100));el.style.width=pct+'%';}}save();}
function toggleSkill(idx,sn,el){const c=state.characters[idx];if(!c.skills)c.skills=[];const i=c.skills.indexOf(sn);if(i===-1){c.skills.push(sn);el.classList.add('on');el.textContent='●';}else{c.skills.splice(i,1);el.classList.remove('on');el.textContent='';}save();}

// HP Calculator
function calcHP(idx) {
  const c = state.characters[idx];
  const cls = (c.class || '').toLowerCase();
  const race = (c.race || '').toLowerCase();
  const feats = (c.features || '').toLowerCase();
  const hitDie = {
    barbarian: 12, fighter: 10, paladin: 10, ranger: 10,
    bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
    sorcerer: 6, wizard: 6
  };
  const hd = hitDie[cls] || 8;
  const lvl = parseInt(c.level) || 1;
  const conMod = Math.floor(((parseInt(c.con) || 10) - 10) / 2); // ← fixed

  let perLevelBonus = 0;
  if (race.includes('hill dwarf')) perLevelBonus += 1;
  if (feats.includes('tough')) perLevelBonus += 2;

  // Level 1: max hit die + con mod + per-level bonuses
  // Level 2+: floor(hd/2)+1 per level + con mod + per-level bonuses
  const avg = Math.floor(hd / 2) + 1;
  let maxHpCalc = (hd + conMod + perLevelBonus)
                + (lvl - 1) * (avg + conMod + perLevelBonus);

  const el = document.getElementById('hpcalc-result-' + idx);
  if (el) {
    let details = '(' + (cls || '?') + ', d' + hd + ', ' + lvl + ' lvl, Con ' + calcMod(parseInt(c.con) || 10);
    if (race.includes('hill dwarf')) details += ', Hill Dwarf';
    if (feats.includes('tough')) details += ', Tough';
    details += ')';
    el.textContent = 'Suggested Max HP: ' + maxHpCalc + ' ' + details;
  }

  state.characters[idx].maxHp = maxHpCalc;
  const hpIn = document.getElementById('maxhp-input-' + idx);
  if (hpIn) hpIn.value = maxHpCalc;
  save();
}

function renderCharSheet(c){
  const idx=state.characters.indexOf(c);
  const hpPct=Math.max(0,Math.min(100,(parseInt(c.hp)||0)/(parseInt(c.maxHp)||1)*100));
  const abils=['str','dex','con','int','wis','cha'];
  const abilNames={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma'};

  // Switch to full view
  expandedCharSpell=null;
  document.getElementById('char-list-view').style.display='none';
  document.getElementById('char-full-view').style.display='block';

  document.getElementById('char-full-content').innerHTML=`
  <div style="max-width:1000px;margin:0 auto;">

    <!-- HEADER BAND -->
    <div style="background:linear-gradient(135deg,#0a0d1a,var(--panel));border:1px solid var(--gold);border-left:6px solid var(--gold);padding:1.5rem 2rem;margin-bottom:1.5rem;display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;">
      <!-- Avatar / Portrait -->
      <div style="flex:0 0 130px;">
        <div style="width:130px;height:130px;background:var(--bg3);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:3.5rem;overflow:hidden;margin-bottom:.5rem;" id="char-portrait-${idx}">
          ${c.portrait?`<img src="${c.portrait}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.innerHTML='⚔'">`:(getClassEmoji(c.class)||'⚔')}
        </div>
        <input placeholder="Portrait URL..." value="${c.portrait||''}" style="font-size:.7rem;padding:.28rem .45rem;" oninput="updateChar(${idx},'portrait',this.value);const p=document.getElementById('char-portrait-${idx}');p.innerHTML=this.value?'<img src=\\''+this.value+'\\' style=\\'width:100%;height:100%;object-fit:cover;\\'>':(getClassEmoji('${c.class}')||'⚔')">
      </div>

      <!-- Name + class + meta -->
      <div style="flex:1;min-width:220px;">
        <input value="${c.name}" style="font-family:'Cinzel Decorative',cursive;font-size:1.9rem;background:transparent;border:none;border-bottom:2px solid var(--gold);color:var(--gold2);width:100%;padding:.2rem 0;margin-bottom:.6rem;" oninput="updateChar(${idx},'name',this.value);renderCharList()">
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem;">
          <div style="flex:1;min-width:90px;"><label>Race ${c.raceSlug?`<span class="lib-chip-field-badge" onclick="searchLibraryForItem('${c.race}','race')" title="Open in Library">🔍</span>`:''}</label><input value="${c.race||''}" oninput="updateChar(${idx},'race',this.value)"></div>
          <div style="flex:1;min-width:90px;"><label>Class ${c.classSlug?`<span class="lib-chip-field-badge" onclick="searchLibraryForItem('${c.class}','class')" title="Open in Library">🔍</span>`:''}</label><input value="${c.class||''}" oninput="updateChar(${idx},'class',this.value)"></div>
          <div style="flex:1;min-width:90px;"><label>Subclass ${c.subclassSlug?`<span class="lib-chip-field-badge" onclick="searchLibraryForItem('${c.subclass}','subclass')" title="Open in Library">🔍</span>`:''}</label><input value="${c.subclass||''}" oninput="updateChar(${idx},'subclass',this.value)"></div>
          <div style="flex:0 0 70px;"><label>Level</label><input type="number" value="${c.level||1}" min="1" max="20" oninput="updateChar(${idx},'level',this.value)"></div>
          <div style="flex:1;min-width:90px;"><label>Background ${c.backgroundSlug?`<span class="lib-chip-field-badge" onclick="searchLibraryForItem('${c.background}','background')" title="Open in Library">🔍</span>`:''}</label><input value="${c.background||''}" oninput="updateChar(${idx},'background',this.value)"></div>
          <div style="flex:1;min-width:100px;"><label>Alignment</label><input value="${c.alignment||''}" oninput="updateChar(${idx},'alignment',this.value)"></div>
        </div>

        <!-- HP + AC + key stats row -->
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:.5rem;">
          <div style="background:rgba(192,57,43,.12);border:1px solid var(--red2);padding:.5rem .3rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:1px;text-transform:uppercase;color:var(--red2);margin-bottom:.15rem;">Current HP</div>
            <input type="number" value="${c.hp||0}" oninput="updateChar(${idx},'hp',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--red2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(192,57,43,.08);border:1px solid var(--border);padding:.5rem .3rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:.15rem;">Max HP</div>
            <input id="maxhp-input-${idx}" type="number" value="${c.maxHp||10}" oninput="updateChar(${idx},'maxHp',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(201,146,42,.1);border:1px solid var(--gold);padding:.5rem .3rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:1px;text-transform:uppercase;color:var(--gold);margin-bottom:.15rem;">AC</div>
            <input type="number" value="${c.ac||10}" oninput="updateChar(${idx},'ac',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(61,155,82,.1);border:1px solid var(--green2);padding:.5rem .3rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:1px;text-transform:uppercase;color:var(--green2);margin-bottom:.15rem;">Speed</div>
            <input type="number" value="${c.speed||30}" oninput="updateChar(${idx},'speed',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(155,89,182,.1);border:1px solid var(--accent);padding:.5rem .3rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:1px;text-transform:uppercase;color:#c678e0;margin-bottom:.15rem;">Prof Bonus</div>
            <input type="number" value="${c.profBonus||2}" oninput="updateChar(${idx},'profBonus',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(201,146,42,.08);border:1px solid var(--border);padding:.5rem .3rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:.15rem;">Initiative</div>
            <input type="number" value="${c.initiative||0}" oninput="updateChar(${idx},'initiative',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
          </div>
        </div>

        <!-- HP bar -->
        <div style="margin-top:.65rem;">
          <div class="hp-bar" style="height:10px;">
            <div class="hp-fill" id="hpbar-${idx}" style="width:${hpPct}%;background:${hpPct>50?'linear-gradient(90deg,var(--green),var(--green2))':hpPct>25?'linear-gradient(90deg,#b7950b,#f39c12)':'linear-gradient(90deg,var(--red),var(--red2))'}"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- HP CALCULATOR -->
    <div style="background:var(--panel);border:1px solid var(--border);border-left:4px solid var(--green2);padding:1rem 1.5rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
      <div>
        <div style="font-family:'Cinzel',serif;font-size:.7rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--green2);margin-bottom:.2rem;">⚡ HP Calculator</div>
        <div style="font-size:.82rem;color:var(--text3);">Set class, level & CON first</div>
      </div>
      <button class="btn btn-green btn-sm" onclick="calcHP(${idx})">Calculate Max HP</button>
      <div id="hpcalc-result-${idx}" style="color:var(--green2);font-family:'Cinzel',serif;font-size:.88rem;"></div>
    </div>

    <!-- ABILITY SCORES -->
    <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;margin-bottom:1.25rem;">
      <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Ability Scores</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:.75rem;">
        ${abils.map(a=>`
          <div style="text-align:center;">
            <div style="font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:.35rem;">${abilNames[a]}</div>
            <div style="background:var(--bg3);border:2px solid var(--border);border-top:3px solid var(--gold);padding:.65rem .25rem;">
              <input type="number" value="${c[a]||10}" min="1" max="30" oninput="updateChar(${idx},'${a}',this.value);this.nextElementSibling.textContent='('+calcMod(parseInt(this.value||10))+')';" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
              <div style="font-family:'Cinzel',serif;font-size:.85rem;color:var(--text2);margin-top:.2rem;">(${calcMod(c[a]||10)})</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- SKILLS + EQUIPMENT -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
      <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:.85rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Skills</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.15rem;">
          ${SKILLS.map(sk=>{
            const hasP=(c.skills||[]).includes(sk.n);
            const mod=Math.floor((parseInt(c[sk.s]||10)-10)/2)+(hasP?parseInt(c.profBonus||2):0);
            return`<div class="skill-row">
              <div class="skill-check${hasP?' on':''}" onclick="toggleSkill(${idx},'${sk.n}',this)">${hasP?'●':''}</div>
              <span class="skill-mod">${mod>=0?'+':''}${mod}</span>
              <span class="skill-name">${sk.n}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:1rem;">
        <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;flex:1;">
          <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">Equipment & Inventory<span style="font-size:.6rem;font-weight:400;color:var(--text3);text-transform:none;letter-spacing:0;">Library items clickable</span></div>
          <!-- Library-linked equipment chips -->
          <div class="char-linked-chips" id="equip-chips-${idx}">
            ${(c.charEquipItems||[]).map(it=>`<div class="lib-chip"><span class="lc-name" onclick="searchLibraryForItem('${it.name.replace(/'/g,"\\'")}','${it.type||'item'}')" title="Open in Library">🔗 ${it.name}</span><button class="lc-remove" onclick="removeCharEquipItem(${idx},'${it.name.replace(/'/g,"\\'")}')">✕</button></div>`).join('')}
          </div>
          <textarea rows="5" style="resize:vertical;line-height:1.65;" oninput="updateChar(${idx},'equipment',this.value)" placeholder="Type items here, or add from Library...">${c.equipment||''}</textarea>
        </div>
        <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;flex:1;">
          <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">Features & Traits<span style="font-size:.6rem;font-weight:400;color:var(--text3);text-transform:none;letter-spacing:0;">Library feats clickable</span></div>
          <!-- Library-linked feat chips -->
          <div class="char-linked-chips" id="feat-chips-${idx}">
            ${(c.charFeats||[]).map(ft=>`<div class="lib-chip"><span class="lc-name" onclick="searchLibraryForItem('${ft.name.replace(/'/g,"\\'")}','feat')" title="Open in Library">⭐ ${ft.name}</span><button class="lc-remove" onclick="removeCharFeat(${idx},'${ft.name.replace(/'/g,"\\'")}')">✕</button></div>`).join('')}
          </div>
          <textarea rows="5" style="resize:vertical;line-height:1.65;" oninput="updateChar(${idx},'features',this.value)" placeholder="Darkvision, Rage, Sneak Attack, or add Feats from Library...">${c.features||''}</textarea>
        </div>
      </div>
    </div>

    <!-- SPELLS + BACKSTORY -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
    <div style="background:var(--panel);border:1px solid var(--border);border-top:3px solid #c678e0;padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c678e0;margin-bottom:.85rem;padding-bottom:.4rem;border-bottom:1px solid #7d3c98;">✨ Spells</div>

        <!-- SPELL SLOT TRACKER -->
        <div style="margin-bottom:1.1rem;">
          <div style="font-family:'Cinzel',serif;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);margin-bottom:.5rem;">Spell Slots</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;">
            ${[1,2,3,4,5,6,7,8,9].map(lvl=>{
              const key='slots_'+lvl;
              const usedKey='slots_used_'+lvl;
              const total=parseInt(c[key]||0);
              const used=parseInt(c[usedKey]||0);
              const remaining=Math.max(0,total-used);
              const levelLabel=['1st','2nd','3rd','4th','5th','6th','7th','8th','9th'][lvl-1];
              return`<div style="background:var(--bg3);border:1px solid ${total>0?'var(--accent)':'var(--border)'};padding:.45rem .5rem;border-radius:2px;">
                <div style="font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:1px;text-transform:uppercase;color:${total>0?'#c678e0':'var(--text3)'};margin-bottom:.3rem;">${levelLabel}</div>
                <div style="display:flex;align-items:center;gap:.3rem;">
                  <input type="number" value="${total}" min="0" max="9" oninput="updateChar(${idx},'${key}',this.value);renderCharSheet(state.characters[${idx}])" style="width:36px;padding:.18rem .22rem;font-size:.82rem;text-align:center;background:transparent;border:1px solid var(--border);color:var(--gold2);">
                  <span style="color:var(--text3);font-size:.7rem;">total</span>
                </div>
                <div style="display:flex;align-items:center;gap:.3rem;margin-top:.25rem;">
                  <button onclick="updateChar(${idx},'${usedKey}',Math.min(${total},parseInt(state.characters[${idx}]['${usedKey}']||0)+1));renderCharSheet(state.characters[${idx}])" style="background:var(--red);border:none;color:var(--text);width:20px;height:20px;cursor:pointer;font-size:.75rem;border-radius:2px;">−</button>
                  <span style="font-family:'Cinzel Decorative',cursive;font-size:.95rem;color:${remaining>0?'var(--green2)':'var(--red2)'};min-width:16px;text-align:center;">${remaining}</span>
                  <button onclick="updateChar(${idx},'${usedKey}',Math.max(0,parseInt(state.characters[${idx}]['${usedKey}']||0)-1));renderCharSheet(state.characters[${idx}])" style="background:var(--green);border:none;color:var(--text);width:20px;height:20px;cursor:pointer;font-size:.75rem;border-radius:2px;">+</button>
                  <span style="color:var(--text3);font-size:.7rem;">left</span>
                </div>
                ${total>0?`<div style="display:flex;gap:2px;margin-top:.3rem;flex-wrap:wrap;">${Array.from({length:total},(_,i)=>'<div style="width:10px;height:10px;border-radius:50%;background:'+(i<remaining?'var(--accent)':'var(--bg2)')+'border:1px solid var(--accent);"></div>').join('')}</div>`:''}
              </div>`;
            }).join('')}
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-top:.5rem;" onclick="[1,2,3,4,5,6,7,8,9].forEach(l=>updateChar(${idx},'slots_used_'+l,0));renderCharSheet(state.characters[${idx}])">🔄 Long Rest — Reset All Slots</button>
        </div>

        <!-- SPELL SEARCH -->
        <div style="margin-bottom:.85rem;">
          <div style="font-family:'Cinzel',serif;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);margin-bottom:.5rem;">Add Spells from Database</div>
          <div style="display:flex;gap:.4rem;margin-bottom:.4rem;">
            <input id="char-spell-search-${idx}" placeholder="Search spells by name..." style="flex:1;" oninput="renderCharSpellSearch(${idx})">
            <select id="char-spell-level-${idx}" onchange="renderCharSpellSearch(${idx})" style="max-width:100px;">
              <option value="">All Levels</option>
              <option>Cantrip</option><option>1st</option><option>2nd</option><option>3rd</option>
              <option>4th</option><option>5th</option><option>6th</option><option>7th</option>
              <option>8th</option><option>9th</option>
            </select>
          </div>
          <div id="char-spell-results-${idx}" style="max-height:180px;overflow-y:auto;background:var(--bg3);border:1px solid var(--border);border-radius:2px;"></div>
        </div>

        <!-- SPELLS BY LEVEL -->
        <div style="font-family:'Cinzel',serif;font-size:.65rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text2);margin-bottom:.5rem;">Known / Prepared Spells</div>
        ${(()=>{
          const levels=['Cantrip','1st','2nd','3rd','4th','5th','6th','7th','8th','9th'];
          const charSpells=c.spellList||[];
          return levels.map(lvl=>{
            const spellsAtLevel=charSpells.filter(s=>s.level===lvl);
            return`<div style="margin-bottom:.65rem;">
              <div style="display:flex;align-items:center;justify-content:space-between;background:${lvl==='Cantrip'?'rgba(201,146,42,.12)':'rgba(155,89,182,.12)'};border:1px solid ${lvl==='Cantrip'?'var(--gold)':'var(--accent)'};padding:.35rem .65rem;margin-bottom:.3rem;">
                <span style="font-family:'Cinzel',serif;font-size:.7rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${lvl==='Cantrip'?'var(--gold2)':'#c678e0'};">${lvl==='Cantrip'?'✦ Cantrips':'✦ '+lvl+' Level'}</span>
                <span style="font-size:.7rem;color:var(--text3);">${spellsAtLevel.length} spell${spellsAtLevel.length!==1?'s':''}</span>
              </div>
              ${spellsAtLevel.length===0
                ?`<div style="padding:.35rem .65rem;color:var(--text3);font-size:.8rem;font-style:italic;">No ${lvl==='Cantrip'?'cantrips':lvl+' level spells'} added yet</div>`
                :spellsAtLevel.map(s=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.38rem .65rem;border-bottom:1px solid rgba(74,58,37,.25);background:var(--bg3);">
                  <div style="cursor:pointer;" onclick="showSpellPopup('${s.name.replace(/'/g,"\\'")}',event)" title="Quick preview (click for details)">
                    <span style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--gold3);">${s.name}</span>
                    <span style="font-size:.72rem;color:var(--text3);margin-left:.5rem;">${s.school||''}</span>
                    ${s.concentration?'<span class="conc-badge" style="margin-left:.3rem;">◉</span>':''}
                    ${s.ritual?'<span class="tag" style="font-size:.55rem;color:#58d68d;border-color:#1e8449;margin-left:.3rem;">Ritual</span>':''}
                  </div>
                  <div style="display:flex;gap:.25rem;align-items:center;">
                    <button onclick="event.stopPropagation();openSpellFromChar('${s.name.replace(/'/g,"\\'")}',${idx})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.75rem;" title="Open in Spell DB">🔗</button>
                    <button onclick="removeSpellFromChar(${idx},'${s.name.replace(/'/g,"\\'")}');renderCharSheet(state.characters[${idx}])" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.9rem;" title="Remove">✕</button>
                  </div>
                </div>`).join('')
              }
            </div>`;
          }).join('');
        })()}

      </div>
      <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Backstory & Notes</div>
        <textarea rows="8" style="resize:vertical;line-height:1.7;" oninput="updateChar(${idx},'backstory',this.value)" placeholder="Born in a small village...">${c.backstory||''}</textarea>
      </div>
    </div>

    <!-- PASSIVE STATS + UTILITY -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
      <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:.75rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Passive Stats</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;">
          <div class="passive-stat"><span class="pval">${getPassivePerception(c)}</span><span class="plbl">Perception</span></div>
          <div class="passive-stat"><span class="pval">${getPassiveInvestigation(c)}</span><span class="plbl">Investigation</span></div>
          <div class="passive-stat"><span class="pval">${getPassiveInsight(c)}</span><span class="plbl">Insight</span></div>
        </div>
        <div style="margin-top:.85rem;">
          <div style="font-family:Cinzel,serif;font-size:.62rem;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:.45rem;">Combat Modifiers</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;">
            <div class="passive-stat"><span class="pval">${calcMod(parseInt(c.str||10))}</span><span class="plbl">Melee Atk</span></div>
            <div class="passive-stat"><span class="pval">${calcMod(parseInt(c.dex||10))}</span><span class="plbl">Ranged Atk</span></div>
            <div class="passive-stat"><span class="pval">${8+parseInt(c.profBonus||2)+Math.floor((parseInt(c.wis||10)-10)/2)}</span><span class="plbl">Spell DC</span></div>
          </div>
        </div>
      </div>
      <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:.75rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:.45rem;">
          <button class="rest-btn" onclick="document.getElementById('rest-modal').classList.add('open')"><span class="rbi">🛌</span>Take a Rest</button>
          <button class="rest-btn" onclick="addCharToInit(${idx});showPage('initiative')"><span class="rbi">⏱</span>Add to Initiative</button>
          <button class="rest-btn" onclick="syncCombatantsToMap();showPage('map')"><span class="rbi">🗺</span>Show on Map</button>
          <button class="rest-btn" onclick="searchLibraryForItem('${(c.class||'').replace(/'/g,"\\'")}','class')"><span class="rbi">📚</span>Look up ${c.class||'Class'} in Library</button>
        </div>
      </div>
    </div>

    <!-- BOTTOM ACTIONS -->
    <div style="display:flex;gap:.65rem;flex-wrap:wrap;padding:.75rem 0;border-top:1px solid var(--border);">
      <button class="btn" onclick="addCharToInit(${idx})">➕ Add to Initiative</button>
      <button class="btn btn-ghost" onclick="save();toast('✓ Saved','#3d9b52')">💾 Save</button>
      <button class="btn btn-ghost btn-sm" onclick="document.getElementById('rest-modal').classList.add('open')">🛌 Rest</button>
      <button class="btn btn-red btn-sm" onclick="deleteCharFromFull()">🗑 Delete</button>
    </div>

  </div>`;
}
function addCharToInit(idx){
  const c=state.characters[idx];
  if(state.combatants.find(x=>x.name===c.name)){toast('Already in initiative: '+c.name);return;}
  const dexMod=Math.floor((parseInt(c.dex||10)-10)/2);
  state.combatants.push({name:c.name,hp:parseInt(c.maxHp)||20,maxHp:parseInt(c.maxHp)||20,ac:parseInt(c.ac)||10,init:rollDie(20)+dexMod,type:'player',conditions:[],dead:false,id:Date.now()+Math.random()});
  document.getElementById('hud-toggle').style.display='block';
  renderInitiative();save();syncCombatantsToMap();
  logEvent('turn','➕ '+c.name+' added to Initiative','log-turn');
  toast('➕ '+c.name+' added to Initiative!');
}

// ===== MONSTERS =====
function newMonster(){
  const name=prompt('Monster name:');if(!name)return;
  state.monsters.push({id:Date.now(),name,type:'Beast',size:'Medium',alignment:'Unaligned',ac:10,hp:10,speed:'30 ft.',cr:'1',str:10,dex:10,con:10,int:3,wis:10,cha:7,saves:'',skills:'',resistances:'',immunities:'',senses:'',languages:'—',traits:'',actions:'Slam. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6+1) bludgeoning damage.',reactions:'',legendaryActions:''});
  state.activeMonsterIdx=state.monsters.length-1;renderMonsterList();renderMonsterDetail(state.monsters[state.activeMonsterIdx]);save();
}
function deleteMonster(){if(state.activeMonsterIdx===null)return alert('Select a monster first');if(!confirm('Delete?'))return;state.monsters.splice(state.activeMonsterIdx,1);state.activeMonsterIdx=null;renderMonsterList();save();}
function renderMonsterList(){
  const el=document.getElementById('monster-list');
  if(!state.monsters.length){el.innerHTML='<div class="empty-state"><span class="empty-icon">💀</span>No monsters saved</div>';return;}
  el.innerHTML=state.monsters.map((m,i)=>'<div class="char-item'+(state.activeMonsterIdx===i?' active':'')+'" onclick="selectMonster('+i+')">'+'<div class="char-avatar">💀</div><div class="char-info"><div class="char-name">'+m.name+'</div><div class="char-sub">'+(m.size||'')+' '+(m.type||'')+' — CR '+(m.cr||'?')+'</div></div></div>').join('');
}
function selectMonster(idx){
  state.activeMonsterIdx=idx;
  renderMonsterList();
  renderMonsterDetail(state.monsters[idx]);
}
function closeMonsterFullView(){
  document.getElementById('monster-full-view').style.display='none';
  document.getElementById('monster-list-view').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});
}

function addMonsterToInitFromFull(){
  if(state.activeMonsterIdx===null)return;
  addMonsterToInit(state.activeMonsterIdx);
}

function deleteMonsterFromFull(){
  if(!confirm('Delete this monster?'))return;
  state.monsters.splice(state.activeMonsterIdx,1);
  state.activeMonsterIdx=null;
  save();renderMonsterList();closeMonsterFullView();
}
function updateMon(idx,f,v){state.monsters[idx][f]=v;save();}

async function importMonsterFromAPI(){
  const q=document.getElementById('monster-search-import').value.trim();
  if(!q)return alert('Enter a monster name');
  const res=document.getElementById('monster-import-results');
  res.innerHTML='<div class="text-dim">Searching Open5e...</div>';
  try{
    const resp=await fetch('https://api.open5e.com/v1/monsters/?search='+encodeURIComponent(q)+'&limit=8&format=json');
    const data=await resp.json();
    if(!data.results||!data.results.length){res.innerHTML='<div class="text-dim">No results found. Try a different name.</div>';return;}
    res.innerHTML=data.results.map(m=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.4rem .5rem;border:1px solid var(--border);margin-bottom:.28rem;background:var(--bg3);">`
      +`<span style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--gold3);">${m.name} <span style="font-size:.68rem;color:var(--text3);">CR ${m.challenge_rating} ${m.size} ${m.type}</span></span>`
      +`<button class="btn btn-sm" onclick="importMonsterData(${JSON.stringify(m).replace(/"/g,'&quot;')})">Import</button>`
      +`</div>`).join('');
  }catch(e){res.innerHTML='<div class="text-dim" style="color:var(--red2);">API error. Check your internet connection.</div>';}
}
function parseStatblockText(){
  const text=document.getElementById('statblock-paste').value.trim();
  if(!text)return alert('Paste a stat block first');

  const get=(pattern,fallback='')=>{const m=text.match(pattern);return m?m[1].trim():fallback;};
  const getNum=(pattern,fallback=10)=>{const m=text.match(pattern);return m?parseInt(m[1]):fallback;};

  // Name is usually the first non-empty line
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
  const name=lines[0]||'Unknown Monster';

  // Size and type — second line usually "Medium humanoid, neutral"
  const sizeLine=lines[1]||'';
  const sizeMatch=sizeLine.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)/i);
  const size=sizeMatch?sizeMatch[1]:'Medium';
  const typeMatch=sizeLine.match(/(?:Tiny|Small|Medium|Large|Huge|Gargantuan)\s+(\w+[\w\s]*?)(?:,|\(|$)/i);
  const type=typeMatch?typeMatch[1].trim():'Humanoid';
  const alignment=sizeLine.includes(',')?sizeLine.split(',').pop().trim():'Unaligned';

  const ac=getNum(/Armor Class\s+(\d+)/i,10);
  const hp=getNum(/Hit Points\s+(\d+)/i,10);
  const speed=get(/Speed\s+([^\n]+)/i,'30 ft.');
  const cr=get(/Challenge\s+([\d/]+)/i,'1');

  // Ability scores — handles both inline and table formats
  const str=getNum(/STR[\s\n]+(\d+)/i,10);
  const dex=getNum(/DEX[\s\n]+(\d+)/i,10);
  const con=getNum(/CON[\s\n]+(\d+)/i,10);
  const int_=getNum(/INT[\s\n]+(\d+)/i,10);
  const wis=getNum(/WIS[\s\n]+(\d+)/i,10);
  const cha=getNum(/CHA[\s\n]+(\d+)/i,10);

  const saves=get(/Saving Throws\s+([^\n]+)/i,'');
  const skills=get(/Skills\s+([^\n]+)/i,'');
  const resistances=get(/Damage Resistances?\s+([^\n]+)/i,'');
  const immunities=get(/Damage Immunities?\s+([^\n]+)/i,'');
  const senses=get(/Senses\s+([^\n]+)/i,'');
  const languages=get(/Languages?\s+([^\n]+)/i,'—');

  // Extract actions block — everything after "Actions" header
  const actionsMatch=text.match(/(?:^|\n)Actions\s*\n([\s\S]*?)(?=\nReactions|\nLegendary|\nBonus Actions|$)/i);
  const actions=actionsMatch?actionsMatch[1].trim():'';

  const reactionsMatch=text.match(/(?:^|\n)Reactions\s*\n([\s\S]*?)(?=\nActions|\nLegendary|$)/i);
  const reactions=reactionsMatch?reactionsMatch[1].trim():'';

  const legendaryMatch=text.match(/(?:^|\n)Legendary Actions\s*\n([\s\S]*?)(?=\nActions|\nReactions|$)/i);
  const legendaryActions=legendaryMatch?legendaryMatch[1].trim():'';

  // Traits — everything between CR and Actions
  const traitsMatch=text.match(/Challenge[\s\S]*?\n([\s\S]*?)(?=\nActions|$)/i);
  const traits=traitsMatch?traitsMatch[1].trim():'';

  const monster={
    id:Date.now(),name,type,size,alignment,
    ac,hp,speed,cr,
    str,dex,con,int:int_,wis,cha,
    saves,skills,resistances,immunities,senses,languages,
    portrait:'',traits,actions,reactions,legendaryActions
  };

  state.monsters.push(monster);
  state.activeMonsterIdx=state.monsters.length-1;
  renderMonsterList();renderMonsterDetail(monster);save();
  document.getElementById('statblock-paste').value='';
  alert('✓ '+name+' imported! Check the stat block and fix anything the parser missed.');
}
function importMonsterData(m){
  const parseActions=arr=>(arr||[]).map(a=>a.name+': '+a.desc).join('\n\n');
  const monster={
    id:Date.now(),name:m.name,type:m.type||'Beast',size:m.size||'Medium',alignment:m.alignment||'Unaligned',
    ac:m.armor_class||10,hp:m.hit_points||10,speed:typeof m.speed==='object'?Object.entries(m.speed).map(([k,v])=>k+' '+v+'ft').join(', '):(m.speed||'30 ft.'),
    cr:String(m.challenge_rating||0),
    str:m.strength||10,dex:m.dexterity||10,con:m.constitution||10,int:m.intelligence||3,wis:m.wisdom||10,cha:m.charisma||5,
    saves:[m.strength_save,m.dexterity_save,m.constitution_save,m.intelligence_save,m.wisdom_save,m.charisma_save].filter(Boolean).join(', '),
    skills:(typeof m.skills==='object'&&m.skills!==null ? Object.entries(m.skills).map(([k,v])=>k.charAt(0).toUpperCase()+k.slice(1)+' +'+v).join(', ') : m.skills||''),
    resistances:(m.damage_resistances||''),immunities:(m.damage_immunities||''),
    senses:(m.senses||''),languages:(m.languages||'—'),
    portrait:(m.img_main&&!m.img_main.startsWith('http')?'https://api.open5e.com'+m.img_main:m.img_main||''),
    traits:parseActions(m.special_abilities),actions:parseActions(m.actions),reactions:parseActions(m.reactions),legendaryActions:parseActions(m.legendary_actions)
  };
  state.monsters.push(monster);state.activeMonsterIdx=state.monsters.length-1;
  renderMonsterList();renderMonsterDetail(monster);save();
  document.getElementById('monster-import-results').innerHTML='<div style="color:var(--green2);font-family:Cinzel,serif;font-size:.78rem;padding:.35rem;">✓ '+m.name+' imported!</div>';
}

function renderMonsterDetail(m){
  const idx=state.monsters.indexOf(m);
  const abils=['str','dex','con','int','wis','cha'];

  // Switch to full view
  document.getElementById('monster-list-view').style.display='none';
  document.getElementById('monster-full-view').style.display='block';
  window.scrollTo({top:0,behavior:'smooth'});

  document.getElementById('monster-full-content').innerHTML=`
  <div style="max-width:960px;margin:0 auto;">

    <!-- HEADER BAND -->
    <div style="background:linear-gradient(135deg,#1a0a0a,var(--panel));border:1px solid var(--red2);border-left:6px solid var(--red2);padding:1.5rem 2rem;margin-bottom:1.5rem;display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;">
      <!-- Portrait -->
      <div style="flex:0 0 140px;">
        <div style="width:140px;height:140px;background:var(--bg3);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:4rem;overflow:hidden;margin-bottom:.5rem;" id="mon-portrait-${idx}">
          ${m.portrait?`<img src="${m.portrait}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentNode.innerHTML='💀'">`:'💀'}
        </div>
        <input placeholder="Portrait URL..." value="${m.portrait||''}" style="font-size:.72rem;padding:.3rem .5rem;" oninput="updateMon(${idx},'portrait',this.value);const p=document.getElementById('mon-portrait-${idx}');p.innerHTML=this.value?'<img src=\\''+this.value+'\\' style=\\'width:100%;height:100%;object-fit:cover;\\' onerror=\\'this.parentNode.innerHTML=chr(9760)\\'>':'💀'">
      </div>
      <!-- Name + meta -->
      <div style="flex:1;min-width:200px;">
        <input value="${m.name}" style="font-family:'Cinzel Decorative',cursive;font-size:2rem;background:transparent;border:none;border-bottom:2px solid var(--red2);color:var(--gold2);width:100%;padding:.25rem 0;margin-bottom:.6rem;" oninput="updateMon(${idx},'name',this.value)">
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem;">
          <div style="flex:0 0 90px;"><label>Size</label><input value="${m.size||'Medium'}" oninput="updateMon(${idx},'size',this.value)"></div>
          <div style="flex:1;min-width:100px;"><label>Type</label><input value="${m.type||'Beast'}" oninput="updateMon(${idx},'type',this.value)"></div>
          <div style="flex:1;min-width:120px;"><label>Alignment</label><input value="${m.alignment||''}" oninput="updateMon(${idx},'alignment',this.value)"></div>
        </div>
        <!-- Big 4 stats -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;">
          <div style="background:rgba(192,57,43,.12);border:1px solid var(--red2);padding:.6rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:1px;text-transform:uppercase;color:var(--red2);margin-bottom:.2rem;">Armor Class</div>
            <input type="number" value="${m.ac||10}" oninput="updateMon(${idx},'ac',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.8rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(192,57,43,.12);border:1px solid var(--red2);padding:.6rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:1px;text-transform:uppercase;color:var(--red2);margin-bottom:.2rem;">Hit Points</div>
            <input type="number" value="${m.hp||10}" oninput="updateMon(${idx},'hp',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.8rem;color:var(--red2);text-align:center;width:100%;padding:0;">
          </div>
          <div style="background:rgba(192,57,43,.12);border:1px solid var(--red2);padding:.6rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:1px;text-transform:uppercase;color:var(--red2);margin-bottom:.2rem;">Speed</div>
            <input value="${m.speed||'30 ft.'}" oninput="updateMon(${idx},'speed',this.value)" style="background:transparent;border:none;font-family:'Cinzel',serif;font-size:1rem;color:var(--text);text-align:center;width:100%;padding:.3rem 0;">
          </div>
          <div style="background:rgba(192,57,43,.12);border:1px solid var(--red2);padding:.6rem;text-align:center;border-radius:2px;">
            <div style="font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:1px;text-transform:uppercase;color:var(--red2);margin-bottom:.2rem;">Challenge</div>
            <input value="${m.cr||'1'}" oninput="updateMon(${idx},'cr',this.value)" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.8rem;color:var(--gold);text-align:center;width:100%;padding:0;">
          </div>
        </div>
      </div>
    </div>

    <!-- ABILITY SCORES -->
    <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;margin-bottom:1.25rem;">
      <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Ability Scores</div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:.75rem;">
        ${abils.map(a=>`
          <div style="text-align:center;">
            <div style="font-family:'Cinzel',serif;font-size:.65rem;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:.35rem;">${a.toUpperCase()}</div>
            <div style="background:var(--bg3);border:2px solid var(--border);border-top:3px solid var(--red2);padding:.6rem .25rem;">
              <input type="number" value="${m[a]||10}" oninput="updateMon(${idx},'${a}',this.value);this.nextElementSibling.textContent='('+calcMod(parseInt(this.value||10))+')';" style="background:transparent;border:none;font-family:'Cinzel Decorative',cursive;font-size:1.5rem;color:var(--gold2);text-align:center;width:100%;padding:0;">
              <div style="font-family:'Cinzel',serif;font-size:.82rem;color:var(--text2);margin-top:.15rem;">(${calcMod(m[a]||10)})</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- TRAITS GRID -->
    <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;margin-bottom:1.25rem;">
      <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--gold);margin-bottom:1rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Traits & Proficiencies</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.85rem;">
        <div><label>Saving Throws</label><input value="${m.saves||''}" oninput="updateMon(${idx},'saves',this.value)" placeholder="Con +5, Wis +2..."></div>
        <div><label>Skills</label><input value="${m.skills||''}" oninput="updateMon(${idx},'skills',this.value)" placeholder="Perception +4, Stealth +2..."></div>
        <div><label>Damage Resistances</label><input value="${m.resistances||''}" oninput="updateMon(${idx},'resistances',this.value)" placeholder="Fire, Bludgeoning..."></div>
        <div><label>Damage Immunities</label><input value="${m.immunities||''}" oninput="updateMon(${idx},'immunities',this.value)" placeholder="Poison, Psychic..."></div>
        <div><label>Senses</label><input value="${m.senses||''}" oninput="updateMon(${idx},'senses',this.value)" placeholder="Darkvision 60 ft., Passive Perception 12"></div>
        <div><label>Languages</label><input value="${m.languages||'—'}" oninput="updateMon(${idx},'languages',this.value)" placeholder="Common, Goblin..."></div>
      </div>
    </div>

    <!-- ACTIONS PANELS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
      <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text3);margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Special Traits</div>
        <textarea rows="5" style="resize:vertical;line-height:1.65;" oninput="updateMon(${idx},'traits',this.value)" placeholder="Legendary Resistance, Magic Resistance...">${m.traits||''}</textarea>
      </div>
      <div style="background:var(--panel);border:1px solid var(--border);border-top:3px solid var(--red2);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--red2);margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid var(--red2);">Actions</div>
        <textarea rows="5" style="resize:vertical;line-height:1.65;" oninput="updateMon(${idx},'actions',this.value)" placeholder="Multiattack, weapon attacks...">${m.actions||''}</textarea>
      </div>
      <div style="background:var(--panel);border:1px solid var(--border);padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text2);margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid var(--border);">Reactions</div>
        <textarea rows="4" style="resize:vertical;line-height:1.65;" oninput="updateMon(${idx},'reactions',this.value)" placeholder="Parry, Shield...">${m.reactions||''}</textarea>
      </div>
      <div style="background:var(--panel);border:1px solid var(--border);border-top:3px solid #9b59b6;padding:1.25rem 1.5rem;">
        <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c678e0;margin-bottom:.65rem;padding-bottom:.4rem;border-bottom:1px solid #7d3c98;">Legendary Actions</div>
        <textarea rows="4" style="resize:vertical;line-height:1.65;" oninput="updateMon(${idx},'legendaryActions',this.value)" placeholder="Can take 3 legendary actions...">${m.legendaryActions||''}</textarea>
      </div>
    </div>

  </div>`;
}
function addMonsterToInit(idx){
  const m=state.monsters[idx];
  state.combatants.push({name:m.name,hp:parseInt(m.hp)||10,maxHp:parseInt(m.hp)||10,ac:parseInt(m.ac)||10,init:rollDie(20),type:'enemy',conditions:[],dead:false,id:Date.now()+Math.random()});
  showPage('initiative');renderInitiative();save();
}
function addMonsterToMap3D(){
  if(state.activeMonsterIdx===null)return;
  const m=state.monsters[state.activeMonsterIdx];
  if(!MB.inited){toast('Open the 3D Map first!','#f39c12');return;}
  const tok={id:Date.now()+Math.random(),x:Math.floor(MB.G/2),z:Math.floor(MB.G/2),name:m.name,emoji:'💀',type:'enemy',sz:1,layer:0,col:MB_TOK_COLORS.enemy,ring:MB_TOK_RINGS.enemy,model:null,combatantId:null,mesh:null};
  tok.mesh=mb3BuildTokMesh(tok);MB.tokenGroup.add(tok.mesh);MB.tokens.push(tok);
  mb3RenderTList3();
  toast('💀 '+m.name+' added to 3D map!','#c0392b');
}

// ===== SPELLS (Open5e API) =====
let spellSort={col:'level_int',dir:1},expandedSpell=null,expandedCharSpell=null,spellReturnCharIdx=null;

function openSpellFromChar(spellName,charIdx){
  spellReturnCharIdx=charIdx;
  showPage('spells');
  renderSpells();
  // expand the spell and scroll to it after render
  expandedSpell=spellName;
  renderSpells();
  // search for it so it's visible
  const searchEl=document.getElementById('spell-search');
  if(searchEl){searchEl.value=spellName;filterSpells();}
  // show back button
  renderSpellBackBtn();
  setTimeout(()=>{
    const rows=document.querySelectorAll('#spell-tbody tr');
    if(rows.length)rows[0].scrollIntoView({behavior:'smooth',block:'center'});
  },80);
}

function renderSpellBackBtn(){
  const existing=document.getElementById('spell-back-btn');
  if(existing)existing.remove();
  if(spellReturnCharIdx===null)return;
  const charName=(state.characters[spellReturnCharIdx]||{}).name||'Character';
  const btn=document.createElement('button');
  btn.id='spell-back-btn';
  btn.className='btn btn-ghost';
  btn.style.cssText='position:fixed;bottom:1.5rem;right:1.5rem;z-index:200;box-shadow:0 4px 20px rgba(0,0,0,.8);';
  btn.innerHTML='← Back to '+charName;
  btn.onclick=()=>{
    const idx=spellReturnCharIdx;
    spellReturnCharIdx=null;
    btn.remove();
    // clear the search filter
    const searchEl=document.getElementById('spell-search');
    if(searchEl)searchEl.value='';
    expandedSpell=null;
    showPage('characters');
    selectChar(idx);
  };
  document.body.appendChild(btn);
}
const levelToInt={'Cantrip':0,'1st':1,'2nd':2,'3rd':3,'4th':4,'5th':5,'6th':6,'7th':7,'8th':8,'9th':9};

async function loadSpellsFromAPI() {
  document.getElementById('spell-loading').style.display = 'block';
  document.getElementById('spell-tbody').innerHTML = '';
  let spells = [], url = 'https://api.open5e.com/v1/spells/?limit=500&format=json';

  try {
    while (url) {
      const resp = await fetch(url);
      const data = await resp.json();
      spells = spells.concat(data.results || []);
      url = data.next;
    }

    // ✅ Fix: correct level mapping
    const levelNames = [
      "Cantrip",
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "7th",
      "8th",
      "9th"
    ];

    state.spells = spells.map(s => {
      // Convert Open5e's level (0–9 or string) → correct readable level
      let li = parseInt(s.level);

      if (isNaN(li) || li < 0 || li > 9) li = 0; // fix invalid API values

      return {
        name: s.name || '',
        level: levelNames[li],     // ✅ use readable level string
        level_int: li,             // ✅ numeric level value
        school: (s.school || '').charAt(0).toUpperCase() + (s.school || '').slice(1),
        castTime: s.casting_time || '',
        range: s.range || '',
        duration: s.duration || '',
        components: s.components || '',
        concentration: (s.duration || '').toLowerCase().includes('concentration'),
        ritual: s.ritual === 'yes' || s.ritual === true,
        classes: (s.dnd_class || s.classes || ''),
        description: s.desc || '',
        higherLevel: s.higher_level || ''
      };
    });

    save();
    document.getElementById('spell-loading').style.display = 'none';
    renderSpells();
    updateDashboard();

  } catch (e) {
    document.getElementById('spell-loading').style.display = 'none';
    document.getElementById('spell-tbody').innerHTML =
      '<tr><td colspan="8" style="color:var(--red2);text-align:center;padding:1rem;">Failed to load spells. Check your internet connection.</td></tr>';
  }
}

function sortSpells(col){if(spellSort.col===col)spellSort.dir*=-1;else{spellSort.col=col;spellSort.dir=1;}renderSpells();}
function filterSpells(){renderSpells();}

function renderSpells(){
  const search=(document.getElementById('spell-search')?.value||'').toLowerCase();
  const lf=document.getElementById('spell-level-filter')?.value||'';
  const sf=document.getElementById('spell-school-filter')?.value||'';
  const cf=document.getElementById('spell-class-filter')?.value||'';
  const allSpells=[...(state.spells||[]),...(state.customSpells||[])];
  let filtered=allSpells.filter(s=>{
    if(search&&!s.name.toLowerCase().includes(search)&&!(s.description||'').toLowerCase().includes(search))return false;
    if(lf&&s.level!==lf)return false;
    if(sf&&s.school!==sf)return false;
    if(cf&&!(s.classes||'').includes(cf))return false;
    return true;
  });
  filtered.sort((a,b)=>{
    const av=spellSort.col==='level_int'?(a.level_int??levelToInt[a.level]??0):(a[spellSort.col]||'');
    const bv=spellSort.col==='level_int'?(b.level_int??levelToInt[b.level]??0):(b[spellSort.col]||'');
    if(typeof av==='number')return(av-bv)*spellSort.dir;
    return String(av).localeCompare(String(bv))*spellSort.dir;
  });
  const tbody=document.getElementById('spell-tbody');
  if(!filtered.length){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:1.5rem;">No spells found. Click "Load All SRD Spells" to fetch from Open5e.</td></tr>';return;}
  tbody.innerHTML=filtered.map(s=>{
    const sc='school-'+(s.school||'').toLowerCase();
    const isExp=expandedSpell===s.name;
    return`<tr style="cursor:pointer;" onclick="toggleSpellDetail('${s.name.replace(/'/g,"\\'")}')">
      <td><span style="font-family:'Cinzel',serif;font-size:.8rem;color:var(--gold3);">${s.name}</span>${s.ritual?'<span style="font-size:.58rem;font-family:Cinzel,serif;background:rgba(201,146,42,.15);border:1px solid var(--border);color:var(--gold3);padding:.08rem .3rem;border-radius:2px;margin-left:.25rem;">R</span>':''}</td>
      <td><span style="background:var(--bg3);border:1px solid var(--border);color:var(--text2);font-family:Cinzel,serif;font-size:.65rem;padding:.12rem .38rem;">${s.level}</span></td>
      <td><span class="tag ${sc}">${s.school}</span></td>
      <td style="color:var(--text2);font-size:.82rem;">${s.castTime||'—'}</td>
      <td style="color:var(--text2);font-size:.82rem;">${s.range||'—'}</td>
      <td style="color:var(--text2);font-size:.82rem;">${s.duration||'—'}</td>
      <td style="font-size:.75rem;">${s.concentration?'<span style="color:#c678e0;">●</span>':''}</td>
      <td style="color:var(--text3);font-size:.78rem;">${(s.classes||'—').substring(0,40)}</td>
    </tr>`
    +(isExp?`<tr><td colspan="8"><div class="spell-detail-box">
      <div><strong style="color:var(--gold);">Cast Time:</strong> ${s.castTime||'—'}</div>
      <div><strong style="color:var(--gold);">Components:</strong> ${s.components||'—'}</div>
      <div><strong style="color:var(--gold);">Classes:</strong> ${s.classes||'—'}</div>
      <div><strong style="color:var(--gold);">Concentration:</strong> ${s.concentration?'Yes':'No'}${s.ritual?' · Ritual':''}</div>
      <div class="desc">${(s.description||'No description.').replace(/\n/g,'<br>')}</div>
      ${s.higherLevel?'<div class="desc"><strong style="color:var(--gold3);">At Higher Levels:</strong> '+s.higherLevel+'</div>':''}
    </div></td></tr>`:'');
  }).join('');
}
function toggleSpellDetail(name){expandedSpell=expandedSpell===name?null:name;renderSpells();}
function openAddSpell(){document.getElementById('add-spell-modal').classList.add('open');}
function saveCustomSpell(){
  const s={name:document.getElementById('cs-name').value,level:document.getElementById('cs-level').value,level_int:levelToInt[document.getElementById('cs-level').value]??0,school:document.getElementById('cs-school').value,castTime:document.getElementById('cs-cast').value,range:document.getElementById('cs-range').value,duration:document.getElementById('cs-duration').value,components:document.getElementById('cs-components').value,classes:document.getElementById('cs-classes').value,description:document.getElementById('cs-desc').value,custom:true};
  if(!s.name)return alert('Enter spell name');
  if(!state.customSpells)state.customSpells=[];
  state.customSpells.push(s);save();document.getElementById('add-spell-modal').classList.remove('open');renderSpells();updateDashboard();
}

// ===== 3D MAP ENGINE (Three.js r128) =====
// --- Advanced Lighting System ---
// Introduce dynamic point lights for tiles with emissive properties (e.g., campfire, magic_circ, lava_floor).
// Each emissive tile now spawns a THREE.PointLight with configurable color, intensity, and distance attenuation.
// Lights cast shadows and respect MB.shadowsOn flag.
// UI sliders added to adjust global ambient and directional light intensity, and a toggle for shadow casting.
// Helper functions `mb3CreateTileLight` and `mb3UpdateTileLights` manage lifecycle of tile lights.
// Updated `mb3Rebuild` to create lights for relevant tiles and store them in MB.tileLights.
// Added `mb3ToggleShadows` UI handler (already present) to enable/disable renderer shadows.
// Updated rendering loop to ensure lights are included.
// End Advanced Lighting System additions
// Tile definitions: h=height col=hex emissive rough metal shape anim
const MB_DEFS = {
  void:        {h:0,    col:null},
  stone_floor: {h:0.15, col:0x4a4040, rough:0.92},
  stone_wall:  {h:2.0,  col:0x1e1a18, rough:0.95},
  flagstone:   {h:0.15, col:0x5a5048, rough:0.88},
  wood_floor:  {h:0.15, col:0x7b5230, rough:0.72},
  dirt_floor:  {h:0.12, col:0x5c3d1a, rough:1.0},
  pit:         {h:0.02, col:0x080606, rough:1.0},
  grass:       {h:0.2,  col:0x2d5a1b, rough:0.92},
  forest:      {h:0.2,  col:0x1a3a10, rough:0.92},
  water:       {h:0.08, col:0x1a4a6b, emissive:0x0a2038, rough:0.08, metal:0.3},
  deep_water:  {h:0.05, col:0x0a1e3a, emissive:0x040e1c, rough:0.05, metal:0.6},
  lava_floor:  {h:0.1,  col:0x8b2000, emissive:0x5a1500, rough:0.8,  anim:'pulse'},
  sand:        {h:0.12, col:0xc8a44a, rough:1.0},
  snow:        {h:0.15, col:0xdce8f0, rough:0.95},
  ice_floor:   {h:0.08, col:0xb8d8e8, emissive:0x204860, rough:0.05, metal:0.5},
  swamp:       {h:0.15, col:0x3a4a20, rough:0.95},
  mountain:    {h:0.8,  col:0x6a6058, rough:0.9},
  pillar:      {h:2.5,  col:0x5a5048, rough:0.85, shape:'cyl'},
  door_c:      {h:1.5,  col:0x7b5230, rough:0.7},
  door_o:      {h:0.4,  col:0x3a2810, rough:0.9},
  stairs_up:   {h:0.4,  col:0x5a5048, rough:0.8},
  altar:       {h:0.7,  col:0x3a2a48, emissive:0x1a1028, rough:0.6, metal:0.3},
  chest:       {h:0.5,  col:0x8b6020, rough:0.55, metal:0.4},
  campfire:    {h:0.2,  col:0x1a0e08, emissive:0x5a2800, rough:1.0, anim:'flicker'},
  bookshelf:   {h:1.5,  col:0x5a3010, rough:0.82},
  throne:      {h:1.3,  col:0x3a2a10, emissive:0x100800, rough:0.55, metal:0.4},
  trap:        {h:0.15, col:0x3a0a0a, emissive:0x200000, rough:0.9},
  barrel:      {h:0.55, col:0x5a3c1e, rough:0.8, shape:'cyl'},
  magic_circ:  {h:0.08, col:0x0a0818, emissive:0x4a2a88, rough:0.3, metal:0.5, anim:'pulse'},
  teleport:    {h:0.08, col:0x1a0a2a, emissive:0x8a4aff, rough:0.2, metal:0.6, anim:'pulse'},
  blood:       {h:0.05, col:0x4a0a0a, emissive:0x1a0000, rough:0.92},
  rubble:      {h:0.25, col:0x3a3228, rough:0.98},
};
// Tiles that are purely decorative/tall and need a floor beneath them
const MB_PROP_TILES=new Set(['pillar','door_c','door_o','altar','chest','campfire','bookshelf','throne','barrel','trap','magic_circ','teleport','blood','rubble','stairs_up','mountain']);
const MB_FLOOR_TILES=new Set(['stone_floor','flagstone','wood_floor','dirt_floor','grass','forest','sand','snow','ice_floor','swamp','water','deep_water','lava_floor','pit']);

const MB_BG_DEFS = {
  dungeon:{bg:0x050402,fogColor:0x0a0806,fogDen:0.06,ambCol:0x504030,ambInt:0.85,dirCol:0xb0a0c0,dirInt:1.1,  name:'Dungeon',icon:'🏚'},
  tavern: {bg:0x100804,fogColor:0x180e06,fogDen:0.09,ambCol:0x604828,ambInt:1.0, dirCol:0xe8a860,dirInt:1.3,  name:'Tavern', icon:'🍺'},
  forest: {bg:0x050a05,fogColor:0x060e06,fogDen:0.04,ambCol:0x305030,ambInt:0.9, dirCol:0xa0e080,dirInt:1.1,  name:'Forest', icon:'🌲'},
  daylight:{bg:0x4488cc,fogColor:0x88bbee,fogDen:0.008,ambCol:0x6090d0,ambInt:1.2,dirCol:0xffffff,dirInt:1.6, name:'Daylight',icon:'☀️'},
  night:  {bg:0x020410,fogColor:0x020410,fogDen:0.05,ambCol:0x203050, ambInt:0.65,dirCol:0x5060a0,dirInt:0.8,name:'Night',  icon:'🌙'},
  lava:   {bg:0x180800,fogColor:0x200a00,fogDen:0.055,ambCol:0x603018,ambInt:0.9, dirCol:0xff7030,dirInt:1.4, name:'Lava',   icon:'🔥'},
  arctic: {bg:0xc8d8e8,fogColor:0xd0e0f0,fogDen:0.018,ambCol:0x90b0d0,ambInt:1.2,dirCol:0xeef8ff,dirInt:1.4, name:'Arctic', icon:'❄️'},
};
const MB_PALETTE_CATS = [
  {cat:'Dungeon',tiles:['stone_floor','stone_wall','flagstone','wood_floor','dirt_floor','pit','rubble']},
  {cat:'Nature', tiles:['grass','forest','water','deep_water','lava_floor','sand','snow','ice_floor','swamp','mountain']},
  {cat:'Objects',tiles:['pillar','door_c','door_o','stairs_up','altar','chest','campfire','bookshelf','throne','trap','barrel']},
  {cat:'Magic',  tiles:['magic_circ','teleport','blood']},
];
const MB_EMOJIS=['🧙','⚔','🛡','🏹','💀','🐉','👹','🧌','🤺','🧝','🦇','👁','🔮','👑','🗡','💎','🕯','⚗'];
const MB_TOK_SIZES={tiny:0.45,small:0.65,medium:1.0,large:1.45,huge:2.0};
const MB_TOK_COLORS={player:0x1e3a5a,enemy:0x3a1a1a,ally:0x1a3a1a,object:0x2a2a1a};
const MB_TOK_RINGS={player:0xe8b84b,enemy:0xc0392b,ally:0x3d9b52,object:0x888888};

let MB_GEOS={}, MB_MATS={};

const MB = {
  scene:null,camera:null,renderer:null,
  ambLight:null,dirLight:null,
  tileGroup:null,layerGroups:[],tokenGroup:null,fogGroup:null,gridHelper:null,
  rayFloor:null,
  G:30,LAYER_H:2.5,floorDepth:0.15,
  tiles:null,fog:null,
  layers:[],activeLayer:0,
  tokens:[],selToken:null,
  models:{},selModel:null,
  cam:{theta:0.785,phi:1.05,r:26,tx:15,ty:0,tz:15},
  mouse:{down:false,btn:0,sx:0,sy:0,lx:0,ly:0,cx:0,cy:0},
  tool:'paint',selTile:'stone_floor',selEmoji:'🧙',
  showGrid:true,shadowsOn:true,fogMode:false,bgName:'dungeon',groundHug:false,modelsEnabled:true,
  lastCell:{x:-1,z:-1},rectA:null,measA:null,measB:null,measLine:null,
  hist:[],fut:[],maxHist:30,
  tweens:[],animMeshes:[],
  raf:null,tick:0,inited:false,scaleMarker:null,

};

const MB_RAY=new THREE.Raycaster();
const MB_NDC=new THREE.Vector2();

function mb3GetGeo(type){
  if(!MB_GEOS[type]){
    const d=MB_DEFS[type]||{h:0.15};
    const h=d.h||0.15;
    if(d.shape==='cyl') MB_GEOS[type]=new THREE.CylinderGeometry(0.36,0.42,h,10);
    else MB_GEOS[type]=new THREE.BoxGeometry(0.95,h,0.95);
  }
  return MB_GEOS[type];
}
function mb3GetMat(type){
  if(!MB_MATS[type]){
    const d=MB_DEFS[type]||{col:0x333333};
    MB_MATS[type]=new THREE.MeshStandardMaterial({
      color:new THREE.Color(d.col||0x333333),
      emissive:d.emissive?new THREE.Color(d.emissive):new THREE.Color(0),
      emissiveIntensity:d.emissive?0.45:0,
      roughness:d.rough!==undefined?d.rough:0.85,
      metalness:d.metal||0,
    });
  }
  return MB_MATS[type];
}
function mb3MakeMesh(type,x,z,baseY){
  const d=MB_DEFS[type];if(!d||!d.col)return null;
  const geo=mb3GetGeo(type);
  const mat=mb3GetMat(type).clone();
  const m=new THREE.Mesh(geo,mat);
  const h=d.h||0.15;
  m.position.set(x+0.5,baseY+h/2,z+0.5);
  m.castShadow=MB.shadowsOn;m.receiveShadow=true;
  m.userData={gx:x,gz:z,tileType:type,baseY,tileH:h};
  return m;
}
// Compute top Y of ground tile at (x,z) — used for stacking
function mb3GetGroundTop(x,z){
  const t=MB.tiles[z]&&MB.tiles[z][x];
  if(!t||t==='void')return 0;
  const d=MB_DEFS[t];if(!d||!d.col)return 0;
  if(MB_PROP_TILES.has(t)){const fh=MB_DEFS['stone_floor'].h||0.15;return fh+(d.h||0.15);}
  return d.h||0.15;
}

// Advanced obstacle detection: returns tiles with height > 1.0 within radius
MB.getObstacles = function(x, z, radius){
  const obstacles = [];
  const r2 = radius*radius;
  for(let dz = -radius; dz <= radius; dz++){
    for(let dx = -radius; dx <= radius; dx++){
      const nx = x + dx, nz = z + dz;
      if(nx < 0 || nz < 0 || nx >= MB.G || nz >= MB.G) continue;
      if(dx*dx + dz*dz > r2) continue;
      const tile = MB.tiles[nz] && MB.tiles[nz][nx];
      if(!tile) continue;
      const def = MB_DEFS[tile];
      if(def && (def.h || 0) > 1.0) obstacles.push({x:nx, z:nz, type:tile, height:def.h});
    }
  }
  return obstacles;
};

// Add a visual scale marker (5ft and 10ft) on the ground layer
function mb3AddScaleMarker(){
  if(!MB.scene) return;
  // Remove existing marker if present
  if(MB.scaleMarker){ MB.scene.remove(MB.scaleMarker); MB.scaleMarker = null; }
  const material = new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.6});
  const group = new THREE.Group();
  // 5ft line (one tile length)
  const geo5 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.5,0.01,0.5), new THREE.Vector3(1.5,0.01,0.5)]);
  const line5 = new THREE.Line(geo5, material);
  group.add(line5);
  // 10ft line (two tiles)
  const geo10 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.5,0.01,0.5), new THREE.Vector3(2.5,0.01,0.5)]);
  const line10 = new THREE.Line(geo10, material);
  group.add(line10);
  // Add simple text label using CanvasTexture for "5ft"
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white'; ctx.font = '20px sans-serif'; ctx.fillText('5ft', 2, 22);
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({map: texture, transparent: true});
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.5,0.125,1);
  sprite.position.set(1,0.02,0.5);
  group.add(sprite);
  MB.scene.add(group);
  MB.scaleMarker = group;
}

// Hook scale marker into initialization
function mb3AddScaleMarker(){
  if(!MB.scene) return;
  // Remove existing marker if present
  if(MB.scaleMarker){ MB.scene.remove(MB.scaleMarker); MB.scaleMarker = null; }
  const material = new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.6});
  const group = new THREE.Group();
  // 5ft line (one tile length)
  const geo5 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.5,0.01,0.5), new THREE.Vector3(1.5,0.01,0.5)]);
  const line5 = new THREE.Line(geo5, material);
  group.add(line5);
  // 10ft line (two tiles)
  const geo10 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.5,0.01,0.5), new THREE.Vector3(2.5,0.01,0.5)]);
  const line10 = new THREE.Line(geo10, material);
  group.add(line10);
  // Add simple text label using CanvasTexture for "5ft"
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white'; ctx.font = '20px sans-serif'; ctx.fillText('5ft', 2, 22);
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({map: texture, transparent: true});
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.5,0.125,1);
  sprite.position.set(1,0.02,0.5);
  group.add(sprite);
  MB.scene.add(group);
  MB.scaleMarker = group;
}


function mb3UpdateTileLights(){
  if(!MB.scene)return;
  MB.tileLights.forEach(l=>MB.scene.remove(l));
  MB.tileLights=[];
  for(let z=0;z<MB.G;z++)for(let x=0;x<MB.G;x++){
    const t=MB.tiles[z][x];if(!t)continue;
    const d=MB_DEFS[t];
    if(d && d.emissive){
      const color = new THREE.Color(d.emissive);
      const pl = new THREE.PointLight(color, 1.5, 8);
      pl.position.set(x + 0.5, d.h + 0.5, z + 0.5);
      pl.castShadow = true;
      pl.shadow.mapSize.set(512, 512);
      MB.scene.add(pl);
      MB.tileLights.push(pl);
    }
  }
}

function mb3Init(){
  if(!window.THREE){console.error('Three.js not loaded');return;}
  const wrap=document.getElementById('mb3-wrap');
  const canvas=document.getElementById('mb3-canvas');
  if(!wrap||!canvas)return;
  const W=wrap.clientWidth||800,H=wrap.clientHeight||600;

  if(!MB.inited){
    MB.scene=new THREE.Scene();
    MB.camera=new THREE.PerspectiveCamera(45,W/H,0.1,800);
    MB.renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    MB.renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    MB.renderer.shadowMap.enabled=true;
    MB.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    MB.renderer.setSize(W,H);

    MB.tileGroup=new THREE.Group();MB.scene.add(MB.tileGroup);
    MB.tokenGroup=new THREE.Group();MB.scene.add(MB.tokenGroup);
    MB.fogGroup=new THREE.Group();MB.scene.add(MB.fogGroup);

    MB.ambLight=new THREE.AmbientLight(0x302820,0.55);MB.scene.add(MB.ambLight);
    MB.dirLight=new THREE.DirectionalLight(0x8870a0,0.8);
    MB.dirLight.position.set(MB.G*0.4+10,30,MB.G*0.4+10);
    MB.dirLight.castShadow=true;
    MB.dirLight.shadow.mapSize.set(1024,1024);
    MB.dirLight.shadow.camera.near=0.5;MB.dirLight.shadow.camera.far=200;
    MB.dirLight.shadow.camera.left=-MB.G;MB.dirLight.shadow.camera.right=MB.G*2;
    MB.dirLight.shadow.camera.top=MB.G*2;MB.dirLight.shadow.camera.bottom=-MB.G;
    MB.scene.add(MB.dirLight);

    // Advanced Lighting Storage
    MB.tileLights=[];


    // Invisible ground for raycasting
    const fg=new THREE.PlaneGeometry(MB.G*8,MB.G*8);
    const fm=new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide});
    MB.ground=new THREE.Mesh(fg,fm);
    MB.ground.rotation.x=-Math.PI/2;
    MB.ground.position.y=-0.01;
    MB.scene.add(MB.ground);

    // Asset Registry
    MB.assets={textures:{},categories:{floor:[],wall:[],token:[],prop:[]}};
    MB.rayFloor=new THREE.Mesh(fg,fm);
    MB.rayFloor.rotation.x=-Math.PI/2;
    MB.rayFloor.position.set(MB.G/2,0,MB.G/2);
    MB.scene.add(MB.rayFloor);

    // Dark base plane
    const bp=new THREE.Mesh(new THREE.PlaneGeometry(MB.G,MB.G),new THREE.MeshStandardMaterial({color:0x040302,roughness:1}));
    bp.rotation.x=-Math.PI/2;bp.position.set(MB.G/2,-0.01,MB.G/2);bp.receiveShadow=true;
    MB.scene.add(bp);

    if(!MB.tiles||!MB.tiles.length)mb3GridInit();

    canvas.addEventListener('mousedown',mb3Down);
    canvas.addEventListener('mousemove',mb3Move);
    canvas.addEventListener('mouseup',mb3Up);
    canvas.addEventListener('wheel',mb3Wheel,{passive:false});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('resize',mb3OnResize);
    document.removeEventListener('keydown',mb3Key3D);
    document.addEventListener('keydown',mb3Key3D);
    MB.inited=true;
  }

  mb3BuildPalette3();mb3BuildBGList3();mb3BuildEmojiPicker3();
  mb3ApplyBG(MB.bgName);
  mb3Rebuild();mb3RenderLayerList3();mb3RenderTList3();mb3ResetCam();mb3AddScaleMarker();

  if(MB.raf)cancelAnimationFrame(MB.raf);
  mb3Loop();
}

function mb3GridInit(){
  MB.tiles=Array.from({length:MB.G},()=>Array(MB.G).fill('stone_floor'));
  MB.fog=Array.from({length:MB.G},()=>Array(MB.G).fill(false));
  MB.fogRevealed=Array.from({length:MB.G},()=>Array(MB.G).fill(false));
}

function mb3Rebuild(){
  if(!MB.scene)return;
  while(MB.tileGroup.children.length>0)MB.tileGroup.remove(MB.tileGroup.children[0]);
  MB.layerGroups.forEach(g=>MB.scene.remove(g));MB.layerGroups=[];
  MB.animMeshes=[];
  const d=MB_DEFS;
  for(let z=0;z<MB.G;z++)for(let x=0;x<MB.G;x++){
    const t=MB.tiles[z][x];
    if(!t||t==='void')continue;
    // If a prop tile sits on void, auto-add a stone floor beneath it so it doesn't float
    if(MB_PROP_TILES.has(t)){const fm=mb3MakeMesh('stone_floor',x,z,0);if(fm)MB.tileGroup.add(fm);}
    const m=mb3MakeMesh(t,x,z,MB_PROP_TILES.has(t)?(MB_DEFS['stone_floor'].h||0.15):0);
    if(m){MB.tileGroup.add(m);if(d[t]&&d[t].anim)MB.animMeshes.push({mesh:m,anim:d[t].anim});}
  }
  // Build per-cell top-of-stack map for ground layer
  const groundTops=[];
  for(let z=0;z<MB.G;z++){groundTops.push([]);for(let x=0;x<MB.G;x++){const t=MB.tiles[z][x];groundTops[z].push((!t||t==='void')?0:(MB_DEFS[t]&&MB_DEFS[t].col?(MB_DEFS[t].h||0.15):0));}}
  MB.layers.forEach((lay,li)=>{
    const grp=new THREE.Group();MB.scene.add(grp);MB.layerGroups.push(grp);
    for(let z=0;z<MB.G;z++)for(let x=0;x<MB.G;x++){
      const t=lay.tiles[z][x];
      if(!t||t==='void')continue;
      // Ground-hug: stack directly on top of ground tile; otherwise fixed LAYER_H offset
      const baseY=MB.groundHug?groundTops[z][x]:(li+1)*MB.LAYER_H;
      const m=mb3MakeMesh(t,x,z,baseY);
      if(m){grp.add(m);if(d[t]&&d[t].anim)MB.animMeshes.push({mesh:m,anim:d[t].anim});}
    }
  });
  mb3BuildGrid3();mb3RebuildFog3();mb3UpdateTileLights();
}

function mb3BuildGrid3(){
  if(MB.gridHelper){MB.scene.remove(MB.gridHelper);MB.gridHelper.geometry&&MB.gridHelper.geometry.dispose();MB.gridHelper=null;}
  if(!MB.showGrid)return;
  const pts=[];const G=MB.G;
  for(let i=0;i<=G;i++){pts.push(i,0.006,0,i,0.006,G);pts.push(0,0.006,i,G,0.006,i);}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pts),3));
  MB.gridHelper=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x4a3a25,opacity:0.35,transparent:true}));
  MB.scene.add(MB.gridHelper);
}

function mb3RevealArea(x,z,radius){
  for(let dz=-radius;dz<=radius;dz++){
    for(let dx=-radius;dx<=radius;dx++){
      const nx=x+dx,nz=z+dz;
      if(nx>=0&&nx<MB.G&&nz>=0&&nz<MB.G){
        if(Math.sqrt(dx*dx+dz*dz)<=radius){
          MB.fogRevealed[nz][nx]=true;
        }
      }
    }
  }
  mb3RebuildFog3();
}

function mb3RebuildFog3(){
  while(MB.fogGroup.children.length)MB.fogGroup.remove(MB.fogGroup.children[0]);
  if(!MB.fogMode)return;
  const geo=new THREE.PlaneGeometry(0.95,0.95);
  const mat=new THREE.MeshBasicMaterial({color:0x000000,opacity:0.85,transparent:true,depthWrite:false});
  for(let z=0;z<MB.G;z++)for(let x=0;x<MB.G;x++){
    if(!MB.fog[z][x] || MB.fogRevealed[z][x])continue;
    const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.position.set(x+0.5,6,z+0.5);MB.fogGroup.add(m);
  }
}

function mb3ApplyBG(name){
  MB.bgName=name;
  const cfg=MB_BG_DEFS[name]||MB_BG_DEFS.dungeon;
  if(!MB.scene)return;
  MB.scene.background=new THREE.Color(cfg.bg);
  MB.scene.fog=new THREE.FogExp2(cfg.fogColor,cfg.fogDen);
  if(MB.ambLight){MB.ambLight.color.set(cfg.ambCol);MB.ambLight.intensity=cfg.ambInt;}
  if(MB.dirLight){MB.dirLight.color.set(cfg.dirCol);MB.dirLight.intensity=cfg.dirInt;}
  document.querySelectorAll('.mb3-bg-btn').forEach(b=>b.classList.toggle('active',b.dataset.bg===name));
  const as=document.getElementById('mb3-amb');const av=document.getElementById('mb3-amb-val');
  const ds=document.getElementById('mb3-dir');const dv=document.getElementById('mb3-dir-val');
  if(as){as.value=cfg.ambInt;if(av)av.textContent=Math.round(cfg.ambInt/2*100)+'%';}
  if(ds){ds.value=cfg.dirInt;if(dv)dv.textContent=Math.round(cfg.dirInt/2.5*100)+'%';}
}

function mb3SetAmbient(v){if(MB.ambLight)MB.ambLight.intensity=v;const el=document.getElementById('mb3-amb-val');if(el)el.textContent=Math.round(v/2*100)+'%';}
function mb3SetDir(v){if(MB.dirLight)MB.dirLight.intensity=v;const el=document.getElementById('mb3-dir-val');if(el)el.textContent=Math.round(v/2.5*100)+'%';}

function mb3Loop(){
  MB.raf=requestAnimationFrame(mb3Loop);
  if(!MB.renderer)return;
  MB.tick++;const t=MB.tick;

  // Weather Overlay: simulate rain/snow as a simple overlay intensity change
  if(MB.weather==='rain'){
    MB.ambLight.intensity=0.4+Math.sin(t*0.05)*0.1;
  } else if(MB.weather==='storm'){
    if(t%100<5)MB.dirLight.intensity=0;else MB.dirLight.intensity=0.8;
  } else {
    MB.ambLight.intensity=0.55;
    MB.dirLight.intensity=0.8;
  }

  MB.animMeshes.forEach(a=>{
    if(!a.mesh||!a.mesh.material)return;
    if(a.anim==='flicker')a.mesh.material.emissiveIntensity=0.28+Math.sin(t*0.14+a.mesh.id*0.9)*0.28+Math.random()*0.08;
    else if(a.anim==='pulse')a.mesh.material.emissiveIntensity=0.28+Math.sin(t*0.04)*0.38;
  });
  // Tween token movement
  const now=Date.now();
  MB.tweens=MB.tweens.filter(tw=>{
    const p=Math.min(1,(now-tw.start)/tw.dur);
    const e=p<0.5?2*p*p:-1+(4-2*p)*p;
    tw.obj.position.x=tw.fx+(tw.tx-tw.fx)*e;tw.obj.position.z=tw.fz+(tw.tz-tw.fz)*e;if(tw.ty!==undefined)tw.obj.position.y=tw.fy+(tw.ty-tw.fy)*e;
    return p<1;
  });
  // Update camera
  const{theta,phi,r,tx,ty,tz}=MB.cam;
  MB.camera.position.set(tx+r*Math.sin(phi)*Math.sin(theta),ty+r*Math.cos(phi),tz+r*Math.sin(phi)*Math.cos(theta));
  MB.camera.lookAt(tx,ty,tz);
  MB.renderer.render(MB.scene,MB.camera);
}

function mb3ResetCam(){MB.cam={theta:0.785,phi:1.05,r:Math.max(15,MB.G*0.85),tx:MB.G/2,ty:0,tz:MB.G/2};}
function mb3ZoomIn(){MB.cam.r=Math.max(3,MB.cam.r*0.86);}
function mb3ZoomOut(){MB.cam.r=Math.min(120,MB.cam.r*1.16);}

// Raycasting helpers
function mb3SetNDC(e){
  const canvas=MB.renderer&&MB.renderer.domElement;if(!canvas)return;
  const r=canvas.getBoundingClientRect();
  MB_NDC.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
}
function mb3RaycastFloor(e){
  mb3SetNDC(e);MB_RAY.setFromCamera(MB_NDC,MB.camera);
  const hits=MB_RAY.intersectObject(MB.rayFloor);
  if(!hits.length)return null;
  const p=hits[0].point;
  const gx=Math.floor(p.x),gz=Math.floor(p.z);
  if(gx<0||gz<0||gx>=MB.G||gz>=MB.G)return null;
  return{x:gx,z:gz};
}
function mb3RaycastTokens(e){
  mb3SetNDC(e);MB_RAY.setFromCamera(MB_NDC,MB.camera);
  const meshes=[];
  MB.tokens.forEach(t=>{if(t.mesh)t.mesh.children.forEach(c=>meshes.push(c));});
  const hits=MB_RAY.intersectObjects(meshes,false);
  if(!hits.length)return null;
  const hitObj=hits[0].object;
  return MB.tokens.find(t=>t.mesh&&t.mesh.children.includes(hitObj))||null;
}

// Mouse events
function mb3Down(e){
  e.preventDefault();
  MB.mouse.down=true;MB.mouse.btn=e.button;
  MB.mouse.sx=MB.mouse.lx=MB.mouse.cx=e.clientX;
  MB.mouse.sy=MB.mouse.ly=MB.mouse.cy=e.clientY;
  if(e.button!==0)return;
  const tokHit=mb3RaycastTokens(e);
  if(MB.tool==='move'){
    if(tokHit){MB.selToken=tokHit;mb3ShowSelOverlay(tokHit);}
    else if(MB.selToken){const fl=mb3RaycastFloor(e);if(fl)mb3MoveToken(MB.selToken,fl.x,fl.z);}
    return;
  }
  if(MB.tool==='token'){const fl=mb3RaycastFloor(e);if(fl)mb3PlaceToken(fl.x,fl.z);return;}
  if(MB.tool==='measure'){
    const fl=mb3RaycastFloor(e);if(!fl)return;
    if(!MB.measA){MB.measA=fl;}else{MB.measB=fl;mb3ShowMeasure();MB.measA=null;MB.measB=null;}
    return;
  }
  if(MB.tool==='fog'){const fl=mb3RaycastFloor(e);if(fl){MB.fog[fl.z][fl.x]=!MB.fog[fl.z][fl.x];mb3RebuildFog3();}return;}
  if(MB.tool==='fill'){const fl=mb3RaycastFloor(e);if(fl){mb3HistPush();mb3Fill3(fl.x,fl.z,mb3GetTile3(fl.x,fl.z),MB.selTile);mb3Rebuild();}return;}
  if(MB.tool==='rect'){const fl=mb3RaycastFloor(e);if(fl)MB.rectA=fl;return;}
  // paint/erase
  const fl=mb3RaycastFloor(e);if(fl){mb3HistPush();mb3ApplyTile3(fl.x,fl.z);MB.lastCell={x:fl.x,z:fl.z};}
}
function mb3Move(e){
  const dx=e.clientX-MB.mouse.cx,dy=e.clientY-MB.mouse.cy;
  MB.mouse.cx=e.clientX;MB.mouse.cy=e.clientY;
  mb3SetNDC(e);
  if(!MB.mouse.down){
    // hover coords
    const fl=mb3RaycastFloor(e);
    if(fl){const el=document.getElementById('mb3-coords');if(el)el.textContent=`Grid: (${fl.x}, ${fl.z}) · ${MB.activeLayer===0?'Ground Floor':'Floor '+MB.activeLayer}`;}
    return;
  }
  if(MB.mouse.btn===2||(MB.mouse.btn===0&&e.altKey)){
    // Pan camera target (right-drag or alt+drag)
    const spd=MB.cam.r*0.0015;
    MB.cam.tx-=(dx*Math.cos(MB.cam.theta)-dy*Math.sin(MB.cam.theta)*Math.cos(MB.cam.phi))*spd;
    MB.cam.tz-=(dx*-Math.sin(MB.cam.theta)+dy*Math.cos(MB.cam.theta)*Math.cos(MB.cam.phi))*spd;
    return;
  }
  if(MB.mouse.btn===1){MB.cam.theta-=dx*0.007;MB.cam.phi=Math.max(0.12,Math.min(1.54,MB.cam.phi-dy*0.007));return;}
  if(MB.mouse.btn===0){
    if(MB.tool==='paint'||MB.tool==='erase'){
      const fl=mb3RaycastFloor(e);
      if(fl&&(fl.x!==MB.lastCell.x||fl.z!==MB.lastCell.z)){mb3ApplyTile3(fl.x,fl.z);MB.lastCell={x:fl.x,z:fl.z};}
    } else if(MB.tool==='rect'||MB.tool==='fill'||MB.tool==='fog'||MB.tool==='measure'||MB.tool==='token'||MB.tool==='move'){
      // These tools use click/mouseup — don't orbit camera while using them
    } else {
      MB.cam.theta-=dx*0.006;MB.cam.phi=Math.max(0.12,Math.min(1.54,MB.cam.phi-dy*0.006));
    }
  }
}
function mb3Up(e){
  if(MB.mouse.btn===0&&MB.tool==='rect'&&MB.rectA){
    const fl=mb3RaycastFloor(e);
    if(fl){
      mb3HistPush();
      const x0=Math.min(MB.rectA.x,fl.x),x1=Math.max(MB.rectA.x,fl.x);
      const z0=Math.min(MB.rectA.z,fl.z),z1=Math.max(MB.rectA.z,fl.z);
      for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)mb3SetTile3(x,z,MB.tool==='erase'?'void':MB.selTile);
      mb3Rebuild();
    }
    MB.rectA=null;
  }
  MB.mouse.down=false;MB.lastCell={x:-1,z:-1};
}
function mb3Wheel(e){e.preventDefault();MB.cam.r=Math.max(3,Math.min(120,MB.cam.r*(e.deltaY>0?1.1:0.91)));}
function mb3OnResize(){
  if(!MB.renderer)return;
  const wrap=document.getElementById('mb3-wrap');if(!wrap)return;
  const W=wrap.clientWidth,H=wrap.clientHeight;
  MB.renderer.setSize(W,H);MB.camera.aspect=W/H;MB.camera.updateProjectionMatrix();
}

// Tile CRUD
function mb3SetTile3(x,z,type){
  if(x<0||z<0||x>=MB.G||z>=MB.G)return;
  if(MB.activeLayer===0)MB.tiles[z][x]=type;
  else if(MB.layers[MB.activeLayer-1])MB.layers[MB.activeLayer-1].tiles[z][x]=type;
}
function mb3GetTile3(x,z){
  if(MB.activeLayer===0)return(MB.tiles[z]&&MB.tiles[z][x])||'void';
  return(MB.layers[MB.activeLayer-1]?.tiles[z]?.[x])||'void';
}
function mb3ApplyTile3(x,z){
  const t=MB.tool==='erase'?'void':MB.selTile;
  mb3SetTile3(x,z,t);
  // Fast single-tile rebuild for active layer
  if(MB.activeLayer===0){
    const old=MB.tileGroup.children.find(m=>m.userData.gx===x&&m.userData.gz===z);
    if(old)MB.tileGroup.remove(old);
    if(t!=='void'){if(MB_PROP_TILES.has(t)){const fm=mb3MakeMesh('stone_floor',x,z,0);if(fm)MB.tileGroup.add(fm);}const m=mb3MakeMesh(t,x,z,MB_PROP_TILES.has(t)?(MB_DEFS['stone_floor'].h||0.15):0);if(m)MB.tileGroup.add(m);}
  } else {
    const grp=MB.layerGroups[MB.activeLayer-1];if(!grp)return;
    const old=grp.children.find(m=>m.userData.gx===x&&m.userData.gz===z);
    if(old)grp.remove(old);
    const lay=MB.layers[MB.activeLayer-1];
    if(lay&&t&&t!=='void'){
      const baseY=MB.groundHug?mb3GetGroundTop(x,z):MB.activeLayer*MB.LAYER_H;
      const m=mb3MakeMesh(t,x,z,baseY);if(m)grp.add(m);
    }
  }
}
function mb3Fill3(x,z,target,rep){
  if(target===rep)return;
  const stack=[[x,z]],vis=new Set();
  while(stack.length){const[cx,cz]=stack.pop();const k=cx+','+cz;
    if(vis.has(k)||cx<0||cz<0||cx>=MB.G||cz>=MB.G||mb3GetTile3(cx,cz)!==target)continue;
    vis.add(k);mb3SetTile3(cx,cz,rep);stack.push([cx+1,cz],[cx-1,cz],[cx,cz+1],[cx,cz-1]);}
}

// History
function mb3HistPush(){
  const snap={tiles:JSON.stringify(MB.tiles),layers:JSON.stringify(MB.layers.map(l=>l.tiles))};
  MB.hist.push(snap);if(MB.hist.length>MB.maxHist)MB.hist.shift();MB.fut=[];
}
function mb3Undo(){if(!MB.hist.length)return;MB.fut.push({tiles:JSON.stringify(MB.tiles),layers:JSON.stringify(MB.layers.map(l=>l.tiles))});const s=MB.hist.pop();MB.tiles=JSON.parse(s.tiles);const lt=JSON.parse(s.layers);MB.layers.forEach((l,i)=>{if(lt[i])l.tiles=lt[i];});mb3Rebuild();}
function mb3Redo(){if(!MB.fut.length)return;MB.hist.push({tiles:JSON.stringify(MB.tiles),layers:JSON.stringify(MB.layers.map(l=>l.tiles))});const s=MB.fut.pop();MB.tiles=JSON.parse(s.tiles);const lt=JSON.parse(s.layers);MB.layers.forEach((l,i)=>{if(lt[i])l.tiles=lt[i];});mb3Rebuild();}

// Layers
function mb3AddLayer(){
  const name=prompt('Floor name:','Floor '+(MB.layers.length+1));if(!name)return;
  MB.layers.push({name,tiles:Array.from({length:MB.G},()=>Array(MB.G).fill('void')),visible:true});
  MB.activeLayer=MB.layers.length;
  mb3RenderLayerList3();mb3Rebuild();
}
function mb3SetActiveLayer3(idx){MB.activeLayer=idx;mb3RenderLayerList3();}
function mb3RenderLayerList3(){
  const el=document.getElementById('mb3-layer-list');if(!el)return;
  const rows=[{z:0,name:'Ground 🏔'},...MB.layers.map((l,i)=>({z:i+1,name:l.name+' ⬆'}))].reverse();
  el.innerHTML=rows.map(r=>`<div class="mb3-layer-row${MB.activeLayer===r.z?' active':''}" onclick="mb3SetActiveLayer3(${r.z})">${r.name}</div>`).join('');
}

// Tokens
function mb3PlaceToken(x,z){
  const sizeKey=document.getElementById('mb3-tok-size')?.value||'medium';
  const tokType=document.getElementById('mb3-tok-type')?.value||'player';
  const tokName=(document.getElementById('mb3-tok-name')?.value||'').trim()||MB.selEmoji;
  const sz=MB_TOK_SIZES[sizeKey]||1;
  const col=MB_TOK_COLORS[tokType]||0x1e2a3a;
  const ring=MB_TOK_RINGS[tokType]||0xe8b84b;
  const lz=MB.activeLayer;
  const tok={id:Date.now()+Math.random(),x,z,name:tokName,emoji:MB.selEmoji,type:tokType,sz,layer:lz,col,ring,model:MB.selModel||null,combatantId:null,mesh:null,hp:10,maxHp:10};
  tok.mesh=mb3BuildTokMesh(tok);
  MB.tokenGroup.add(tok.mesh);
  MB.tokens.push(tok);
  mb3RenderTList3();
}
function mb3BuildTokMesh(tok){
  const grp=new THREE.Group();
  const sz=tok.sz||1;
  const baseY=(tok.layer||0)*MB.LAYER_H;
  const col=tok.col||0x1e2a3a;
  const ringCol=tok.ring||0xe8b84b;

  if(tok.model&&MB.models[tok.model]&&MB.modelsEnabled){
    // Custom 3D model
    const geo=MB.models[tok.model];
    const box=new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
    const size=new THREE.Vector3();box.getSize(size);
    const maxD=Math.max(size.x,size.y,size.z)||1;
    const scale=(sz*1.8)/maxD;
    const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:0.6,metalness:0.3});
    const mesh=new THREE.Mesh(geo,mat);
    const center=new THREE.Vector3();box.getCenter(center);
    mesh.scale.set(scale,scale,scale);
    mesh.position.set(-center.x*scale,-box.min.y*scale+baseY,-center.z*scale);
    mesh.castShadow=true;grp.add(mesh);
  } else {
    // Procedural humanoid figure
    const legH=sz*0.33,legR=sz*0.1;
    const legMat=new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:0.65});
    const legGeo=new THREE.CylinderGeometry(legR,legR*1.1,legH,7);
    for(let s=-1;s<=1;s+=2){const l=new THREE.Mesh(legGeo,legMat);l.position.set(s*sz*0.11,baseY+legH/2,0);l.castShadow=true;grp.add(l);}
    const torsoH=sz*0.4,torsoR=sz*0.18;
    const torso=new THREE.Mesh(new THREE.CylinderGeometry(torsoR,torsoR*1.08,torsoH,8),new THREE.MeshStandardMaterial({color:new THREE.Color(col),roughness:0.6,metalness:0.08}));
    torso.position.set(0,baseY+legH+torsoH/2,0);torso.castShadow=true;grp.add(torso);
    const headR=sz*0.17;
    const head=new THREE.Mesh(new THREE.SphereGeometry(headR,9,7),new THREE.MeshStandardMaterial({color:new THREE.Color(col).multiplyScalar(1.25),roughness:0.55}));
    head.position.set(0,baseY+legH+torsoH+headR*0.9,0);head.castShadow=true;grp.add(head);
  }
  // Base ring
  const ringGeo=new THREE.TorusGeometry(sz*0.42,sz*0.038,6,14);
  const ringMat=new THREE.MeshStandardMaterial({color:new THREE.Color(ringCol),emissive:new THREE.Color(ringCol),emissiveIntensity:0.5,roughness:0.25,metalness:0.65});
  const ring=new THREE.Mesh(ringGeo,ringMat);
  ring.rotation.x=Math.PI/2;ring.position.set(0,baseY+0.02,0);
  ring.userData.isRing=true;grp.add(ring);
  grp.position.set(tok.x+0.5,0,tok.z+0.5);
  // Health bar (floating above token)
  const hbarGeo=new THREE.PlaneGeometry(sz*0.8,0.08);
  const hpPct=(tok.hp||10)/(tok.maxHp||10);
  const hbarCol=hpPct>0.5?0x3d9b52:hpPct>0.25?0xf39c12:0xc0392b;
  const hbarMat=new THREE.MeshBasicMaterial({color:hbarCol,side:THREE.DoubleSide});
  const hbar=new THREE.Mesh(hbarGeo,hbarMat);
  hbar.position.set(0,baseY+sz*0.9,0);hbar.name='healthBar';
  grp.add(hbar);
  // Store ref for updates
  tok.healthBar=hbar;
  return grp;
}
function mb3UpdateTokenHealth(tok){
  if(!tok.healthBar)return;
  const hpPct=(tok.hp||10)/(tok.maxHp||10);
  const hbarCol=hpPct>0.5?0x3d9b52:hpPct>0.25?0xf39c12:0xc0392b;
  tok.healthBar.material.color.set(hbarCol);
  tok.healthBar.scale.x=Math.max(0.1,hpPct);
}

function mb3MoveToken(tok,nx,nz){
  if(!tok.mesh)return;
  // Collision detection: prevent moving into walls or pillars
  const targetTile=MB.tiles[nz]&&MB.tiles[nz][nx];
  if(targetTile==='stone_wall'||targetTile==='pillar')return;

  // Elevation check: get height difference
  const currentTop = mb3GetGroundTop(tok.x, tok.z);
  const targetTop = mb3GetGroundTop(nx, nz);
  const diff = targetTop - currentTop;
  if (diff > 0.5 && !tok.climb) return; // block if step-up > 0.5 and no climb ability

  // Also check for obstacles if token doesn't have 'climb' (optional pathfinding prep)
  if (!tok.climb) {
    const obstacles = MB.getObstacles(nx, nz, 0); // check exact tile (radius 0)
    if (obstacles.length > 0) return; // blocked by an obstacle on the target tile
  }

  MB.tweens.push({obj:tok.mesh,fx:tok.mesh.position.x,fy:tok.mesh.position.y,fz:tok.mesh.position.z,tx:nx+0.5,ty:targetTop,tz:nz+0.5,start:Date.now(),dur:280});
  tok.x=nx;tok.z=nz;
  // Fog of War: Reveal area around the token
  mb3RevealArea(nx,nz,2);
  logEvent('turn',`🗺 ${tok.name} moved to (${nx},${nz})`,'log-turn');
}
function mb3DeleteSelToken(){
  if(!MB.selToken)return;
  if(MB.selToken.mesh)MB.tokenGroup.remove(MB.selToken.mesh);
  MB.tokens=MB.tokens.filter(t=>t!==MB.selToken);
  MB.selToken=null;
  document.getElementById('mb3-sel-overlay').style.display='none';
  mb3RenderTList3();
}
function mb3ClearTokens(){
  MB.tokens.forEach(t=>{if(t.mesh)MB.tokenGroup.remove(t.mesh);});
  MB.tokens=[];MB.selToken=null;
  document.getElementById('mb3-sel-overlay').style.display='none';
  mb3RenderTList3();
}
function mb3ShowSelOverlay(tok){
  const el=document.getElementById('mb3-sel-overlay');
  const nm=document.getElementById('mb3-sel-name');
  if(el&&nm){nm.textContent=`${tok.emoji} ${tok.name} · Click tile to move`;el.style.display='block';}
}
function mb3RenderTList3(){
  const el=document.getElementById('mb3-tlist');if(!el)return;
  if(!MB.tokens.length){el.innerHTML='<div style="color:var(--text3);font-size:.72rem;">No tokens placed</div>';return;}
  el.innerHTML=MB.tokens.map((t,i)=>`<div style="display:flex;align-items:center;gap:.28rem;padding:.2rem .3rem;background:var(--bg3);border-radius:2px;font-size:.76rem;margin-bottom:2px;">
    <span style="flex-shrink:0;">${t.emoji}</span>
    <span style="flex:1;color:var(--text2);font-family:Cinzel,serif;font-size:.68rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</span>
    <span style="font-size:.6rem;color:var(--text3);">(${t.x},${t.z})</span>
    <button onclick="MB.tokens[${i}].mesh&&MB.tokenGroup.remove(MB.tokens[${i}].mesh);MB.tokens.splice(${i},1);mb3RenderTList3();" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.75rem;">✕</button>
  </div>`).join('');
}

// STL Parser
function mb3ParseSTL(buffer){
  const view=new DataView(buffer);
  let isBin=false;
  try{const n=view.getUint32(80,true);if(buffer.byteLength===84+n*50)isBin=true;}catch(e){}
  let positions=[];
  if(isBin){
    const n=view.getUint32(80,true);let off=84;
    for(let i=0;i<n;i++){off+=12;for(let v=0;v<3;v++){positions.push(view.getFloat32(off,true),view.getFloat32(off+4,true),view.getFloat32(off+8,true));off+=12;}off+=2;}
  } else {
    const text=new TextDecoder().decode(buffer);
    const matches=text.matchAll(/vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/g);
    for(const m of matches)positions.push(+m[1],+m[2],+m[3]);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(positions),3));
  geo.computeVertexNormals();
  return geo;
}
function mb3ParseOBJ(text){
  const verts=[],positions=[];
  text.split('\n').forEach(line=>{
    const parts=line.trim().split(/\s+/);
    if(parts[0]==='v')verts.push(+parts[1],+parts[2],+parts[3]);
    else if(parts[0]==='f'){
      const idx=parts.slice(1).map(p=>((+p.split('/')[0])-1)*3);
      if(idx.length===3){for(let i=0;i<3;i++)positions.push(verts[idx[i]],verts[idx[i]+1],verts[idx[i]+2]);}
      else if(idx.length===4){
        [0,1,2,0,2,3].forEach(i=>{positions.push(verts[idx[i]],verts[idx[i]+1],verts[idx[i]+2]);});
      }
    }
  });
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(positions),3));
  geo.computeVertexNormals();return geo;
}
function mb3UploadModel(input){
  const file=input.files[0];if(!file)return;
  const isSTL=file.name.toLowerCase().endsWith('.stl');
  const key='model_'+Date.now();
  const reader=new FileReader();
  reader.onload=ev=>{
    try{
      const geo=isSTL?mb3ParseSTL(ev.target.result):mb3ParseOBJ(new TextDecoder().decode(ev.target.result));
      MB.models[key]=geo;MB.selModel=key;
      const el=document.getElementById('mb3-model-list');
      if(el)el.innerHTML=`<div style="color:var(--green2);font-size:.65rem;">✓ ${file.name} loaded — will use for next token</div>`;
      toast('✓ Model loaded: '+file.name,'#3d9b52');
    }catch(e){toast('⚠ Could not parse model: '+e.message,'#c0392b');}
  };
  isSTL?reader.readAsArrayBuffer(file):reader.readAsText(file);
  input.value='';
}

// Measure
function mb3ShowMeasure(){
  if(!MB.measA||!MB.measB)return;
  const dist=Math.sqrt((MB.measB.x-MB.measA.x)**2+(MB.measB.z-MB.measA.z)**2);
  const ft=Math.round(dist*5);
  const el=document.getElementById('mb3-measure-display');
  if(el){el.textContent=`📏 ${ft} ft (${dist.toFixed(1)} tiles)`;el.style.display='block';setTimeout(()=>el.style.display='none',4000);}
  // Draw a line in 3D
  if(MB.measLine)MB.scene.remove(MB.measLine);
  const pts=[new THREE.Vector3(MB.measA.x+0.5,0.2,MB.measA.z+0.5),new THREE.Vector3(MB.measB.x+0.5,0.2,MB.measB.z+0.5)];
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  MB.measLine=new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xe8b84b,linewidth:2}));
  MB.scene.add(MB.measLine);setTimeout(()=>{if(MB.measLine)MB.scene.remove(MB.measLine);},4000);
}

// Tool toggles
function mb3Tool(name,btn){
  MB.tool=name;
  document.querySelectorAll('.mb3-btn').forEach(b=>b.id&&b.id.startsWith('mb3t-')&&b.classList.remove('active'));
  if(btn)btn.classList.add('active');
}
function mb3ToggleGrid(btn){
  MB.showGrid=!MB.showGrid;btn.classList.toggle('active',MB.showGrid);mb3BuildGrid3();
}
function mb3ToggleShadow(btn){
  MB.shadowsOn=!MB.shadowsOn;btn.classList.toggle('active',MB.shadowsOn);
  if(MB.renderer)MB.renderer.shadowMap.enabled=MB.shadowsOn;mb3Rebuild();
}
function mb3ToggleFogMode(btn){
  MB.fogMode=!MB.fogMode;btn.classList.toggle('active',MB.fogMode);mb3RebuildFog3();
}
function mb3ToggleGroundHug(btn){
  MB.groundHug=!MB.groundHug;btn.classList.toggle('active',MB.groundHug);
  btn.title=MB.groundHug?'Ground Hug ON — layers stack on tiles below':'Ground Hug OFF — layers float at fixed height';
  mb3Rebuild();toast(MB.groundHug?'↕ Ground Hug ON — blocks stack on tiles':'↕ Ground Hug OFF — fixed layer heights','#e8b84b');
}
function mb3ToggleModels(btn){
  MB.modelsEnabled=!MB.modelsEnabled;btn.classList.toggle('active',MB.modelsEnabled);
  btn.title=MB.modelsEnabled?'3D Models ON':'3D Models OFF — use figures';
  // Rebuild all tokens
  MB.tokens.forEach(tok=>{if(tok.mesh)MB.tokenGroup.remove(tok.mesh);tok.mesh=mb3BuildTokMesh(tok);MB.tokenGroup.add(tok.mesh);});
  toast(MB.modelsEnabled?'🧊 3D Models enabled':'🧊 3D Models disabled — using figures','#e8b84b');
}

// Resize map
function mb3ResizeMap(newG){
  if(!confirm('Resize map? Current map will be cleared.'))return;
  MB.G=newG;mb3GridInit();MB.layers=[];MB.tokens.forEach(t=>{if(t.mesh)MB.tokenGroup.remove(t.mesh);});MB.tokens=[];
  if(MB.rayFloor){MB.rayFloor.geometry.dispose();MB.rayFloor.geometry=new THREE.PlaneGeometry(newG*8,newG*8);MB.rayFloor.position.set(newG/2,0,newG/2);}
  mb3Rebuild();mb3ResetCam();mb3RenderLayerList3();mb3RenderTList3();
}

// Sync combatants to 3D map
function syncCombatantsToMap(){
  const typeColor={player:0x1e3a5a,enemy:0x3a1a1a,ally:0x1a3a1a};
  const typeRing={player:0xe8b84b,enemy:0xc0392b,ally:0x3d9b52};
  const typeEmoji={player:'🧙',enemy:'💀',ally:'✨'};
  state.combatants.forEach((c,i)=>{
    if(MB.tokens.find(t=>t.combatantId===c.id))return;
    if(c.dead)return;
    const ch=state.characters.find(ch=>ch.name===c.name&&ch.type==='player');
    const emoji=ch?getClassEmoji(ch.class):(typeEmoji[c.type]||'⚔');
    const tok={id:Date.now()+Math.random(),x:3+(i%6)*3,z:3+Math.floor(i/6)*3,name:c.name,emoji,type:c.type,sz:1,layer:0,col:typeColor[c.type]||0x1e2a3a,ring:typeRing[c.type]||0xe8b84b,model:null,combatantId:c.id,mesh:null};
    tok.mesh=mb3BuildTokMesh(tok);MB.tokenGroup.add(tok.mesh);MB.tokens.push(tok);
  });
  MB.tokens=MB.tokens.filter(t=>{
    if(!t.combatantId)return true;
    const alive=state.combatants.find(c=>c.id===t.combatantId&&!c.dead);
    if(!alive&&t.mesh)MB.tokenGroup.remove(t.mesh);
    return!!alive;
  });
  mb3RenderTList3();
}

// Clear map
function mb3ClearMap(){
  if(!confirm('Clear entire 3D map?'))return;
  mb3HistPush();mb3GridInit();MB.layers=[];mb3Rebuild();mb3RenderLayerList3();
}

// Export PNG
function mb3ExportPNG(){
  if(!MB.renderer)return;
  MB.renderer.render(MB.scene,MB.camera);
  const a=document.createElement('a');a.download='dnd-3d-map.png';a.href=MB.renderer.domElement.toDataURL('image/png');a.click();
}

// Save/Load JSON
function mb3SaveMap(){
  const data={v:3,G:MB.G,bgName:MB.bgName,tiles:MB.tiles,fog:MB.fog,layers:MB.layers.map(l=>({name:l.name,tiles:l.tiles})),tokens:MB.tokens.map(t=>({x:t.x,z:t.z,name:t.name,emoji:t.emoji,type:t.type,sz:t.sz,layer:t.layer}))};
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dnd-3d-map.json';a.click();
}
function mb3LoadMapFile(input){
  const file=input.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      MB.G=d.G||30;mb3GridInit();
      if(d.tiles)MB.tiles=d.tiles;if(d.fog)MB.fog=d.fog;
      MB.bgName=d.bgName||'dungeon';
      MB.layers=(d.layers||[]).map(l=>({name:l.name,tiles:l.tiles,visible:true}));
      MB.tokens.forEach(t=>{if(t.mesh)MB.tokenGroup.remove(t.mesh);});MB.tokens=[];
      (d.tokens||[]).forEach(t=>{
        const tok={...t,col:MB_TOK_COLORS[t.type]||0x1e2a3a,ring:MB_TOK_RINGS[t.type]||0xe8b84b,model:null,combatantId:null,mesh:null};
        tok.mesh=mb3BuildTokMesh(tok);MB.tokenGroup.add(tok.mesh);MB.tokens.push(tok);
      });
      mb3ApplyBG(MB.bgName);mb3Rebuild();mb3ResetCam();mb3RenderLayerList3();mb3RenderTList3();
      toast('✓ 3D Map loaded!','#3d9b52');
    }catch(e){toast('⚠ Load failed: '+e.message,'#c0392b');}
  };
  r.readAsText(file);input.value='';
}

// Presets
function mb3LoadPreset(name){
  if(!confirm('Load preset? Current map will be replaced.'))return;
  mb3HistPush();mb3GridInit();MB.layers=[];
  const G=MB.G;
  const fill=(x0,z0,x1,z1,t)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)if(x>=0&&z>=0&&x<G&&z<G)MB.tiles[z][x]=t;};
  const wall=(x0,z0,x1,z1)=>{for(let x=x0;x<=x1;x++){MB.tiles[z0][x]=MB.tiles[z1][x]='stone_wall';}for(let z=z0;z<=z1;z++){MB.tiles[z][x0]=MB.tiles[z][x1]='stone_wall';}};
  const corridor=(x0,z0,x1,z1)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)if(x>=0&&z>=0&&x<G&&z<G)MB.tiles[z][x]='stone_floor';};

  if(name==='dungeon'){
    // Classic multi-room dungeon with corridors connecting rooms
    MB.bgName='dungeon';fill(0,0,G-1,G-1,'void');
    // Rooms
    const rooms=[[2,2,10,9],[12,2,20,9],[2,11,10,19],[12,11,22,19],[16,4,20,8]];
    rooms.forEach(([x0,z0,x1,z1])=>{fill(x0,z0,x1,z1,'stone_floor');wall(x0,z0,x1,z1);});
    // Corridors between rooms
    corridor(10,5,12,6);corridor(10,14,12,15);corridor(6,9,7,11);corridor(16,9,17,11);
    // Doors
    MB.tiles[5][10]='door_c';MB.tiles[14][10]='door_o';MB.tiles[9][6]='door_c';MB.tiles[9][15]='door_o';
    // Furnishings
    MB.tiles[3][3]='altar';MB.tiles[4][3]='chest';MB.tiles[3][4]='pillar';MB.tiles[8][3]='pillar';
    MB.tiles[3][8]='pillar';MB.tiles[8][8]='pillar';
    MB.tiles[14][3]='bookshelf';MB.tiles[15][3]='bookshelf';MB.tiles[19][3]='throne';
    MB.tiles[18][7]='trap';MB.tiles[13][17]='magic_circ';MB.tiles[14][17]='magic_circ';
    MB.tiles[13][18]='magic_circ';MB.tiles[14][18]='magic_circ';
    MB.tiles[20][12]='campfire';MB.tiles[3][14]='rubble';MB.tiles[4][14]='rubble';
    MB.tiles[8][17]='chest';MB.tiles[8][18]='barrel';MB.tiles[9][18]='barrel';
    MB.bgName='dungeon';
  } else if(name==='tavern'){
    // Tavern with common room, bar, kitchen, upstairs entrance
    MB.bgName='tavern';fill(0,0,G-1,G-1,'grass');
    // Main building
    fill(2,2,22,20,'wood_floor');wall(2,2,22,20);
    // Bar counter area
    fill(14,3,20,8,'flagstone');wall(14,3,20,8);MB.tiles[4][14]='door_o';MB.tiles[5][14]='door_o';
    // Front entrance
    MB.tiles[3][12]='door_o';MB.tiles[3][13]='door_o';
    // Pillars
    [[5,4],[5,10],[5,16],[11,4],[11,10],[11,16],[19,10],[19,16]].forEach(([z,x])=>MB.tiles[z][x]='pillar');
    // Fireplace & bar
    MB.tiles[4][15]='campfire';MB.tiles[5][15]='campfire';
    MB.tiles[4][19]='barrel';MB.tiles[5][19]='barrel';MB.tiles[6][19]='barrel';
    // Seating tables (altars as tables)
    [[7,5],[7,9],[7,13],[12,5],[12,9],[12,13],[17,5],[17,9]].forEach(([z,x])=>MB.tiles[z][x]='altar');
    // Storage / shelves
    MB.tiles[4][16]='bookshelf';MB.tiles[4][17]='bookshelf';MB.tiles[4][18]='bookshelf';
    MB.tiles[19][3]='chest';MB.tiles[19][4]='chest';
    // Stairs
    MB.tiles[19][20]='stairs_up';
  } else if(name==='cave'){
    // Organic cavern system with underground lake
    MB.bgName='dungeon';fill(0,0,G-1,G-1,'void');
    // Main cavern chambers (irregular shapes via overlapping fills)
    fill(3,3,13,11,'stone_floor');fill(5,5,15,15,'stone_floor');
    fill(13,3,22,10,'stone_floor');fill(15,10,25,18,'stone_floor');
    fill(7,13,16,22,'stone_floor');fill(4,18,10,26,'stone_floor');
    // Underground lake
    fill(17,12,23,16,'water');fill(18,13,22,15,'deep_water');
    // Stalagmites & rubble
    [[4,4],[4,9],[9,3],[12,9],[14,14],[6,14],[8,19],[3,20]].forEach(([z,x])=>MB.tiles[z][x]='stone_wall');
    // Features
    MB.tiles[6][7]='magic_circ';MB.tiles[7][7]='magic_circ';MB.tiles[6][8]='magic_circ';
    MB.tiles[4][15]='chest';MB.tiles[5][15]='rubble';MB.tiles[5][16]='rubble';
    MB.tiles[18][8]='campfire';MB.tiles[12][20]='altar';
    MB.tiles[9][17]='trap';MB.tiles[10][4]='blood';MB.tiles[11][4]='blood';
    MB.tiles[20][17]='teleport';MB.tiles[21][17]='teleport';
  } else if(name==='keep'){
    // Walled fortress keep with courtyard, towers, inner keep
    MB.bgName='dungeon';fill(0,0,G-1,G-1,'grass');
    // Outer wall + courtyard
    fill(2,2,G-3,G-3,'flagstone');wall(2,2,G-3,G-3);
    // Corner towers
    [[2,2,5,5],[G-6,2,G-3,5],[2,G-6,5,G-3],[G-6,G-6,G-3,G-3]].forEach(([x0,z0,x1,z1])=>{fill(x0,z0,x1,z1,'stone_floor');wall(x0,z0,x1,z1);});
    // Inner keep (throne room)
    fill(8,8,G-9,G-9,'stone_floor');wall(8,8,G-9,G-9);
    // Gates
    const mid=Math.floor(G/2);
    MB.tiles[mid][G-3]='door_o';MB.tiles[mid+1][G-3]='door_o';
    MB.tiles[mid][2]='door_c';MB.tiles[mid+1][2]='door_c';
    MB.tiles[mid][8]='door_o';MB.tiles[mid+1][8]='door_o';
    // Keep interior features
    MB.tiles[mid][9]='throne';MB.tiles[mid][G-10]='altar';
    // Courtyard pillars
    [5,7,G-8,G-6].forEach(x=>{[5,G-6].forEach(z=>MB.tiles[z][x]='pillar');});
    // Keep pillars & furnishings
    [9,11,G-10,G-12].forEach(x=>{[9,G-10].forEach(z=>MB.tiles[z][x]='pillar');});
    MB.tiles[10][10]='bookshelf';MB.tiles[10][11]='bookshelf';
    MB.tiles[10][G-11]='chest';MB.tiles[11][G-11]='chest';
    MB.tiles[G-11][mid]='magic_circ';MB.tiles[G-11][mid+1]='magic_circ';
  } else if(name==='forest'){
    // Forest clearing with ruins and stream
    MB.bgName='forest';fill(0,0,G-1,G-1,'forest');
    // Central clearing
    fill(7,7,G-8,G-8,'grass');
    // Stream running diagonally
    for(let i=0;i<G;i++){const x=Math.min(G-1,Math.max(0,Math.floor(G*0.75-i*0.3)));if(x>=0&&x<G)MB.tiles[i][x]='water';}
    // Pond
    fill(18,18,21,21,'water');MB.tiles[19][19]='deep_water';MB.tiles[20][19]='deep_water';
    // Ancient ruins
    fill(9,9,13,13,'flagstone');
    [9,10,11,12,13].forEach(x=>{MB.tiles[9][x]='stone_wall';MB.tiles[13][x]='stone_wall';});
    MB.tiles[9][9]='pillar';MB.tiles[9][13]='pillar';MB.tiles[13][9]='pillar';MB.tiles[13][13]='pillar';
    // Campsite
    MB.tiles[18][10]='campfire';MB.tiles[19][10]='barrel';MB.tiles[19][11]='barrel';
    // Paths
    for(let z=0;z<G;z++)MB.tiles[z][Math.floor(G/2)]='dirt_floor';
    for(let x=0;x<G;x++)MB.tiles[Math.floor(G/2)][x]='dirt_floor';
    // Scattered debris
    [[5,5],[5,G-6],[G-6,5],[G-6,G-6],[11,11]].forEach(([z,x])=>MB.tiles[z][x]='rubble');
    MB.tiles[11][11]='altar';MB.tiles[11][10]='magic_circ';
  } else if(name==='sewer'){
    // Underground sewer network
    MB.bgName='dungeon';fill(0,0,G-1,G-1,'void');
    // Main channels
    corridor(0,Math.floor(G/2)-1,G-1,Math.floor(G/2)+1);
    corridor(Math.floor(G/2)-1,0,Math.floor(G/2)+1,G-1);
    // Side channels
    corridor(0,8,G-1,9);corridor(0,G-10,G-1,G-9);
    corridor(8,0,9,G-1);corridor(G-10,0,G-9,G-1);
    // Chambers at intersections
    [[7,7,11,11],[7,G-12,11,G-8],[G-12,7,G-8,11],[G-12,G-12,G-8,G-8]].forEach(([x0,z0,x1,z1])=>{fill(x0,z0,x1,z1,'stone_floor');wall(x0,z0,x1,z1);});
    // Water channels in corridors
    for(let x=0;x<G;x++){MB.tiles[Math.floor(G/2)][x]='water';}
    for(let z=0;z<G;z++){MB.tiles[z][Math.floor(G/2)]='water';}
    // Walkways alongside main channels
    for(let x=0;x<G;x++){
      if(MB.tiles[Math.floor(G/2)-1][x]==='void'&&x!==Math.floor(G/2))MB.tiles[Math.floor(G/2)-1][x]='stone_floor';
      if(MB.tiles[Math.floor(G/2)+1][x]==='void'&&x!==Math.floor(G/2))MB.tiles[Math.floor(G/2)+1][x]='stone_floor';
    }
    // Sludge & hazards
    [[5,3],[3,G-6],[G-5,4],[G-4,G-5]].forEach(([z,x])=>MB.tiles[z][x]='lava_floor');
    MB.tiles[4][4]='trap';MB.tiles[G-5][G-5]='trap';
    MB.tiles[8][8]='chest';MB.tiles[G-9][G-9]='chest';
    MB.bgName='dungeon';
  } else if(name==='shrine'){
    // Temple / shrine with ceremonial chambers
    MB.bgName='dungeon';fill(0,0,G-1,G-1,'void');
    // Grand hall
    fill(4,2,G-5,G-3,'flagstone');wall(4,2,G-5,G-3);
    // Inner sanctuary
    fill(8,5,G-9,G-6,'stone_floor');wall(8,5,G-9,G-6);
    // Side chapels
    fill(4,5,7,G-6,'flagstone');wall(4,5,7,G-6);
    fill(G-8,5,G-5,G-6,'flagstone');wall(G-8,5,G-5,G-6);
    // Entrance
    const mid=Math.floor(G/2);
    MB.tiles[2][mid]='door_o';MB.tiles[2][mid+1]='door_o';
    MB.tiles[5][mid]='door_c';MB.tiles[5][mid+1]='door_c';
    // Main altar
    MB.tiles[mid][mid]='altar';MB.tiles[mid][mid+1]='altar';
    MB.tiles[mid+1][mid]='altar';MB.tiles[mid+1][mid+1]='altar';
    // Magic circles around altar
    [[mid-1,mid],[mid+2,mid],[mid,mid-1],[mid,mid+2]].forEach(([z,x])=>MB.tiles[z][x]='magic_circ');
    // Candles & pillars
    [6,8,10,G-9,G-7,G-5].forEach(x=>{MB.tiles[3][x]='pillar';MB.tiles[G-4][x]='pillar';});
    MB.tiles[3][6]='campfire';MB.tiles[3][G-7]='campfire';
    // Side chapel furnishings
    MB.tiles[7][5]='bookshelf';MB.tiles[7][6]='bookshelf';MB.tiles[G-8][G-7]='chest';
    MB.tiles[6][5]='teleport';MB.tiles[G-7][G-6]='teleport';
    MB.bgName='dungeon';
  }
  mb3ApplyBG(MB.bgName);mb3Rebuild();mb3ResetCam();mb3RenderLayerList3();
  toast('✓ Preset "'+name+'" loaded!','#e8b84b');
}

// Keyboard shortcuts for map
function mb3Key3D(e){
  if(!document.getElementById('page-map')?.classList.contains('active'))return;
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  const k=e.key.toLowerCase();
  if(e.ctrlKey&&k==='z'){e.preventDefault();mb3Undo();}
  else if(e.ctrlKey&&(k==='y'||k==='r')){e.preventDefault();mb3Redo();}
  else if(k==='p')mb3Tool('paint',document.getElementById('mb3t-paint'));
  else if(k==='e')mb3Tool('erase',document.getElementById('mb3t-erase'));
  else if(k==='f')mb3Tool('fill',document.getElementById('mb3t-fill'));
  else if(k==='t')mb3Tool('token',document.getElementById('mb3t-token'));
  else if(k==='m')mb3Tool('move',document.getElementById('mb3t-move'));
  else if(k==='+')mb3ZoomIn();
  else if(k==='-')mb3ZoomOut();
  else if(k==='r'&&!e.ctrlKey)mb3ResetCam();
  else if(k==='g')mb3ToggleGrid(document.getElementById('mb3t-grid'));
  else if(k==='escape'){MB.selToken=null;document.getElementById('mb3-sel-overlay').style.display='none';}
}

// UI builders
function mb3BuildPalette3(){
  const el=document.getElementById('mb3-palette');if(!el)return;
  const colMap={stone_floor:'#4a4040',stone_wall:'#1e1a18',flagstone:'#5a5048',wood_floor:'#7b5230',dirt_floor:'#5c3d1a',pit:'#080606',grass:'#2d5a1b',forest:'#1a3a10',water:'#1a4a6b',deep_water:'#0a1e3a',lava_floor:'#8b2000',sand:'#c8a44a',snow:'#dce8f0',ice_floor:'#b8d8e8',swamp:'#3a4a20',mountain:'#6a6058',pillar:'#5a5048',door_c:'#7b5230',door_o:'#3a2810',stairs_up:'#5a5048',altar:'#3a2a48',chest:'#8b6020',campfire:'#1a0e08',bookshelf:'#5a3010',throne:'#3a2a10',trap:'#3a0a0a',barrel:'#5a3c1e',magic_circ:'#0a0818',teleport:'#1a0a2a',blood:'#4a0a0a',rubble:'#3a3228',void:'#000000'};
  let html='';
  MB_PALETTE_CATS.forEach(cat=>{
    html+=`<div class="mb3-cat">${cat.cat}</div>`;
    cat.tiles.forEach(t=>{
      const col=colMap[t]||'#333';
      const nameMap={stone_floor:'Stone Floor',stone_wall:'Stone Wall',flagstone:'Flagstone',wood_floor:'Wood Floor',dirt_floor:'Dirt',pit:'Pit',grass:'Grass',forest:'Forest',water:'Water',deep_water:'Deep Water',lava_floor:'Lava',sand:'Sand',snow:'Snow',ice_floor:'Ice',swamp:'Swamp',mountain:'Mountain',pillar:'Pillar',door_c:'Door Closed',door_o:'Door Open',stairs_up:'Stairs Up',altar:'Altar',chest:'Chest',campfire:'Campfire',bookshelf:'Bookshelf',throne:'Throne',trap:'Trap',barrel:'Barrel',magic_circ:'Magic Circle',teleport:'Teleporter',blood:'Blood',rubble:'Rubble',void:'Void'};const name=nameMap[t]||t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      html+=`<div class="mb3-tile-chip${MB.selTile===t?' active':''}" onclick="mb3SelTile('${t}',this)">
        <div class="mb3-tile-dot" style="background:${col};${t==='lava_floor'?'box-shadow:0 0 4px #f63;':''}${t==='magic_circ'?'box-shadow:0 0 4px #7a4aff;':''}"></div>
        <span class="mb3-tile-name">${name}</span>
      </div>`;
    });
  });
  el.innerHTML=html;
}
function mb3SelTile(t,el){
  MB.selTile=t;
  document.querySelectorAll('.mb3-tile-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  const dot=el.querySelector('.mb3-tile-dot');
  const nm=document.getElementById('mb3-prev-name');
  const pd=document.getElementById('mb3-prev-dot');
  if(pd&&dot){pd.style.background=dot.style.background;pd.style.boxShadow=dot.style.boxShadow||'';}
  if(nm)nm.textContent=t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function mb3BuildBGList3(){
  const el=document.getElementById('mb3-bg-list');if(!el)return;
  el.innerHTML=Object.entries(MB_BG_DEFS).map(([k,v])=>`<button class="mb3-bg-btn${MB.bgName===k?' active':''}" data-bg="${k}" onclick="mb3ApplyBG('${k}')">${v.icon} ${v.name}</button>`).join('');
}
function mb3BuildEmojiPicker3(){
  const el=document.getElementById('mb3-emoji-picker');if(!el)return;
  el.innerHTML=MB_EMOJIS.map(e=>`<span title="${e}" onclick="MB.selEmoji='${e}';document.querySelectorAll('#mb3-emoji-picker span').forEach(s=>s.style.outline='none');this.style.outline='2px solid var(--gold)'" style="font-size:1.1rem;cursor:pointer;padding:1px;border-radius:3px;${e===MB.selEmoji?'outline:2px solid var(--gold);':''}">${e}</span>`).join('');
}

// showPage override for map stop/start

// ===== SESSION LOG =====
let sessionLog=[];
function logEvent(type,msg,cls){
  sessionLog.unshift({type,msg,cls,time:new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})});
  if(sessionLog.length>200)sessionLog.pop();
  const el=document.getElementById('session-log-list');
  if(el)el.innerHTML=sessionLog.slice(0,30).map(e=>`<div class="log-entry"><span class="log-time">${e.time}</span><span class="${e.cls||''}">${e.msg}</span></div>`).join('');
  const cnt=document.getElementById('session-log-count');if(cnt)cnt.textContent=sessionLog.length+' events';
}
function clearSessionLog(){sessionLog=[];const el=document.getElementById('session-log-list');if(el)el.innerHTML='';const cnt=document.getElementById('session-log-count');if(cnt)cnt.textContent='';}
function exportSessionLog(){
  if(!sessionLog.length)return alert('No log entries yet.');
  const text=sessionLog.map(e=>e.time+' — '+e.msg).reverse().join('\n');
  const blob=new Blob([text],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='session-log-'+(state.campaignInfo?.name||'campaign').replace(/[^a-z0-9]/gi,'_')+'.txt';a.click();
}

// ===== ENCOUNTER BUILDER =====
let encMonsters=[]; // {name, cr, count, xp}
const CR_XP={0:10,'1/8':25,'1/4':50,'1/2':100,1:200,2:450,3:700,4:1100,5:1800,6:2300,7:2900,8:3900,9:5000,10:5900,11:7200,12:8400,13:10000,14:11500,15:13000,16:15000,17:18000,18:20000,19:22000,20:25000,21:33000,22:41000,23:50000,24:62000,25:75000,26:90000,27:105000,28:120000,29:135000,30:155000};
const XP_THRESHOLDS={1:[25,50,75,100],2:[50,100,150,200],3:[75,150,225,400],4:[125,250,375,500],5:[250,500,750,1100],6:[300,600,900,1400],7:[350,750,1100,1700],8:[450,900,1400,2100],9:[550,1100,1600,2400],10:[600,1200,1900,2800],11:[800,1600,2400,3600],12:[1000,2000,3000,4500],13:[1100,2200,3400,5100],14:[1250,2500,3800,5700],15:[1400,2800,4300,6400],16:[1600,3200,4800,7200],17:[2000,3900,5900,8800],18:[2100,4200,6300,9500],19:[2400,4900,7300,10900],20:[2800,5700,8500,12700]};
const MULT_TABLE=[[1,1,1.5,2,2,2],[1,1.5,2,2,2.5,2.5],[1.5,2,2.5,2.5,2.5,3]];

function crToXP(cr){const k=String(cr);return CR_XP[k]||CR_XP[parseFloat(k)]||0;}

function calcEncounterDifficulty(){
  const players=parseInt(document.getElementById('enc-players')?.value)||4;
  const level=parseInt(document.getElementById('enc-level')?.value)||5;
  const threshRow=XP_THRESHOLDS[Math.min(20,level)]||XP_THRESHOLDS[5];
  const [easy,med,hard,deadly]=threshRow.map(v=>v*players);
  ['easy','med','hard','deadly'].forEach((d,i)=>{
    const el=document.getElementById('enc-thresh-'+d);
    if(el)el.textContent=([easy,med,hard,deadly][i]).toLocaleString();
  });
  // Calculate monster XP
  let totalXP=0, totalCount=0;
  encMonsters.forEach(m=>{totalXP+=crToXP(m.cr)*(m.count||1);totalCount+=(m.count||1);});
  // Multiplier
  const playerRow=players<3?0:players<6?1:2;
  const monsterCol=totalCount===1?0:totalCount===2?1:totalCount<=6?2:totalCount<=10?3:totalCount<=14?4:5;
  const mult=MULT_TABLE[playerRow][monsterCol]||1;
  const adjXP=Math.round(totalXP*mult);
  const mxpEl=document.getElementById('enc-monster-xp');
  const axpEl=document.getElementById('enc-adj-xp');
  if(mxpEl)mxpEl.textContent=totalXP.toLocaleString();
  if(axpEl)axpEl.textContent=adjXP.toLocaleString();
  // Difficulty
  let diff='Easy',cls='enc-easy';
  if(adjXP>=deadly){diff='DEADLY';cls='enc-deadly';}
  else if(adjXP>=hard){diff='Hard';cls='enc-hard';}
  else if(adjXP>=med){diff='Medium';cls='enc-medium';}
  const dlbl=document.getElementById('enc-diff-label');
  if(dlbl){dlbl.textContent=diff;dlbl.className='enc-difficulty '+cls;}
  const bar=document.getElementById('enc-diff-bar');
  if(bar){
    const pct=deadly>0?Math.min(100,adjXP/deadly*100):0;
    const col=cls==='enc-deadly'?'#e74c3c':cls==='enc-hard'?'#f39c12':cls==='enc-medium'?'#f9e79f':'#58d68d';
    bar.style.width=pct+'%';bar.style.background=col;
  }
}

function loadPartyToEnc(){
  const players=state.characters.filter(c=>c.type==='player');
  if(!players.length)return alert('No player characters found.');
  if(document.getElementById('enc-players'))document.getElementById('enc-players').value=players.length;
  const avgLvl=Math.round(players.reduce((a,c)=>a+parseInt(c.level||1),0)/players.length);
  if(document.getElementById('enc-level'))document.getElementById('enc-level').value=avgLvl;
  calcEncounterDifficulty();
  toast('✓ Loaded '+players.length+' players at avg level '+avgLvl);
}

let encSearchDebounce=null;
async function searchEncMonster(){
  const q=document.getElementById('enc-monster-search')?.value.trim();
  if(!q||q.length<2)return;
  clearTimeout(encSearchDebounce);
  encSearchDebounce=setTimeout(async()=>{
    const res=document.getElementById('enc-monster-results');if(!res)return;
    res.innerHTML='<div style="color:var(--text3);font-size:.78rem;padding:.3rem;">Searching...</div>';
    try{
      const data=await libFetch('https://api.open5e.com/v1/monsters/?search='+encodeURIComponent(q)+'&limit=8');
      const monsters=data.results||[];
      if(!monsters.length){res.innerHTML='<div style="color:var(--text3);font-size:.78rem;padding:.3rem;">No results</div>';return;}
      res.innerHTML=monsters.map(m=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.3rem .5rem;border-bottom:1px solid rgba(74,58,37,.2);cursor:pointer;background:var(--bg3);font-size:.82rem;" onclick="addEncMonster('${m.name.replace(/'/g,"\\'")}','${m.challenge_rating}')">
        <span style="color:var(--text2);">${m.name}</span>
        <span style="color:var(--gold3);font-family:Cinzel,serif;font-size:.72rem;">CR ${m.challenge_rating}</span>
      </div>`).join('');
    }catch{res.innerHTML='<div style="color:var(--red2);font-size:.78rem;padding:.3rem;">Search failed</div>';}
  },350);
}

function addEncMonster(name,cr,count){
  count=count||1;
  const existing=encMonsters.find(m=>m.name===name);
  if(existing){existing.count+=count;}
  else{encMonsters.push({name,cr,count});}
  renderEncMonsters();calcEncounterDifficulty();
}
function addManualEncMonster(){
  const name=document.getElementById('enc-manual-name')?.value.trim()||'Custom Monster';
  const cr=parseFloat(document.getElementById('enc-manual-cr')?.value)||1;
  const count=parseInt(document.getElementById('enc-manual-count')?.value)||1;
  addEncMonster(name,cr,count);
  if(document.getElementById('enc-manual-name'))document.getElementById('enc-manual-name').value='';
}
function removeEncMonster(i){encMonsters.splice(i,1);renderEncMonsters();calcEncounterDifficulty();}
function clearEncounter(){encMonsters=[];renderEncMonsters();calcEncounterDifficulty();}
function renderEncMonsters(){
  const el=document.getElementById('enc-monster-list');if(!el)return;
  if(!encMonsters.length){el.innerHTML='<div class="text-dim" style="padding:.4rem;">No monsters added yet</div>';return;}
  el.innerHTML=encMonsters.map((m,i)=>`<div class="enc-monster-row">
    <div style="flex:1;font-family:Cinzel,serif;font-size:.8rem;color:var(--gold3);">${m.name}</div>
    <div style="color:var(--text3);font-size:.75rem;">CR ${m.cr} · ${crToXP(m.cr).toLocaleString()} XP</div>
    <div style="display:flex;align-items:center;gap:.3rem;">
      <button onclick="encMonsters[${i}].count=Math.max(1,encMonsters[${i}].count-1);renderEncMonsters();calcEncounterDifficulty()" style="background:var(--bg2);border:1px solid var(--border);color:var(--text2);width:22px;height:22px;cursor:pointer;font-size:.85rem;border-radius:2px;">−</button>
      <span style="font-family:Cinzel,serif;font-size:.85rem;color:var(--text);min-width:20px;text-align:center;">${m.count}</span>
      <button onclick="encMonsters[${i}].count++;renderEncMonsters();calcEncounterDifficulty()" style="background:var(--bg2);border:1px solid var(--border);color:var(--text2);width:22px;height:22px;cursor:pointer;font-size:.85rem;border-radius:2px;">+</button>
    </div>
    <button onclick="removeEncMonster(${i})" style="background:none;border:none;color:var(--red2);cursor:pointer;font-size:.9rem;">✕</button>
  </div>`).join('');
}

function sendEncToInitiative(){
  if(!encMonsters.length)return alert('Add some monsters first!');
  // Better HP/AC estimates based on CR
  const crToHP={0:3,'1/8':7,'1/4':13,'1/2':22,1:32,2:52,3:65,4:84,5:110,6:120,7:135,8:153,9:171,10:195,11:216,12:227,13:250,14:266,15:285,16:300,17:322,18:340,19:362,20:385};
  const crToAC={0:10,'1/8':11,'1/4':12,'1/2':12,1:13,2:13,3:13,4:14,5:15,6:15,7:15,8:16,9:16,10:17,11:17,12:17,13:18,14:18,15:18,16:18,17:19,18:19,19:19,20:19};
  encMonsters.forEach(m=>{
    for(let i=0;i<m.count;i++){
      const cr=m.cr;
      const hp=crToHP[cr]||Math.max(1,Math.round((parseFloat(cr)||1)*8+4));
      const ac=crToAC[cr]||Math.max(10,Math.round(11+(parseFloat(cr)||1)/4));
      const suffix=m.count>1?' '+(i+1):'';
      state.combatants.push({name:m.name+suffix,hp,maxHp:hp,ac,init:rollDie(20),type:'enemy',conditions:[],dead:false,id:Date.now()+Math.random()});
    }
  });
  renderInitiative();save();syncCombatantsToMap();
  logEvent('turn','⚔ Encounter started: '+encMonsters.map(m=>m.count+'× '+m.name).join(', '),'log-kill');
  showPage('initiative');
  toast('⚔ '+encMonsters.reduce((a,m)=>a+m.count,0)+' monsters sent to Initiative!');
}

function generateLootFromEnc(){
  if(!encMonsters.length)return alert('Add monsters to the encounter first!');
  const maxCR=Math.max(...encMonsters.map(m=>parseFloat(m.cr)||1));
  const tier=maxCR>=17?'17':maxCR>=11?'11':maxCR>=5?'5':'0';
  document.getElementById('loot-cr').value=tier;
  openLootGen();generateLoot();
}

// ===== NPC GENERATOR =====
const NPC_NAMES_F=['Aelindra','Briseis','Caelynn','Denna','Elara','Fiora','Galadriel','Halia','Ilyra','Jasmine','Kira','Lyra','Mirela','Nessa','Ophelia','Phaedra','Quilara','Rosamund','Sabel','Talia','Ursula','Vex','Wren','Xyla','Ysolde','Zara'];
const NPC_NAMES_M=['Aldric','Bran','Cedric','Dorian','Elan','Finn','Gareth','Hadrian','Ivar','Jorn','Kael','Leofric','Maren','Nolan','Oswin','Peren','Quinn','Rolan','Soren','Tobias','Uther','Varen','Wulfric','Xander','Yosef','Zoltan'];
const NPC_APPEARANCES=['Weathered face with deep-set eyes','Immaculate clothing despite the road','Nervous hands that never stop moving','A scar running from ear to chin','Surprisingly warm and genuine smile','Eyes that seem to catalogue everything','Mismatched boots and a tattered cloak','A single braid adorned with small beads','Calloused hands of someone who works hard','Always perfectly still — unnervingly so','Elaborate tattoos visible at the collar','A prosthetic limb of curious craftsmanship'];
const NPC_PERSONALITIES=['Suspicious of everyone until proven otherwise','Unfailingly cheerful even in dire situations','Speaks only in facts, never opinions','Compulsively tells long-winded stories','Deeply religious and references it often','Quick to anger but quicker to forgive','Measured and deliberate in every action','Hides fear behind bravado and loud laughter','Genuinely kind but terribly naive','Obsessively organized and rules-focused','Speaks in riddles when stressed','Mourning something they never discuss'];
const NPC_IDEALS=['Loyalty to those who earn it above all else','Knowledge is the only true power','Order keeps people safe from themselves','Freedom is worth any price','Every life has equal worth, high or low','The strong must protect the weak','Family — blood or chosen — is everything','Justice, even when the law fails it'];
const NPC_BONDS=['Owes a debt to someone in the party\'s network','Protecting a secret that could ruin everything','Searching for a missing family member','Deeply loyal to a corrupt institution','Trying to atone for one terrible mistake','In love with someone completely wrong for them'];
const NPC_FLAWS=['Drinks too much when stressed','Cannot resist showing off their expertise','Crippling fear of one specific thing','Lies reflexively, even when truth is better','Jealous of anyone with more status','Utterly incapable of asking for help'];
const NPC_SECRETS=['Has been reporting to a rival faction','Not who they claim to be — identity is stolen','Knows the true location of something important','Responsible for something they\'ve blamed on another','Has a family they\'ve hidden for their protection'];
const NPC_VOICES=['Speaks with a thick regional accent','Unusually formal and archaic in speech','Whispers even in normal conversation','Laughs loudly and often at their own jokes','Long pauses before answering anything','Talks very fast when excited, trails off otherwise'];

let lastGeneratedNPC=null;
function openNPCGen(){document.getElementById('npc-modal').classList.add('open');}
function generateNPC(){
  const rand=arr=>arr[Math.floor(Math.random()*arr.length)];
  const male=Math.random()<0.5;
  const name=rand(male?NPC_NAMES_M:NPC_NAMES_F);
  const type=document.getElementById('npc-cr')?.value||'any';
  const typeDesc={commoner:'Commoner',merchant:'Merchant',guard:'Guard',noble:'Noble',criminal:'Criminal',mage:'Mage',priest:'Priest',villain:'Villain',adventurer:'Retired Adventurer',any:''}[type]||'';
  const races=['Human','Elf','Half-Elf','Dwarf','Halfling','Tiefling','Dragonborn','Gnome'];
  const race=rand(races);
  const age=20+Math.floor(Math.random()*60);
  lastGeneratedNPC={name,race,age,gender:male?'Male':'Female',occupation:typeDesc||rand(['Innkeeper','Merchant','Farmer','Soldier','Artisan','Scholar','Priest','Thief']),appearance:rand(NPC_APPEARANCES),personality:rand(NPC_PERSONALITIES),ideal:rand(NPC_IDEALS),bond:rand(NPC_BONDS),flaw:rand(NPC_FLAWS),secret:rand(NPC_SECRETS),voice:rand(NPC_VOICES)};
  const n=lastGeneratedNPC;
  document.getElementById('npc-output').innerHTML=`<div class="npc-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.85rem;">
      <div>
        <div style="font-family:'Cinzel Decorative',cursive;font-size:1.3rem;color:var(--gold2);">${n.name}</div>
        <div style="font-family:Cinzel,serif;font-size:.72rem;color:var(--text3);letter-spacing:1px;text-transform:uppercase;">${n.gender} ${n.race} · Age ${n.age}${n.occupation?' · '+n.occupation:''}</div>
      </div>
      <div style="font-size:2rem;">${{Human:'🧑',Elf:'🧝',Dwarf:'⛏',Halfling:'🍃',Tiefling:'😈',Dragonborn:'🐉',Gnome:'⚙','Half-Elf':'👁'}[n.race]||'🧙'}</div>
    </div>
    <div class="npc-trait"><strong>Appearance</strong>${n.appearance}</div>
    <div class="npc-trait"><strong>Personality</strong>${n.personality}</div>
    <div class="npc-trait"><strong>Ideal</strong>${n.ideal}</div>
    <div class="npc-trait"><strong>Bond</strong>${n.bond}</div>
    <div class="npc-trait"><strong>Flaw</strong>${n.flaw}</div>
    <div class="npc-trait"><strong>Voice</strong>${n.voice}</div>
    <div class="npc-trait" style="border-left:3px solid var(--red2);"><strong style="color:var(--red2);">🔒 Secret (DM Only)</strong>${n.secret}</div>
  </div>`;
}
function saveNPCAsChar(){
  if(!lastGeneratedNPC)return;
  const n=lastGeneratedNPC;
  state.characters.push({id:Date.now(),type:'npc',name:n.name,race:n.race,class:n.occupation||'NPC',subclass:'',level:1,hp:10,maxHp:10,ac:10,speed:30,profBonus:2,initiative:0,str:10,dex:10,con:10,int:10,wis:10,cha:10,skills:[],equipment:'',charEquipItems:[],charFeats:[],features:'Personality: '+n.personality+'\nIdeal: '+n.ideal+'\nBond: '+n.bond+'\nFlaw: '+n.flaw,spellsKnown:'',backstory:n.secret,alignment:'True Neutral',background:''});
  save();renderCharList();
  toast('✓ '+n.name+' saved as NPC character!');
}

// ===== LOOT GENERATOR =====
const LOOT_MUNDANE=['a silver hand mirror (15 gp)','a well-made leather pouch (2 gp)','a bundle of spell components','a set of dice carved from bone','a rolled-up map of uncertain age','a bottle of fine wine (10 gp)','a decorative dagger (25 gp)','a vial of perfume (5 gp)','an ornate but non-magical key','a set of loaded dice'];
const LOOT_LOW=[{name:'Potion of Healing',desc:'Restore 2d4+2 HP',icon:'🧪',r:'uncommon'},{name:'Silvered Dagger',desc:'+0 magical, bypasses silver resistance',icon:'🗡',r:'uncommon'},{name:'+1 Arrow (×10)',desc:'Magical ammunition',icon:'🏹',r:'uncommon'},{name:'Spell Scroll (1st)',desc:'Contains a 1st-level spell',icon:'📜',r:'uncommon'},{name:'Bag of Holding',desc:'400 lb, 64 cubic feet',icon:'👜',r:'uncommon'},{name:'Cloak of Protection',desc:'+1 AC and saving throws',icon:'🧥',r:'uncommon'},{name:'Boots of the Winterlands',desc:'Resist cold, ignore ice terrain',icon:'👢',r:'uncommon'},{name:'Wand of Magic Detection',desc:'3 charges, detect magic',icon:'🪄',r:'uncommon'}];
const LOOT_MID=[{name:'+1 Longsword',desc:'+1 attack and damage',icon:'⚔',r:'uncommon'},{name:'+1 Shield',desc:'+1 AC on top of normal shield bonus',icon:'🛡',r:'uncommon'},{name:'Necklace of Adaptation',desc:'Breathe in any environment',icon:'📿',r:'uncommon'},{name:'Headband of Intellect',desc:'INT set to 19',icon:'🎓',r:'uncommon'},{name:'Gloves of Thievery',desc:'+5 Sleight of Hand and lockpicking',icon:'🧤',r:'uncommon'},{name:'Ring of Feather Falling',desc:'No fall damage',icon:'💍',r:'rare'},{name:'+2 Longbow',desc:'+2 attack and damage',icon:'🏹',r:'rare'},{name:'Staff of Healing',desc:'10 charges, heals 1d6+4 per charge',icon:'🪄',r:'rare'}];
const LOOT_HIGH=[{name:'+2 Weapon (your choice)',desc:'Powerful magical armament',icon:'⚔',r:'rare'},{name:'Flame Tongue Sword',desc:'Ignite for 2d6 fire damage',icon:'🔥',r:'rare'},{name:'Amulet of Health',desc:'CON set to 19',icon:'📿',r:'rare'},{name:'Mantle of Spell Resistance',desc:'Advantage on all spell saves',icon:'🧥',r:'rare'},{name:'Boots of Speed',desc:'Double speed, disengage as bonus action',icon:'👢',r:'rare'},{name:'Belt of Giant Strength (Hill)',desc:'STR set to 21',icon:'💪',r:'rare'}];
const LOOT_LEGENDARY=[{name:'+3 Weapon',desc:'Exceptional magical armament',icon:'⚔',r:'veryrare'},{name:'Vorpal Sword',desc:'Nat 20 = decapitate. +3 to hit',icon:'⚔',r:'legendary'},{name:'Cloak of Invisibility',desc:'Invisible while worn and hood raised',icon:'🧥',r:'legendary'},{name:'Staff of the Magi',desc:'50 charges, absorb spells',icon:'🪄',r:'legendary'},{name:'Ring of Three Wishes',desc:'3 wishes remain',icon:'💍',r:'legendary'},{name:'Tome of Understanding',desc:'+2 WIS permanently',icon:'📚',r:'veryrare'}];

function openLootGen(){document.getElementById('loot-modal').classList.add('open');}
function generateLoot(){
  const tier=document.getElementById('loot-cr')?.value||'0';
  const type=document.getElementById('loot-type')?.value||'hoard';
  const rand=arr=>arr[Math.floor(Math.random()*arr.length)];
  const randInt=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  let items=[];
  // Gold
  const goldAmounts={0:[10,100],5:[50,500],11:[200,2000],17:[1000,10000]};
  const [gMin,gMax]=goldAmounts[tier]||[10,100];
  const gold=randInt(gMin,gMax);
  items.push({name:gold.toLocaleString()+' Gold Pieces',desc:type==='hoard'?'In a locked chest':'Loose coins and pouches',icon:'🪙',r:'common'});
  // Mundane items
  const mundaneCount=type==='hoard'?randInt(2,4):randInt(1,2);
  for(let i=0;i<mundaneCount;i++)items.push({name:rand(LOOT_MUNDANE),desc:'Mundane item',icon:'📦',r:'common'});
  // Magic items
  const magicPool={0:LOOT_LOW,5:LOOT_MID,11:LOOT_HIGH,17:LOOT_LEGENDARY}[tier]||LOOT_LOW;
  const lowerPool={0:[],5:LOOT_LOW,11:LOOT_MID,17:LOOT_HIGH}[tier]||[];
  const magicCount=type==='hoard'?randInt(2,4):randInt(1,2);
  for(let i=0;i<magicCount;i++){
    const pool=Math.random()<0.3&&lowerPool.length?lowerPool:magicPool;
    items.push(rand(pool));
  }
  // Gem/art
  if(type==='hoard'||type==='dungeon'){
    const gems=['a flawless ruby (300 gp)','a matched pair of sapphires (500 gp)','an emerald the size of a fist (1000 gp)','a blood red garnet (100 gp)','a cat\'s eye moonstone (150 gp)','a string of black pearls (800 gp)'];
    items.push({name:rand(gems),desc:'Precious gemstone or art object',icon:'💎',r:'uncommon'});
  }
  const rarityLabel={common:'Common',uncommon:'Uncommon',rare:'Rare',veryrare:'Very Rare',legendary:'Legendary'};
  document.getElementById('loot-output').innerHTML=`<div style="margin-bottom:.5rem;font-family:Cinzel,serif;font-size:.72rem;color:var(--text3);letter-spacing:1px;text-transform:uppercase;">Treasure Hoard — ${items.length} items</div>`+
    items.map(it=>`<div class="loot-item loot-rarity-${it.r}">
      <div class="loot-icon">${it.icon}</div>
      <div>
        <div class="loot-name">${it.name}</div>
        <div class="loot-desc">${it.desc}</div>
        <div style="font-size:.65rem;color:var(--text3);font-family:Cinzel,serif;">${rarityLabel[it.r]||it.r}</div>
      </div>
    </div>`).join('');
}

// ===== WEATHER GENERATOR =====
const WEATHER={
  temperate:[
    {name:'Clear & Sunny',icon:'☀️',eff:'Normal visibility. No gameplay effects.'},
    {name:'Partly Cloudy',icon:'⛅',eff:'Normal conditions.'},
    {name:'Overcast',icon:'☁️',eff:'Darkvision range reduced by 30 ft outdoors.'},
    {name:'Light Rain',icon:'🌧️',eff:'Disadvantage on Perception (hearing). Flames extinguished on 1-2 (d6).'},
    {name:'Heavy Storm',icon:'⛈️',eff:'Ranged attacks have disadvantage. Flying is impossible. Visibility 60 ft.'},
    {name:'Dense Fog',icon:'🌫️',eff:'Heavily obscured beyond 10 ft. Perception checks to spot at disadvantage.'},
    {name:'Scorching Heat',icon:'🌡️',eff:'Constitution save (DC 10) each hour or gain exhaustion level.'},
    {name:'Bitter Cold',icon:'🌬️',eff:'CON save (DC 10) per hour in light armor/no armor or gain exhaustion.'},
  ],
  arctic:[{name:'Blizzard',icon:'❄️',eff:'Heavily obscured, ranged attacks impossible, forced march rules apply.'},{name:'Frozen Tundra',icon:'🌨️',eff:'Difficult terrain. CON save (DC 12) per hour or exhaustion.'},{name:'Clear Arctic Cold',icon:'🥶',eff:'CON save (DC 10) per hour in inadequate clothing.'}],
  desert:[{name:'Scorching Sun',icon:'☀️',eff:'CON save (DC 12) per hour or exhaustion. Water consumption doubled.'},{name:'Sandstorm',icon:'🌪️',eff:'Blinded beyond 10 ft. Ranged attacks impossible.'},{name:'Cool Night',icon:'🌙',eff:'Desert nights are cold. CON save (DC 8) in light clothing.'}],
  coastal:[{name:'Sea Breeze',icon:'🌊',eff:'Normal conditions. Ships move at +1 knot.'},{name:'Squall',icon:'⛈️',eff:'Navigation DC raised by 5. Sailing speed halved.'},{name:'Hurricane',icon:'🌀',eff:'Sailing impossible. Enormous waves. All outdoor activities severely limited.'}],
  mountain:[{name:'Mountain Gale',icon:'💨',eff:'Flying creatures must succeed DC 15 STR save per round or be swept 1d6×5 ft.'},{name:'Thin Air',icon:'⛰️',eff:'Above 10,000 ft: dash action costs +1 exhaustion.'},{name:'Avalanche Risk',icon:'🏔️',eff:'Loud noises have 20% chance to trigger avalanche.'}],
  swamp:[{name:'Humid Haze',icon:'🌿',eff:'Disadvantage on CON saves vs disease. Foraging DC +5.'},{name:'Monsoon',icon:'⛈️',eff:'All terrain is difficult. Fire spells have disadvantage.'}],
  underdark:[{name:'Cave Calm',icon:'🕯️',eff:'No wind. Advantage on hearing-based Perception.'},{name:'Spore Cloud',icon:'🍄',eff:'CON save (DC 12) or poisoned for 1 hour.'},{name:'Tremor',icon:'⚡',eff:'DEX save (DC 12) or prone. Loose rocks fall (1d6 damage).'}]
};
let weatherHistory=[];
function showWeather(){document.getElementById('weather-modal').classList.add('open');}
function rollWeather(){
  const region=document.getElementById('weather-region')?.value||'temperate';
  const pool=WEATHER[region]||WEATHER.temperate;
  const w=pool[Math.floor(Math.random()*pool.length)];
  weatherHistory.unshift(w);if(weatherHistory.length>5)weatherHistory.pop();
  const el=document.getElementById('weather-output');
  if(el)el.innerHTML=`<div class="weather-display">
    <span class="weather-icon">${w.icon}</span>
    <div class="weather-name">${w.name}</div>
    <div class="weather-effect">${w.eff}</div>
  </div>`;
  document.getElementById('dash-weather-icon').textContent=w.icon;
  const hist=document.getElementById('weather-history');
  if(hist&&weatherHistory.length>1)hist.innerHTML='<div style="font-family:Cinzel,serif;font-size:.6rem;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:.3rem;">Previous</div>'+weatherHistory.slice(1).map(h=>`<div style="display:flex;gap:.5rem;padding:.2rem 0;font-size:.8rem;color:var(--text2);border-bottom:1px solid rgba(74,58,37,.2);">${h.icon} ${h.name}</div>`).join('');
}

// ===== QUICK D20 ROLL =====
function quickD20Roll(){
  const r=rollDie(20);
  const toast_el=document.createElement('div');
  toast_el.style.cssText='position:fixed;top:5rem;left:50%;transform:translateX(-50%);background:var(--panel);border:2px solid '+(r===20?'#58d68d':r===1?'#c0392b':'var(--gold)')+';color:'+(r===20?'#58d68d':r===1?'#c0392b':'var(--gold2)')+';font-family:"Cinzel Decorative",cursive;font-size:2rem;padding:.75rem 2rem;z-index:9999;border-radius:3px;box-shadow:0 8px 32px rgba(0,0,0,.8);animation:fadeIn .2s ease;text-align:center;';
  toast_el.innerHTML='d20: '+r+(r===20?' 🎉 CRIT!':r===1?' 💀 FUMBLE!':'');
  document.body.appendChild(toast_el);
  rollHistoryArr.unshift({label:'Quick d20',total:r,time:new Date().toLocaleTimeString()});
  setTimeout(()=>toast_el.remove(),2200);
}

// ===== TOAST NOTIFICATION =====
function toast(msg,color){
  const el=document.createElement('div');
  el.style.cssText='position:fixed;bottom:1.5rem;right:1.5rem;background:var(--panel);border:1px solid '+(color||'var(--gold)')+';color:'+(color||'var(--gold3)')+';font-family:Cinzel,serif;font-size:.75rem;padding:.65rem 1.2rem;z-index:9999;border-radius:2px;box-shadow:0 4px 20px rgba(0,0,0,.7);animation:fadeIn .2s ease;max-width:320px;';
  el.textContent=msg;
  document.body.appendChild(el);setTimeout(()=>el.remove(),2800);
}

// ===== HOTBAR QUICK ACTIONS =====
// Hotbar always visible
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    const hb=document.getElementById('hotbar');
    if(hb)hb.style.opacity='1';
    renderHUD();
  },500);
});

// ===== NOTES =====
function newNote(){const t=prompt('Note title:');if(!t)return;state.notes.push({id:Date.now(),title:t,content:'',date:new Date().toLocaleDateString()});state.activeNoteIdx=state.notes.length-1;renderNoteList();renderNoteEditor();save();}
function renderNoteList(){
  const el=document.getElementById('note-list');
  if(!state.notes.length){el.innerHTML='<div class="text-dim" style="text-align:center;padding:.8rem;">No notes yet</div>';return;}
  el.innerHTML=state.notes.map((n,i)=>'<div class="note-item'+(state.activeNoteIdx===i?' active':'')+'" onclick="selectNote('+i+')"><div class="note-title">'+n.title+'</div><div class="note-date">'+n.date+'</div></div>').join('');
}
function selectNote(idx){state.activeNoteIdx=idx;renderNoteList();renderNoteEditor();}
function renderNoteEditor(){
  const area=document.getElementById('note-editor-area');
  if(state.activeNoteIdx===null){area.innerHTML='<div class="empty-state" style="padding:3.5rem;"><span class="empty-icon">📖</span>Select or create a note</div>';return;}
  const n=state.notes[state.activeNoteIdx];const idx=state.activeNoteIdx;
  area.innerHTML=`<div class="card">
    <div style="display:flex;gap:.5rem;align-items:flex-start;margin-bottom:.65rem;">
      <div class="form-group" style="flex:1;margin:0;"><label>Title</label><input value="${n.title.replace(/"/g,'&quot;')}" oninput="state.notes[${idx}].title=this.value;renderNoteList();save()"></div>
      <button class="btn btn-ghost btn-sm" onclick="navigator.clipboard.writeText(state.notes[${idx}].content).then(()=>toast('📋 Copied!'))" style="margin-top:1.2rem;" title="Copy to clipboard">📋</button>
      <button class="btn btn-ghost btn-sm" onclick="exportNoteAsTxt(${idx})" style="margin-top:1.2rem;" title="Export as text">⬇</button>
      <button class="btn btn-red btn-sm" onclick="deleteNote(${idx})" style="margin-top:1.2rem;">🗑</button>
    </div>
    <div class="form-group"><label>Content</label><textarea style="min-height:400px;line-height:1.7;font-family:'Crimson Text',serif;" oninput="state.notes[${idx}].content=this.value;save()">${n.content}</textarea></div>
    <button class="btn btn-sm" onclick="save();toast('✓ Saved','#3d9b52')">💾 Save Note</button>
  </div>`;
}
function exportNoteAsTxt(idx){const n=state.notes[idx];if(!n)return;const blob=new Blob([n.title+'\n\n'+n.content],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(n.title||'note').replace(/[^a-z0-9]/gi,'_')+'.txt';a.click();}
function deleteNote(idx){if(!confirm('Delete?'))return;state.notes.splice(idx,1);state.activeNoteIdx=null;document.getElementById('note-editor-area').innerHTML='<div class="empty-state" style="padding:3.5rem;"><span class="empty-icon">📖</span>Select a note</div>';renderNoteList();save();}
function updateNote(idx,f,v){state.notes[idx][f]=v;if(f==='title')renderNoteList();save();}

// ===== MUSIC =====
const AMBIENT_SOUNDS=[
  {name:'Tavern',icon:'🍺',url:'https://www.youtube.com/results?search_query=dnd+tavern+ambiance'},
  {name:'Dungeon',icon:'🏚',url:'https://www.youtube.com/results?search_query=dungeon+ambiance+dnd'},
  {name:'Forest',icon:'🌲',url:'https://www.youtube.com/results?search_query=fantasy+forest+ambiance'},
  {name:'Storm',icon:'⛈️',url:'https://www.youtube.com/results?search_query=thunderstorm+ambiance'},
  {name:'Cave',icon:'🕳',url:'https://www.youtube.com/results?search_query=cave+dungeon+sound'},
  {name:'Ocean',icon:'🌊',url:'https://www.youtube.com/results?search_query=ocean+waves+fantasy'},
  {name:'Campfire',icon:'🔥',url:'https://www.youtube.com/results?search_query=campfire+crackling+night'},
  {name:'City',icon:'🏙',url:'https://www.youtube.com/results?search_query=fantasy+city+ambiance'},
  {name:'Battle',icon:'⚔',url:'https://www.youtube.com/results?search_query=epic+battle+music+dnd'},
  {name:'Creepy',icon:'👁',url:'https://www.youtube.com/results?search_query=horror+dungeon+ambiance'},
  {name:'Sacred',icon:'✝',url:'https://www.youtube.com/results?search_query=sacred+temple+music+fantasy'},
  {name:'Arctic',icon:'❄️',url:'https://www.youtube.com/results?search_query=arctic+tundra+wind+ambiance'},
];
function renderAmbientSounds(){const el=document.getElementById('ambient-sounds');if(!el)return;el.innerHTML=AMBIENT_SOUNDS.map(s=>`<a href="${s.url}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:.4rem;padding:.45rem .65rem;background:var(--bg3);border:1px solid var(--border);border-radius:2px;cursor:pointer;text-decoration:none;transition:border-color .15s;color:var(--text2);font-family:Cinzel,serif;font-size:.68rem;" onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border)'"><span style="font-size:1.1rem;">${s.icon}</span>${s.name}</a>`).join('');}
function loadSpotify(){
  const url=document.getElementById('spotify-url').value.trim();if(!url)return alert('Paste a Spotify URL');
  const embed=url.replace('open.spotify.com/','open.spotify.com/embed/').replace(/\?.*$/,'');
  document.getElementById('spotify-player').innerHTML='<iframe src="'+embed+'" width="100%" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media" style="border-radius:2px;border:1px solid var(--border);"></iframe>';
}
function addMoodPlaylist(){
  const name=document.getElementById('pl-name').value.trim(),icon=document.getElementById('pl-icon').value.trim()||'🎵',desc=document.getElementById('pl-desc').value.trim(),url=document.getElementById('pl-url').value.trim();
  if(!name||!url)return alert('Name and URL required');
  state.moodPlaylists.push({name,icon,desc,url});
  ['pl-name','pl-icon','pl-desc','pl-url'].forEach(id=>document.getElementById(id).value='');
  renderMoodPlaylists();save();
}
function renderMoodPlaylists(){
  const el=document.getElementById('mood-playlists');
  if(!state.moodPlaylists.length){el.innerHTML='<div class="text-dim">Add playlists below.</div>';return;}
  el.innerHTML=state.moodPlaylists.map((pl,i)=>'<div class="playlist-card" onclick="loadMoodPlaylist('+i+')"><span style="font-size:1.8rem;display:block;margin-bottom:.38rem;">'+pl.icon+'</span><div style="font-family:Cinzel,serif;font-size:.75rem;color:var(--gold3);">'+pl.name+'</div><div style="font-size:.72rem;color:var(--text3);margin-top:.18rem;">'+pl.desc+'</div><button onclick="event.stopPropagation();state.moodPlaylists.splice('+i+',1);renderMoodPlaylists();save();" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:.7rem;margin-top:.38rem;">Remove</button></div>').join('');
}
function loadMoodPlaylist(idx){
  const pl=state.moodPlaylists[idx];
  document.getElementById('spotify-url').value=pl.url;
  const embed=pl.url.replace('open.spotify.com/','open.spotify.com/embed/').replace(/\?.*$/,'');
  document.getElementById('spotify-player').innerHTML='<iframe src="'+embed+'" width="100%" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media" style="border-radius:2px;border:1px solid var(--border);"></iframe>';
}
function getDefaultPlaylists(){return[];}

// ===== REFERENCE CONTENT =====
function showRef(tab,btn){
  ['conditions','actions','dmtips','tables','rules'].forEach(t=>{document.getElementById('ref-'+t).style.display=t===tab?'block':'none';});
  document.querySelectorAll('#page-reference .type-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

function renderReferenceContent(){
  renderConditionsRef();renderActionsRef();renderDMTips();renderRandomTables();renderRulesRef();
}

function renderConditionsRef(){
  const conditions=[
    {name:'Blinded',color:'#aaa',icon:'👁',effects:['Cannot see; auto-fail checks requiring sight.','Attack rolls against you have advantage.','Your attack rolls have disadvantage.']},
    {name:'Charmed',color:'#e91e63',icon:'💕',effects:['Cannot attack the charmer or target them with harmful spells.','The charmer has advantage on social checks against you.']},
    {name:'Deafened',color:'#888',icon:'👂',effects:['Cannot hear; auto-fail checks requiring hearing.','Immune to effects that require you to hear.']},
    {name:'Exhaustion',color:'#c8a96e',icon:'😓',effects:['Level 1: Disadvantage on ability checks.','Level 2: Speed halved.','Level 3: Disadvantage on attack rolls and saving throws.','Level 4: HP maximum halved.','Level 5: Speed reduced to 0.','Level 6: Death.']},
    {name:'Frightened',color:'#b39ddb',icon:'😨',effects:['Disadvantage on ability checks and attack rolls while the source of fear is in sight.','Cannot willingly move closer to the source of fear.']},
    {name:'Grappled',color:'#e09a5a',icon:'🤝',effects:['Speed becomes 0, cannot benefit from bonuses to speed.','Ends if grappler is incapacitated.','Ends if creature is moved out of grappler\'s reach.']},
    {name:'Incapacitated',color:'#9090c0',icon:'💤',effects:['Cannot take actions or reactions.']},
    {name:'Invisible',color:'#e0e0ff',icon:'👻',effects:['Impossible to see without magic. Considered heavily obscured.','Attack rolls against you have disadvantage.','Your attack rolls have advantage.']},
    {name:'Paralyzed',color:'#ff9800',icon:'⚡',effects:['Incapacitated, cannot move or speak.','Auto-fail Str and Dex saving throws.','Attack rolls against you have advantage.','Any attack that hits is a critical hit if within 5 ft.']},
    {name:'Petrified',color:'#d4c89a',icon:'🗿',effects:['Transformed into stone. Weight increases by 10x.','Incapacitated, cannot move or speak.','Unaware of surroundings.','Attack rolls against you have advantage.','Auto-fail Str and Dex saves.','Resistance to all damage.','Immune to poison and disease.']},
    {name:'Poisoned',color:'#81c784',icon:'🤢',effects:['Disadvantage on attack rolls and ability checks.']},
    {name:'Prone',color:'#bcaaa4',icon:'⬇',effects:['Only movement option is crawling (costs double movement).','Disadvantage on attack rolls.','Attacks against you have advantage if within 5 ft, disadvantage if farther.','Can stand up by spending half your speed.']},
    {name:'Restrained',color:'#b39ddb',icon:'⛓',effects:['Speed becomes 0, cannot benefit from bonuses to speed.','Attack rolls against you have advantage.','Your attack rolls have disadvantage.','Disadvantage on Dexterity saving throws.']},
    {name:'Stunned',color:'#64b5f6',icon:'💫',effects:['Incapacitated, cannot move, can only speak falteringly.','Auto-fail Str and Dex saving throws.','Attack rolls against you have advantage.']},
    {name:'Unconscious',color:'#78909c',icon:'😴',effects:['Incapacitated, cannot move or speak, unaware of surroundings.','Drop held items. Fall prone.','Auto-fail Str and Dex saving throws.','Attack rolls against you have advantage.','Any attack that hits is a critical hit if within 5 ft.']}
  ];
  document.getElementById('conditions-grid').innerHTML=conditions.map(c=>`
    <div class="condition-ref-card" style="border-top:3px solid ${c.color};">
      <h3 style="color:${c.color};">${c.icon} ${c.name}</h3>
      <ul>${c.effects.map(e=>'<li>'+e+'</li>').join('')}</ul>
    </div>`).join('');
}

function renderActionsRef(){
  const actions=[
    {name:'Attack',desc:'Make one melee or ranged weapon attack (or more with Extra Attack).'},
    {name:'Cast a Spell',desc:'Cast a spell with a casting time of 1 action.'},
    {name:'Dash',desc:'Gain extra movement equal to your speed for this turn.'},
    {name:'Disengage',desc:'Your movement doesn\'t provoke opportunity attacks for the rest of the turn.'},
    {name:'Dodge',desc:'Attack rolls against you have disadvantage if you can see the attacker. Dex saves have advantage.'},
    {name:'Help',desc:'Aid another creature: grant advantage on their next ability check, or grant advantage on the next attack against a target within 5 ft.'},
    {name:'Hide',desc:'Make a Dexterity (Stealth) check. If you succeed, you gain the hidden condition.'},
    {name:'Ready',desc:'Prepare a reaction triggered by a specified event. Choose your action and trigger.'},
    {name:'Search',desc:'Devote attention to finding something using Perception or Investigation.'},
    {name:'Use an Object',desc:'Interact with a second object (the first object interaction is free per turn).'},
    {name:'Grapple',desc:'Make an Athletics check contested by target\'s Athletics or Acrobatics. Success = grappled condition.'},
    {name:'Shove',desc:'Make an Athletics check contested by target\'s Athletics or Acrobatics. Success = prone or 5 ft. pushed.'},
    {name:'Opportunity Attack',desc:'REACTION: When an enemy leaves your reach without Disengaging, make one melee attack against them.'},
    {name:'Two-Weapon Fighting',desc:'BONUS ACTION: When you take the Attack action with a light weapon, attack with your other light weapon (no ability modifier to damage).'},
    {name:'Off-Hand Attack',desc:'BONUS ACTION: Make an additional attack with a light weapon after attacking with a light weapon.'},
  ];
  document.getElementById('ref-actions').innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.85rem;">'
    +actions.map(a=>'<div class="tip-card"><h4>'+a.name+'</h4><p>'+a.desc+'</p></div>').join('')+'</div>';
}

function renderDMTips(){
  const tips=[
    {source:'r/DMAcademy',title:'The "Yes, And..." Principle',tip:'Never shut players down. If they suggest something wild, say "Yes, and here\'s how it plays out." Players feel agency; you stay in control of consequences.'},
    {source:'r/DnD',title:'Prep Situations, Not Plots',tip:'Don\'t write a railroad. Prep interesting NPCs with goals, locations with secrets, and factions in conflict. The players\' choices create the story.'},
    {source:'DM Forums',title:'Rule of Cool',tip:'If a player proposes something awesome that isn\'t strictly RAW, let them roll for it. A dramatic moment beats a rules argument every time.'},
    {source:'r/DMAcademy',title:'Three Clue Rule',tip:'Never rely on a single clue to advance the plot. Always have at least three ways players can discover any key piece of information.'},
    {source:'Sly Flourish',title:'Start in Media Res',tip:'Begin sessions in the middle of action or interesting situations. Never start "you\'re all at the tavern." Open with something happening right now.'},
    {source:'r/DnD',title:'Spotlight Rotation',tip:'Track who got spotlight last session. Actively create moments for quieter players — NPCs asking their character specifically, or situations that play to their class.'},
    {source:'DM Forums',title:'Foreshadow the Big Bad',tip:'Introduce your villain\'s effects before the villain. The village burned. The merchant is terrified. The refugees speak of a shadow. Players fear what they can imagine.'},
    {source:'r/DMAcademy',title:'Fail Forward',tip:'When players fail a roll, the story still progresses — just with a complication. Failed Perception: you find the door, but you made noise. Never use failure to stop momentum.'},
    {source:'Matt Colville',title:'NPCs Have Lives',tip:'Give every named NPC a want, a fear, and a secret. Even if you never use them, it makes improvisation feel consistent and alive.'},
    {source:'r/DnD',title:'Session Zero is Sacred',tip:'Spend a full session establishing safety tools, content expectations, character backstories that connect, and campaign tone. It prevents 80% of table problems.'},
    {source:'Sly Flourish',title:'Lazy DM Prep',tip:'The 8-step prep: strong start, scene list, secrets/clues, fantastic locations, notable NPCs, monsters, magic items, inspiration. Takes 30 min. Covers most sessions.'},
    {source:'r/DMAcademy',title:'Let Players Narrate Kills',tip:'When a player lands the killing blow on a tough enemy, ask them: "How do you do it?" They\'ll remember that moment forever.'},
    {source:'DM Forums',title:'The Villain Has a Point',tip:'The best villains believe they\'re right. Give your antagonist a genuine motivation that players might even sympathize with. Pure evil is boring.'},
    {source:'r/DnD',title:'Calibrate Difficulty',tip:'One deadly encounter per session is usually enough. Fill the rest with medium encounters. TPKs happen most often from DMs who forget attrition.'},
    {source:'Matt Mercer',title:'Say Yes to Character Moments',tip:'If a player wants a quiet scene to reflect, have a conversation, or write in their journal — honor it. Roleplay between action is what makes people cry at the table.'},
    {source:'r/DMAcademy',title:'Track HP Loosely',tip:'You don\'t have to track monster HP exactly. Monsters fight to their last, or flee, or surrender based on narrative. A monster at "3 HP" can still be terrifying.'},
  ];
  document.getElementById('ref-dmtips').innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:.85rem;">'
    +tips.map(t=>'<div class="tip-card"><div class="tip-source">'+t.source+'</div><h4>'+t.title+'</h4><p>'+t.tip+'</p></div>').join('')+'</div>';
}

function renderRandomTables(){
  const tables=[
    {title:'🎲 NPC Personality Trait',d:'1d12',items:['Speaks very slowly and deliberately','Has an infectious laugh','Constantly fidgets or taps','Never makes eye contact','Tells long-winded stories','Extremely direct — blurts out thoughts','Uses elaborate hand gestures','Hums or sings quietly while thinking','Always appears tired','Obsessively polite to everyone','Completes others\' sentences','References obscure local lore constantly']},
    {title:'🏚 Dungeon Room Feature',d:'1d10',items:['A collapsed section revealing a hidden passage','Phosphorescent fungus on the walls','A shattered statue of a forgotten god','A deep pit with an iron grate over it','Writing on the walls in an unknown script','The smell of sulfur grows stronger here','Drag marks in the dust lead to a door','A dry fountain with a coin at the bottom','Hooks in the ceiling — something hung here','Claw marks on the walls at inhuman height']},
    {title:'🌤 Random Weather',d:'1d8',items:['Bright and clear — visibility excellent','Overcast, grey and oppressive','Light drizzle, persistent','Heavy rain with thunder','Dense morning fog, burns off by noon','Unseasonable cold, frost on ground','Scorching heat, risk of exhaustion','Violent storm — flying/sailing impossible']},
    {title:'🗺 Encounter Hook',d:'1d10',items:['A messenger collapses at the party\'s feet','Smoke on the horizon to the north','A riderless horse gallops past','They overhear a heated argument nearby','A stranger watches them from a distance','A child approaches and hands them a note','A wanted poster bears someone\'s likeness','A strange sound from underground','A group of soldiers marches urgently past','An animal behaves strangely — watching']},
    {title:'💰 Treasure Quirk',d:'1d8',items:['Smells faintly of lavender','Covered in dried dark stains','Engraved with initials and a date','Warm to the touch at all times','Makes a faint sound in the dark','Has a false bottom or hidden compartment','Clearly very old — pre-dates local kingdoms','Worth double if returned to its original owner']},
    {title:'🎭 Tavern Name Generator',d:'1d12',items:['The Sleeping Giant','The Wounded Wyvern','The Gilded Goblin','The Lantern & the Lute','The Cracked Flagon','The Three Ravens','The Muddy Boot','The Last Candle','The Silver Stag','The Burning Crow','The Wanderer\'s Rest','The Undermountain Tap']},
  ];
  document.getElementById('ref-tables').innerHTML=tables.map(t=>`
    <div class="card mb1">
      <div class="card-title">${t.title} — ${t.d}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.25rem;">
        ${t.items.map((item,i)=>'<div style="display:flex;gap:.5rem;padding:.28rem .4rem;background:var(--bg3);border-radius:2px;font-size:.86rem;"><span style="color:var(--gold);font-family:Cinzel,serif;font-size:.72rem;min-width:20px;">'+(i+1)+'.</span><span style="color:var(--text2);">'+item+'</span></div>').join('')}
      </div>
      <button class="btn btn-ghost btn-sm mt1" onclick="rollTableResult(${JSON.stringify(t.items)})">🎲 Roll on this table</button>
      <span id="roll-table-res-${t.title.replace(/\s+/g,'_')}" style="margin-left:.5rem;color:var(--gold2);font-style:italic;font-size:.88rem;"></span>
    </div>`).join('');
}

function rollTableResult(items){
  const r=items[Math.floor(Math.random()*items.length)];
  alert('Result: '+r);
}

function renderRulesRef(){
  document.getElementById('ref-rules').innerHTML=`
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:.85rem;">
    <div class="card"><div class="card-title">⚔ Advantage & Disadvantage</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">Roll 2d20, take the higher (advantage) or lower (disadvantage). Multiple sources of advantage/disadvantage don't stack. One source of each cancels out, regardless of how many.</p></div>
    <div class="card"><div class="card-title">🛡 Armor Class</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;"><strong style="color:var(--gold3);">Unarmored:</strong> 10 + Dex mod<br><strong style="color:var(--gold3);">Light armor:</strong> Armor + Dex mod<br><strong style="color:var(--gold3);">Medium armor:</strong> Armor + Dex mod (max +2)<br><strong style="color:var(--gold3);">Heavy armor:</strong> Armor only (no Dex)</p></div>
    <div class="card"><div class="card-title">💀 Death Saving Throws</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">At 0 HP: roll d20 each turn. 10+ = success, 9 or lower = failure. 3 successes = stable. 3 failures = dead. Natural 20 = regain 1 HP. Natural 1 = 2 failures. Damage while at 0 HP = 1 failure (critical = 2).</p></div>
    <div class="card"><div class="card-title">📏 Cover</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;"><strong style="color:var(--gold3);">Half cover:</strong> +2 to AC and Dex saves<br><strong style="color:var(--gold3);">Three-quarters:</strong> +5 to AC and Dex saves<br><strong style="color:var(--gold3);">Full cover:</strong> Cannot be targeted directly</p></div>
    <div class="card"><div class="card-title">🎯 Concentration</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">Only one concentration spell at a time. Taking damage requires Con save (DC = 10 or half damage, whichever is higher). Failing = spell ends. Dying or going unconscious = spell ends.</p></div>
    <div class="card"><div class="card-title">🏃 Movement & Difficult Terrain</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">Difficult terrain costs double movement. Crawling costs double. Climbing costs double (unless climber). Swimming costs double (unless swimmer). Long jump: Str score in feet. High jump: 3 + Str mod in feet.</p></div>
    <div class="card"><div class="card-title">✨ Spellcasting</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">Spell attack: d20 + prof bonus + spellcasting ability mod vs AC.<br>Saving throw DC: 8 + prof bonus + spellcasting ability mod.<br>Cantrips don't use spell slots. Rituals take 10 extra minutes but don't use a slot.</p></div>
    <div class="card"><div class="card-title">⚡ Reactions & Opportunity Attacks</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">One reaction per round, regained at start of your turn. Opportunity attacks trigger when a creature leaves your reach without Disengaging. Readied actions use your reaction.</p></div>
    <div class="card"><div class="card-title">🎲 Proficiency Bonus by Level</div><p style="color:var(--text2);font-size:.86rem;line-height:1.65;">Levels 1-4: +2 · Levels 5-8: +3 · Levels 9-12: +4 · Levels 13-16: +5 · Levels 17-20: +6</p></div>
  </div>`;
}

// ===== SETTINGS =====
function exportCampaign(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(campName||'campaign')+'-backup.json';a.click();
}
function importCampaign(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{try{const d=JSON.parse(e.target.result);state={...state,...d};save();renderAll();alert('Campaign imported! ✓');}catch(err){alert('Invalid backup file.');}};
  reader.readAsText(file);
}
function resetCombat(){if(!confirm('Reset combat tracker?'))return;state.combatants=[];state.currentRound=1;state.currentTurn=0;renderInitiative();save();alert('Combat reset.');}
function resetEntireCampaign(){
  if(!confirm('DELETE ALL campaign data? This cannot be undone.'))return;
  if(!confirm('Are you absolutely sure? All characters, monsters, notes will be permanently deleted.'))return;
  state={characters:[],monsters:[],spells:[],customSpells:[],notes:[],combatants:[],currentRound:1,currentTurn:0,currentCharType:'player',activeCharIdx:null,activeMonsterIdx:null,activeNoteIdx:null,moodPlaylists:getDefaultPlaylists(),campaignInfo:{name:campName||'',session:1,date:'',location:''}};
  save();renderAll();alert('Campaign reset.');
}
function deleteAccount(){
  if(!confirm('Delete your account and ALL data? Cannot be undone.'))return;
  if(!confirm('Final confirmation — delete everything?'))return;
  const users=JSON.parse(localStorage.getItem('grimoire-users')||'{}');
  if(activeUser&&users[activeUser]){
    (users[activeUser].campaigns||[]).forEach(c=>localStorage.removeItem('grimoire-camp-'+c.id));
    delete users[activeUser];
  }
  localStorage.setItem('grimoire-users',JSON.stringify(users));
  localStorage.removeItem('grimoire-current-user');
  window.location.href='index.html';
}

// ===== BOOT =====

// ===== TURN TIMER =====
let timerOn=false, timerSec=30, timerMax=30, timerInterval=null;
function toggleTurnTimer(){
  timerOn=!timerOn;
  const btn=document.getElementById('timer-toggle-btn');
  const timerEl=document.getElementById('turn-timer');
  const barWrap=document.getElementById('timer-bar');
  if(timerOn){
    if(btn){btn.textContent='⏱ Stop';btn.classList.add('active');}
    if(timerEl)timerEl.style.display='block';
    if(barWrap)barWrap.style.display='block';
    startTimer();
  } else {
    if(btn){btn.textContent='⏱ Timer';btn.classList.remove('active');}
    if(timerEl)timerEl.style.display='none';
    if(barWrap)barWrap.style.display='none';
    stopTimer();
  }
}
function startTimer(){
  stopTimer();
  timerSec=timerMax;
  updateTimerDisplay();
  timerInterval=setInterval(()=>{
    timerSec--;
    if(timerSec<=0){
      timerSec=0;updateTimerDisplay();
      stopTimer();
      // Flash danger
      const el=document.getElementById('turn-timer');
      if(el){el.textContent="TIME'S UP!";el.className='danger';}
      setTimeout(()=>{if(timerOn)startTimer();},1500);
    } else {
      updateTimerDisplay();
    }
  },1000);
}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;}
function updateTimerDisplay(){
  const el=document.getElementById('turn-timer');
  const fill=document.getElementById('timer-fill');
  if(!el)return;
  const m=Math.floor(timerSec/60), s=timerSec%60;
  el.textContent=(m>0?m+':':'')+(s<10&&m>0?'0':'')+s;
  const pct=timerSec/timerMax*100;
  el.className=pct>50?'':pct>25?'warn':'danger';
  if(fill){
    fill.style.width=pct+'%';
    fill.style.background=pct>50?'var(--gold)':pct>25?'#f39c12':'#c0392b';
  }
}


// ===== XP TRACKER =====
const XP_LEVELS=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
let sessionXP=0,totalXP=0;
function addXP(amount){
  sessionXP+=amount;totalXP+=amount;
  updateXPDisplay();
  toast('✨ +'+amount.toLocaleString()+' XP awarded!','#c678e0');
  // Check level up
  const newLvl=getXPLevel(totalXP);
  const players=state.characters.filter(c=>c.type==='player');
  players.forEach(c=>{
    if(parseInt(c.level||1)<newLvl){
      c.level=newLvl;
      toast('🎉 '+c.name+' reached Level '+newLvl+'!','#f9e79f');
    }
  });
  save();
}
function getXPLevel(xp){
  for(let i=XP_LEVELS.length-1;i>=0;i--)if(xp>=XP_LEVELS[i])return i+1;
  return 1;
}
function updateXPDisplay(){
  const sesEl=document.getElementById('xp-session');
  const totEl=document.getElementById('xp-total');
  const bar=document.getElementById('xp-bar');
  const lbl=document.getElementById('xp-level-label');
  if(sesEl)sesEl.textContent=sessionXP.toLocaleString();
  if(totEl)totEl.textContent=totalXP.toLocaleString();
  const lvl=getXPLevel(totalXP);
  const thisLvlXP=XP_LEVELS[Math.min(lvl-1,XP_LEVELS.length-1)]||0;
  const nextLvlXP=XP_LEVELS[Math.min(lvl,XP_LEVELS.length-1)]||XP_LEVELS[XP_LEVELS.length-1];
  const pct=nextLvlXP>thisLvlXP?Math.round((totalXP-thisLvlXP)/(nextLvlXP-thisLvlXP)*100):100;
  if(bar)bar.style.width=Math.min(100,pct)+'%';
  if(lbl)lbl.textContent='Level '+lvl+(lvl<20?' — '+(nextLvlXP-totalXP).toLocaleString()+' XP to next':'— MAX');
}
function addXPFromEncounter(){
  const xp=encMonsters.reduce((total,m)=>total+crToXP(m.cr)*m.count,0);
  if(!xp){const v=parseInt(prompt('Enter XP amount to award:'));if(v>0)addXP(v);return;}
  const players=state.characters.filter(c=>c.type==='player').length||1;
  const perPlayer=Math.round(xp/players);
  if(confirm('Award '+xp.toLocaleString()+' XP? ('+perPlayer.toLocaleString()+' per player)'))addXP(xp);
}

// ===== REST SYSTEM =====
function openRestModal(){document.getElementById('rest-modal').classList.add('open');}
function takeShortRest(){
  const players=state.characters.filter(c=>c.type==='player');
  players.forEach(c=>{
    // Warlock regains spell slots on short rest
    const cls=(c.class||'').toLowerCase();
    if(cls==='warlock'){
      for(let i=1;i<=9;i++)c['slots_used_'+i]=0;
    }
    // Default: allow spending one hit die (1d[hit die] + con mod)
    const hd={'barbarian':12,'fighter':10,'paladin':10,'ranger':10,'bard':8,'cleric':8,'druid':8,'monk':8,'rogue':8,'warlock':8,'sorcerer':6,'wizard':6}[cls]||8;
    const conMod=Math.floor(((parseInt(c.con)||10)-10)/2);
    const recovery=Math.max(1,Math.floor(hd/2)+1+conMod);
    c.hp=Math.min(parseInt(c.maxHp)||10,(parseInt(c.hp)||0)+recovery);
  });
  save();renderAll();
  document.getElementById('rest-modal').classList.remove('open');
  toast('☕ Short Rest taken — Hit Dice spent, HP recovered','#76d7c4');
  logEvent('turn','☕ Party took a Short Rest','log-turn');
}
function takeLongRest(){
  const players=state.characters.filter(c=>c.type==='player');
  players.forEach(c=>{
    c.hp=parseInt(c.maxHp)||10;
    for(let i=1;i<=9;i++){c['slots_used_'+i]=0;}
    if(c.exhaustion&&c.exhaustion>0)c.exhaustion--;
    c.concentration=null;
    c.inspiration=false;
  });
  save();renderAll();
  document.getElementById('rest-modal').classList.remove('open');
  toast('🌙 Long Rest complete — HP full, all slots restored!','#5dade2');
  logEvent('turn','🌙 Party took a Long Rest — full recovery','log-heal');
}

// ===== ENHANCED INITIATIVE RENDER (v2) =====
// Replaces the standard renderInitiative when called from initiative page
function renderInitiativeV2(){
  const el=document.getElementById('initiative-list');
  if(!el)return;
  document.getElementById('round-num').textContent=state.currentRound;
  const condTarget=document.getElementById('init-cond-target');
  if(!state.combatants.length){
    el.innerHTML='<div class="empty-state"><span class="empty-icon">⚔</span>Add combatants to begin</div>';
    if(condTarget)condTarget.textContent='No combatants';
    renderHUD();return;
  }
  const active=state.combatants[state.currentTurn];
  if(condTarget)condTarget.textContent=active?'→ '+active.name:'—';
  const typeIcon={player:'🧙',enemy:'💀',ally:'✨'};
  const typeColor={player:'#e8b84b',enemy:'#c0392b',ally:'#3d9b52'};

  el.innerHTML=state.combatants.map((c,i)=>{
    const pct=Math.max(0,Math.min(100,(c.hp/c.maxHp)*100));
    const hpColor=pct>50?'var(--green2)':pct>25?'#f39c12':'var(--red2)';
    const barColor=pct>50?'linear-gradient(90deg,#2d6b3a,#3d9b52)':pct>25?'linear-gradient(90deg,#b7950b,#f39c12)':'linear-gradient(90deg,#7b241c,#c0392b)';
    const isActive=i===state.currentTurn;
    const isDead=c.dead;

    // Condition tags
    const condTags=(c.conditions||[]).map(cd=>`<span class="condition-tag ${COND_CLASS[cd]||''}" onclick="toggleCond(${c.id},'${cd}')" title="Click to remove">${cd}</span>`).join('');

    // Death saves (show when at 0 HP)
    const deathSaves=isDead?`<div style="display:flex;align-items:center;gap:.65rem;padding:.2rem 0;">
      <span style="font-family:Cinzel,serif;font-size:.62rem;color:var(--text3);">Saves:</span>
      <div>${[0,1,2].map(j=>`<span class="ds-pip ds-suc${(c.deathSucc||0)>j?' ds-on':''}" onclick="toggleDeathSave(${c.id},'succ',${j})"></span>`).join('')}</div>
      <span style="font-family:Cinzel,serif;font-size:.62rem;color:var(--text3);">Fails:</span>
      <div>${[0,1,2].map(j=>`<span class="ds-pip ds-fail-pip${(c.deathFail||0)>j?' ds-on':''}" onclick="toggleDeathSave(${c.id},'fail',${j})"></span>`).join('')}</div>
    </div>`:'';

    // Action economy (players only, linked to character sheet)
    const charMatch=state.characters.find(ch=>ch.name===c.name&&ch.type==='player');
    const actionEcon=charMatch?`<div style="display:flex;gap:.65rem;align-items:center;flex-wrap:wrap;margin-top:.18rem;">
      <div style="display:flex;align-items:center;gap:.22rem;">
        <span style="font-family:Cinzel,serif;font-size:.55rem;color:var(--text3);">ACT</span>
        <span class="action-pip ${(c.usedAction)?'used':'avail'}" onclick="toggleAction(${c.id},'action')" title="Action"></span>
      </div>
      <div style="display:flex;align-items:center;gap:.22rem;">
        <span style="font-family:Cinzel,serif;font-size:.55rem;color:var(--text3);">BON</span>
        <span class="action-pip bonus-pip ${(c.usedBonus)?'used':'avail'}" onclick="toggleAction(${c.id},'bonus')" title="Bonus Action"></span>
      </div>
      <div style="display:flex;align-items:center;gap:.22rem;">
        <span style="font-family:Cinzel,serif;font-size:.55rem;color:var(--text3);">RXN</span>
        <span class="action-pip react-pip ${(c.usedReact)?'used':'avail'}" onclick="toggleAction(${c.id},'react')" title="Reaction"></span>
      </div>
      ${c.concentration?`<span class="conc-badge" onclick="clearConcentration(${c.id})">◉ Conc: ${c.concentration.slice(0,12)}</span>`:''}
      ${c.inspiration?`<span class="insp-badge insp-on" onclick="toggleInspiration(${c.id})">★ Inspired</span>`:`<span class="insp-badge" onclick="toggleInspiration(${c.id})" style="opacity:.45;">★ Inspire</span>`}
    </div>`:'';

    // Spell slots (for spellcasters in combat)
    const spellSlotsHtml=charMatch&&(charMatch.slots_1||charMatch.slots_2)?`<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.2rem;">${
      [1,2,3,4,5].map(lvl=>{
        const tot=parseInt(charMatch['slots_'+lvl]||0);
        if(!tot)return'';
        const used=parseInt(charMatch['slots_used_'+lvl]||0);
        const rem=Math.max(0,tot-used);
        return`<div style="display:flex;align-items:center;gap:2px;">
          <span style="font-family:Cinzel,serif;font-size:.52rem;color:var(--text3);">${lvl}</span>
          ${Array.from({length:tot},(_,k)=>`<span style="width:10px;height:10px;border-radius:50%;border:1.5px solid #c678e0;cursor:pointer;display:inline-block;background:${k<rem?'#c678e0':'transparent'};" onclick="useCharSlot('${charMatch.name||''}',${lvl},${k<rem})" title="${rem}/${tot} level ${lvl} slots"></span>`).join('')}
        </div>`;
      }).join('')
    }</div>`:'';

    return`<div class="init-item-v2 ${isActive?'turn-active':''} ${isDead?'turn-dead':''}" id="initv2-${c.id}">
      <div class="init-header-v2">
        <div class="init-num-v2" style="color:${typeColor[c.type]||'var(--gold)'};">${c.init}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:.38rem;flex-wrap:wrap;">
            <span style="font-size:1rem;">${typeIcon[c.type]||'👤'}</span>
            <span style="font-family:Cinzel,serif;font-size:.88rem;color:${isActive?'var(--gold2)':'var(--text)'};font-weight:${isActive?700:400};">${c.name}</span>
            <span style="font-size:.65rem;color:var(--text3);">AC ${c.ac}</span>
            ${isDead?'<span style="color:var(--red2);font-size:.7rem;font-family:Cinzel,serif;">☠ DOWN</span>':''}
            ${isActive?'<span style="background:var(--gold);color:#0d0a07;font-family:Cinzel,serif;font-size:.52rem;font-weight:700;padding:.06rem .28rem;border-radius:10px;">ACTIVE</span>':''}
          </div>
          <div class="hp-bar" style="margin:.25rem 0;"><div class="hp-fill" style="width:${pct}%;background:${barColor};"></div></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.25rem;">
          <div style="font-family:'Cinzel Decorative',cursive;font-size:1.1rem;color:${hpColor};">${c.hp}<span style="font-size:.65rem;color:var(--text3);">/${c.maxHp}</span></div>
          <div style="display:flex;gap:.22rem;">
            <input id="hpi-${c.id}" type="number" placeholder="Amt" style="width:55px;padding:.2rem .3rem;font-size:.78rem;text-align:center;">
            <button class="btn btn-red btn-sm" onclick="dmgHeal(${c.id},true)" style="padding:.2rem .4rem;">−</button>
            <button class="btn btn-green btn-sm" onclick="dmgHeal(${c.id},false)" style="padding:.2rem .4rem;">+</button>
          </div>
        </div>
        <button onclick="removeCombatant(${c.id})" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:1rem;padding:.2rem;flex-shrink:0;align-self:flex-start;">✕</button>
      </div>
      ${condTags||deathSaves||actionEcon||spellSlotsHtml?`<div class="init-body-v2">
        ${condTags?`<div style="display:flex;flex-wrap:wrap;gap:.15rem;">${condTags}</div>`:''}
        ${deathSaves}
        ${actionEcon}
        ${spellSlotsHtml}
        <details style="margin-top:.1rem;"><summary style="font-size:.65rem;color:var(--text3);cursor:pointer;list-style:none;display:flex;align-items:center;gap:.3rem;">⊕ Toggle Conditions</summary>
          <div style="display:flex;flex-wrap:wrap;gap:.15rem;margin-top:.28rem;">
            ${CONDITIONS.map(cd=>{const has=(c.conditions||[]).includes(cd);return`<span class="condition-tag ${COND_CLASS[cd]||''}" style="${has?'':'opacity:.35'}" onclick="toggleCond(${c.id},'${cd}')">${cd}</span>`;}).join('')}
          </div>
        </details>
      </div>`:''}
    </div>`;
  }).join('');

  if(hudOpen)renderHUD();
  const dashEl=document.getElementById('page-dashboard');
  if(dashEl&&dashEl.classList.contains('active'))renderCombatStatus();
}

// Action economy helpers
function toggleAction(id,type){
  const c=state.combatants.find(x=>x.id===id);if(!c)return;
  if(type==='action')c.usedAction=!c.usedAction;
  else if(type==='bonus')c.usedBonus=!c.usedBonus;
  else if(type==='react')c.usedReact=!c.usedReact;
  renderInitiativeV2();save();
}
function resetActions(){
  state.combatants.forEach(c=>{c.usedAction=false;c.usedBonus=false;c.usedReact=false;});
}


function toggleDeathSave(id,type,idx){
  const c=state.combatants.find(x=>x.id===id);if(!c)return;
  if(type==='succ'){c.deathSucc=((c.deathSucc||0)>idx)?(c.deathSucc-1):idx+1;}
  else{c.deathFail=((c.deathFail||0)>idx)?(c.deathFail-1):idx+1;}
  if((c.deathSucc||0)>=3){c.dead=false;c.hp=1;c.deathSucc=0;c.deathFail=0;toast('💚 '+c.name+' stabilized!','#3d9b52');}
  if((c.deathFail||0)>=3){c.dead=true;logEvent('kill','☠ '+c.name+' has died!','log-kill');toast('💀 '+c.name+' has died!','#c0392b');}
  renderInitiativeV2();save();
}
function toggleInspiration(id){
  const c=state.combatants.find(x=>x.id===id);if(!c)return;
  c.inspiration=!c.inspiration;
  renderInitiativeV2();save();
}
function clearConcentration(id){
  const c=state.combatants.find(x=>x.id===id);if(!c)return;
  c.concentration=null;renderInitiativeV2();save();
}
function setConcentration(id){
  const c=state.combatants.find(x=>x.id===id);if(!c)return;
  const spell=prompt('Concentration spell name:',c.concentration||'');
  if(spell===null)return;
  c.concentration=spell||null;renderInitiativeV2();save();
}
function useCharSlot(name,lvl,isUsing){
  const c=state.characters.find(ch=>ch.name===name);if(!c)return;
  const usedKey='slots_used_'+lvl;
  const total=parseInt(c['slots_'+lvl]||0);
  if(isUsing)c[usedKey]=Math.min(total,(parseInt(c[usedKey]||0)+1));
  else c[usedKey]=Math.max(0,(parseInt(c[usedKey]||0)-1));
  save();renderInitiativeV2();
}

// Override renderInitiative to use v2 when on the initiative page
function renderInitiative(){
  const initPage=document.getElementById('page-initiative');
  if(initPage&&initPage.classList.contains('active')){
    renderInitiativeV2();
  } else {
    // Lightweight update for HUD/dashboard
    document.getElementById('round-num').textContent=state.currentRound;
    const condTarget=document.getElementById('init-cond-target');
    if(!state.combatants.length){
      const el=document.getElementById('initiative-list');
      if(el)el.innerHTML='<div class="empty-state"><span class="empty-icon">⚔</span>Add combatants to begin</div>';
      if(condTarget)condTarget.textContent='No combatants';
    } else {
      const active=state.combatants[state.currentTurn];
      if(condTarget)condTarget.textContent=active?'→ '+active.name:'—';
    }
    if(hudOpen)renderHUD();
    const dashEl=document.getElementById('page-dashboard');
    if(dashEl&&dashEl.classList.contains('active'))renderCombatStatus();
  }
}

// ===== PASSIVE STATS HELPERS =====
function getPassivePerception(c){
  if(!c)return 10;
  const wis=Math.floor((parseInt(c.wis||10)-10)/2);
  const prof=(c.skills||[]).includes('Perception')?parseInt(c.profBonus||2):0;
  return 10+wis+prof;
}
function getPassiveInvestigation(c){
  const int=Math.floor((parseInt(c.int||10)-10)/2);
  const prof=(c.skills||[]).includes('Investigation')?parseInt(c.profBonus||2):0;
  return 10+int+prof;
}
function getPassiveInsight(c){
  const wis=Math.floor((parseInt(c.wis||10)-10)/2);
  const prof=(c.skills||[]).includes('Insight')?parseInt(c.profBonus||2):0;
  return 10+wis+prof;
}

// ===== SPELL QUICK POPUP =====
function showSpellPopup(spellName,event){
  const allSpells=[...(state.spells||[]),...(state.customSpells||[])];
  const spell=allSpells.find(s=>s.name===spellName);
  const pop=document.getElementById('spell-qpop');
  const nameEl=document.getElementById('sqp-name');
  const bodyEl=document.getElementById('sqp-body');
  if(!pop||!nameEl||!bodyEl)return;
  nameEl.textContent=spellName;
  if(!spell){
    bodyEl.innerHTML='<div style="color:var(--text3);font-size:.82rem;">Load spells from the Spell Database to see details here.</div>';
  } else {
    const sc='school-'+(spell.school||'').toLowerCase();
    bodyEl.innerHTML=`
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.5rem;">
        <span class="tag ${sc}">${spell.level||'Cantrip'}</span>
        <span class="tag ${sc}">${spell.school||''}</span>
        ${spell.concentration==='yes'?'<span class="conc-badge">◉ Conc</span>':''}
        ${spell.ritual==='yes'?'<span class="tag" style="color:#58d68d;border-color:#1e8449;">Ritual</span>':''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.28rem;font-size:.8rem;color:var(--text2);margin-bottom:.5rem;">
        ${spell.casting_time?`<div><span style="color:var(--gold3);">Cast:</span> ${spell.casting_time}</div>`:''}
        ${spell.range?`<div><span style="color:var(--gold3);">Range:</span> ${spell.range}</div>`:''}
        ${spell.duration?`<div><span style="color:var(--gold3);">Duration:</span> ${spell.duration}</div>`:''}
        ${spell.components?`<div><span style="color:var(--gold3);">Components:</span> ${spell.components}</div>`:''}
      </div>
      <div style="font-size:.82rem;color:var(--text2);line-height:1.65;max-height:120px;overflow-y:auto;">${(spell.desc||'').replace(/\n/g,'<br>').slice(0,400)}${(spell.desc||'').length>400?'…':''}</div>`;
  }
  // Position near cursor
  const x=event?Math.min(event.clientX,window.innerWidth-360):200;
  const y=event?Math.min(event.clientY+10,window.innerHeight-300):200;
  pop.style.left=x+'px';pop.style.top=y+'px';pop.style.display='block';
  // Close on outside click
  setTimeout(()=>{
    const close=e=>{if(!pop.contains(e.target)){pop.style.display='none';document.removeEventListener('click',close);}};
    document.addEventListener('click',close);
  },50);
}

// ===== SCROLL TO TOP =====
window.addEventListener('scroll',()=>{
  const btn=document.getElementById('scroll-top');
  if(btn)btn.classList.toggle('vis',window.scrollY>300);
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',(e)=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.key==='?'){document.getElementById('keys-modal').classList.add('open');e.preventDefault();}
  // N = next turn (when initiative page active)
  if(e.key==='n'&&document.getElementById('page-initiative')?.classList.contains('active')&&state.combatants.length){e.preventDefault();nextTurn();}
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    document.getElementById('spell-qpop').style.display='none';
    if(document.getElementById('lib-detail-view')?.style.display!=='none')closeLibDetail();
  }
  if(e.key==='r'&&e.ctrlKey&&!e.shiftKey){e.preventDefault();openRestModal();}
});

// ===== BOOT =====
window.onload=()=>{loadState();};
