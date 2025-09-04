// Modello dati flessibile per personaggi D&D
export const createEmptyCharacter = () => ({
  id: null, // sarà generato con uuid
  name: '',
  class: '',
  level: 1,
  race: '',
  background: '',
  
  // Statistiche base (sempre presenti)
  stats: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
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
  
  // Campi personalizzati (l'utente può aggiungere/rimuovere)
  customFields: [
    { id: 'hitPoints', label: 'Punti Ferita', value: '', type: 'number' },
    { id: 'armorClass', label: 'Classe Armatura', value: '', type: 'number' },
    { id: 'speed', label: 'Velocità', value: '', type: 'text' }
  ],
  
  // Equipaggiamento e incantesimi (array di oggetti personalizzabili)
  equipment: [],
  spells: [],
  notes: [],
  
  // Slot incantesimi (array di oggetti con livello, totali e usati)
  spellSlots: [],
  
  // Metadati
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Calcola modificatore da statistica
export const calculateModifier = (stat) => {
  return Math.floor((stat - 10) / 2);
};

// Calcola tiri salvezza
export const calculateSavingThrows = (stats, proficiencies = []) => {
  const savingThrows = {};
  Object.keys(stats).forEach(stat => {
    const modifier = calculateModifier(stats[stat]);
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
    const modifier = calculateModifier(stats[skills[skill].stat]);
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
    const highestStat = Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);
    const modifier = calculateModifier(stats[highestStat]);
    return 8 + character.proficiencyBonus + modifier;
  }
  
  const modifier = calculateModifier(character.stats[character.spellcastingAbility]);
  return 8 + character.proficiencyBonus + modifier;
};