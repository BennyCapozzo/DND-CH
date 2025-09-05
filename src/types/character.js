// Modello dati flessibile per personaggi D&D
export const createEmptyCharacter = () => ({
  id: null, // sarà generato con uuid
  name: '',
  class: '',
  level: '',
  race: '',
  background: '',
  
  // Statistiche base (inizializzate vuote, verranno impostate a 10 se non compilate)
  stats: {
    strength: '',
    dexterity: '',
    constitution: '',
    intelligence: '',
    wisdom: '',
    charisma: ''
  },
  
  // Bonus di competenza (per calcoli automatici)
  proficiencyBonus: 2,
  
  // Caratteristica di lancio incantesimi
  spellcastingAbility: null, // 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
  
  // Statistiche di combattimento
  damageTaken: 0,
  
  // Competenze (array di stringhe)
  proficiencies: {
    savingThrows: [], // es. ['strength', 'constitution']
    skills: [] // es. ['athletics', 'perception']
  },
  
  // Campi base fissi (non modificabili dall'utente)
  baseStats: {
    hitPoints: '',
    tempHitPoints: '',
    armorClass: '',
    speed: ''
  },
  
  
  // Armi
  weapons: [],
  
  // Lingue conosciute
  languages: [],
  
  // Equipaggiamento e incantesimi (array di oggetti personalizzabili)
  equipment: [],
  spells: [],
  notes: [],
  
  // Valute D&D
  currency: {
    copper: '',     // Rame (CP)
    silver: '',     // Argento (SP)  
    electrum: '',   // Electrum (EP)
    gold: '',       // Oro (GP)
    platinum: ''    // Platino (PP)
  },
  
  // Slot incantesimi (array di oggetti con livello, totali e usati)
  spellSlots: [],
  
  // Metadati
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Funzione per migrare caratteri esistenti al nuovo formato
export const migrateCharacter = (character) => {
  let migratedCharacter = { ...character };
  
  // Se il personaggio non ha baseStats, migra dai customFields
  if (!character.baseStats && character.customFields) {
    const hitPoints = character.customFields.find(f => f.id === 'hitPoints');
    const armorClass = character.customFields.find(f => f.id === 'armorClass');
    const speed = character.customFields.find(f => f.id === 'speed');
    
    migratedCharacter.baseStats = {
      hitPoints: hitPoints?.value || '',
      armorClass: armorClass?.value || '',
      speed: speed?.value || ''
    };
  }
  
  // Se il personaggio non ha baseStats, crealo vuoto
  if (!migratedCharacter.baseStats) {
    migratedCharacter.baseStats = {
      hitPoints: '',
      tempHitPoints: '',
      armorClass: '',
      speed: ''
    };
  }
  
  // Se il personaggio ha baseStats ma non ha tempHitPoints, aggiungilo
  if (migratedCharacter.baseStats && !migratedCharacter.baseStats.hasOwnProperty('tempHitPoints')) {
    migratedCharacter.baseStats.tempHitPoints = '';
  }
  
  // Se il personaggio non ha weapons, aggiungilo
  if (!migratedCharacter.weapons) {
    migratedCharacter.weapons = [];
  }
  
  // Se il personaggio non ha languages, aggiungilo
  if (!migratedCharacter.languages) {
    migratedCharacter.languages = [];
  }
  
  // Se il personaggio non ha currency, aggiungilo
  if (!migratedCharacter.currency) {
    migratedCharacter.currency = {
      copper: '',
      silver: '',
      electrum: '',
      gold: '',
      platinum: ''
    };
  }
  
  // Migra valute numeriche in stringhe per compatibilità mobile
  if (migratedCharacter.currency) {
    Object.keys(migratedCharacter.currency).forEach(key => {
      const value = migratedCharacter.currency[key];
      if (typeof value === 'number') {
        migratedCharacter.currency[key] = value === 0 ? '' : value.toString();
      }
    });
  }
  
  // Migra le armi dal vecchio formato damage al nuovo formato damageDice + damageType
  if (migratedCharacter.weapons && migratedCharacter.weapons.length > 0) {
    migratedCharacter.weapons = migratedCharacter.weapons.map(weapon => {
      if (weapon.damage && !weapon.damageDice && !weapon.damageType) {
        const parts = weapon.damage.split(' ');
        console.log(parts);
        const migratedWeapon = {
          ...weapon,
          damageDice: parts[0] || '',
          damageType: parts.slice(1).join(' ') || ''
        };
        // Rimuovi il vecchio campo damage
        delete migratedWeapon.damage;
        return migratedWeapon;
      }
      return weapon;
    });
  }
  
  // Migra gli incantesimi per supportare campi opzionali
  if (migratedCharacter.spells && migratedCharacter.spells.length > 0) {
    migratedCharacter.spells = migratedCharacter.spells.map(spell => {
      const migratedSpell = { ...spell };
      
      // Aggiungi i nuovi campi se non esistono
      if (!migratedSpell.hasOwnProperty('hasSavingThrow')) {
        migratedSpell.hasSavingThrow = spell.savingThrow && spell.savingThrow !== '';
      }
      
      if (!migratedSpell.hasOwnProperty('hasDamage')) {
        migratedSpell.hasDamage = spell.damage && spell.damage !== '';
      }
      
      // Aggiungi i campi per tipo di danno e rituale se non esistono
      if (!migratedSpell.hasOwnProperty('damageType')) {
        migratedSpell.damageType = '';
      }
      
      if (!migratedSpell.hasOwnProperty('isRitual')) {
        migratedSpell.isRitual = false;
      }
      
      // Migra il livello se è un numero a stringa vuota per compatibilità mobile
      if (typeof migratedSpell.level === 'number' && migratedSpell.level === 0) {
        migratedSpell.level = '';
      }
      
      // Aggiungi il campo preparato se non esiste
      if (!migratedSpell.hasOwnProperty('isPrepared')) {
        migratedSpell.isPrepared = false;
      }
      
      return migratedSpell;
    });
  }
  
  // Rimuovi completamente customFields dal personaggio migrato
  const { customFields, ...characterWithoutCustomFields } = migratedCharacter;
  
  return characterWithoutCustomFields;
};

// Calcola modificatore da statistica
export const calculateModifier = (stat) => {
  return Math.floor((stat - 10) / 2);
};

// Calcola tiri salvezza
export const calculateSavingThrows = (stats, proficiencies = []) => {
  const savingThrows = {};
  Object.keys(stats).forEach(stat => {
    const modifier = calculateModifier(stats[stat] || 10);
    const proficiency = proficiencies.includes(stat) ? 2 : 0; // Assumendo prof bonus +2 per semplicità
    savingThrows[stat] = modifier + proficiency;
  });
  return savingThrows;
};

// Calcola abilità
export const calculateSkills = (stats, skillProficiencies = []) => {
  const skills = {
    // Forza
    athletics: { stat: 'strength', proficient: skillProficiencies.includes('athletics') },
    
    // Destrezza
    acrobatics: { stat: 'dexterity', proficient: skillProficiencies.includes('acrobatics') },
    sleightOfHand: { stat: 'dexterity', proficient: skillProficiencies.includes('sleightOfHand') },
    stealth: { stat: 'dexterity', proficient: skillProficiencies.includes('stealth') },
    
    // Intelligenza
    arcana: { stat: 'intelligence', proficient: skillProficiencies.includes('arcana') },
    history: { stat: 'intelligence', proficient: skillProficiencies.includes('history') },
    investigation: { stat: 'intelligence', proficient: skillProficiencies.includes('investigation') },
    nature: { stat: 'intelligence', proficient: skillProficiencies.includes('nature') },
    religion: { stat: 'intelligence', proficient: skillProficiencies.includes('religion') },
    
    // Saggezza
    animalHandling: { stat: 'wisdom', proficient: skillProficiencies.includes('animalHandling') },
    insight: { stat: 'wisdom', proficient: skillProficiencies.includes('insight') },
    medicine: { stat: 'wisdom', proficient: skillProficiencies.includes('medicine') },
    perception: { stat: 'wisdom', proficient: skillProficiencies.includes('perception') },
    survival: { stat: 'wisdom', proficient: skillProficiencies.includes('survival') },
    
    // Carisma
    deception: { stat: 'charisma', proficient: skillProficiencies.includes('deception') },
    intimidation: { stat: 'charisma', proficient: skillProficiencies.includes('intimidation') },
    performance: { stat: 'charisma', proficient: skillProficiencies.includes('performance') },
    persuasion: { stat: 'charisma', proficient: skillProficiencies.includes('persuasion') }
  };
  
  const calculatedSkills = {};
  Object.keys(skills).forEach(skill => {
    const modifier = calculateModifier(stats[skills[skill].stat] || 10);
    const proficiency = skills[skill].proficient ? 2 : 0; // Assumendo prof bonus +2
    calculatedSkills[skill] = modifier + proficiency;
  });
  
  return calculatedSkills;
};

// Calcola il tiro salvezza per gli incantesimi
export const calculateSpellSaveDC = (character) => {
  if (!character.spellcastingAbility) {
    // Se non è specificata, usa la caratteristica più alta
    const stats = character.stats;
    const statsWithDefaults = Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [key, value || 10])
    );
    const highestStat = Object.keys(statsWithDefaults).reduce((a, b) => statsWithDefaults[a] > statsWithDefaults[b] ? a : b);
    const modifier = calculateModifier(statsWithDefaults[highestStat]);
    return 8 + character.proficiencyBonus + modifier;
  }
  
  const modifier = calculateModifier(character.stats[character.spellcastingAbility] || 10);
  return 8 + character.proficiencyBonus + modifier;
};

// Calcola il tiro per colpire di un'arma
export const calculateWeaponHit = (character, weapon) => {
  if (!weapon || !character) return '+0';
  
  // Ottieni il modificatore della caratteristica appropriata
  const statValue = character.stats[weapon.ability] || 10;
  const abilityModifier = calculateModifier(statValue);
  
  // Aggiungi il bonus di competenza se competente
  const proficiencyBonus = weapon.isProficient ? (character.proficiencyBonus || 2) : 0;
  
  const totalBonus = abilityModifier + proficiencyBonus;
  
  return totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;
};