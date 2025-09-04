import { calculateModifier, calculateSavingThrows, calculateSkills } from '../types/character';

const CharacterStats = ({ character }) => {
  const statNames = {
    strength: 'Forza',
    dexterity: 'Destrezza', 
    constitution: 'Costituzione',
    intelligence: 'Intelligenza',
    wisdom: 'Saggezza',
    charisma: 'Carisma'
  };

  const skillNames = {
    athletics: 'Atletica',
    acrobatics: 'Acrobazia',
    sleightOfHand: 'Rapidità di Mano',
    stealth: 'Furtività',
    arcana: 'Arcano',
    history: 'Storia',
    investigation: 'Indagare',
    nature: 'Natura',
    religion: 'Religione',
    animalHandling: 'Addestrare Animali',
    insight: 'Intuizione',
    medicine: 'Medicina',
    perception: 'Percezione',
    survival: 'Sopravvivenza',
    deception: 'Inganno',
    intimidation: 'Intimidire',
    performance: 'Intrattenere',
    persuasion: 'Persuasione'
  };

  const skillStats = {
    athletics: 'strength',
    acrobatics: 'dexterity',
    sleightOfHand: 'dexterity',
    stealth: 'dexterity',
    arcana: 'intelligence',
    history: 'intelligence',
    investigation: 'intelligence',
    nature: 'intelligence',
    religion: 'intelligence',
    animalHandling: 'wisdom',
    insight: 'wisdom',
    medicine: 'wisdom',
    perception: 'wisdom',
    survival: 'wisdom',
    deception: 'charisma',
    intimidation: 'charisma',
    performance: 'charisma',
    persuasion: 'charisma'
  };

  return (
    <div className="character-stats">
      {/* Tiri Salvezza */}
      <section className="stats-section">
        <h3 className="stats-title">Tiri Salvezza</h3>
        <div className="saving-throws-grid">
          {Object.entries(statNames).map(([stat, label]) => {
            const modifier = calculateModifier(character.stats[stat]);
            const hasProficiency = character.proficiencies?.savingThrows?.includes(stat) || false;
            const proficiency = hasProficiency ? (character.proficiencyBonus || 2) : 0;
            const total = modifier + proficiency;
            
            return (
              <div key={stat} className={`saving-throw-item ${hasProficiency ? 'proficient' : ''}`}>
                <span className="stat-name">{label}</span>
                <span className="stat-value">
                  {total >= 0 ? '+' : ''}{total}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Abilità */}
      <section className="stats-section">
        <h3 className="stats-title">Abilità</h3>
        <div className="skills-grid">
          {Object.entries(skillNames).map(([skill, label]) => {
            const stat = skillStats[skill];
            const modifier = calculateModifier(character.stats[stat]);
            const hasProficiency = character.proficiencies?.skills?.includes(skill) || false;
            const proficiency = hasProficiency ? (character.proficiencyBonus || 2) : 0;
            const total = modifier + proficiency;
            
            return (
              <div key={skill} className={`skill-item ${hasProficiency ? 'proficient' : ''}`}>
                <span className="skill-name">{label}</span>
                <span className="skill-value">
                  {total >= 0 ? '+' : ''}{total}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default CharacterStats;