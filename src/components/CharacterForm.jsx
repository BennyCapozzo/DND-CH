import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { loadCharacters, saveCharacter } from '../utils/storage';
import { createEmptyCharacter, calculateModifier, calculateSavingThrows, calculateSkills, migrateCharacter } from '../types/character';
import CharacterStats from './CharacterStats';

const CharacterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== 'new';
  
  const [character, setCharacter] = useState(createEmptyCharacter());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isEditing) {
      const characters = loadCharacters();
      const existingCharacter = characters.find(c => c.id === id);
      if (existingCharacter) {
        // Migra il personaggio esistente al nuovo formato
        setCharacter(migrateCharacter(existingCharacter));
      } else {
        navigate('/');
      }
    } else if (id === 'new') {
      // Nuovo personaggio - mantieni il personaggio vuoto
      setCharacter(createEmptyCharacter());
    }
    setLoading(false);
  }, [id, isEditing, navigate]);

  const handleInputChange = (field, value) => {
    setCharacter(prev => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleStatChange = (stat, value) => {
    const processedValue = value === '' ? '' : parseInt(value) || '';
    setCharacter(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: processedValue
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const handleBaseStatChange = (statId, value) => {
    setCharacter(prev => ({
      ...prev,
      baseStats: {
        ...prev.baseStats,
        [statId]: value
      },
      updatedAt: new Date().toISOString()
    }));
  };


  const handleSave = () => {
    if (!character.name.trim()) {
      alert('Il nome del personaggio è obbligatorio');
      return;
    }

    // Imposta valori di default per campi vuoti
    const characterToSave = {
      ...character,
      id: character.id || uuidv4(),
      level: character.level === '' ? 1 : character.level,
      stats: {
        strength: character.stats.strength === '' ? 10 : character.stats.strength,
        dexterity: character.stats.dexterity === '' ? 10 : character.stats.dexterity,
        constitution: character.stats.constitution === '' ? 10 : character.stats.constitution,
        intelligence: character.stats.intelligence === '' ? 10 : character.stats.intelligence,
        wisdom: character.stats.wisdom === '' ? 10 : character.stats.wisdom,
        charisma: character.stats.charisma === '' ? 10 : character.stats.charisma
      },
      createdAt: character.createdAt || new Date().toISOString()
    };

    saveCharacter(characterToSave);
    navigate(`/character/${characterToSave.id}`);
  };

  if (loading) {
    return (
      <div className="character-form">
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  const statNames = {
    strength: 'Forza',
    dexterity: 'Destrezza', 
    constitution: 'Costituzione',
    intelligence: 'Intelligenza',
    wisdom: 'Saggezza',
    charisma: 'Carisma'
  };

  return (
    <div className="character-form">
      <header className="form-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Indietro
        </button>
        <h1>{isEditing ? 'Modifica Personaggio' : 'Nuovo Personaggio'}</h1>
        <button className="save-button" onClick={handleSave}>
          Salva
        </button>
      </header>

      <div className="form-content">
        {/* Informazioni Base */}
        <section className="form-section">
          <h2 className="section-title">Informazioni Base</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Nome Personaggio *</label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Inserisci il nome"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Classe</label>
              <input
                type="text"
                value={character.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                placeholder="es. Guerriero, Mago, Ladro..."
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Livello</label>
              <input
                type="number"
                value={character.level}
                onChange={(e) => handleInputChange('level', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                min="1"
                max="20"
                placeholder="1"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Razza</label>
              <input
                type="text"
                value={character.race}
                onChange={(e) => handleInputChange('race', e.target.value)}
                placeholder="es. Umano, Elfo, Nano..."
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Background</label>
              <input
                type="text"
                value={character.background}
                onChange={(e) => handleInputChange('background', e.target.value)}
                placeholder="es. Soldato, Accademico..."
                className="form-input"
              />
            </div>
          </div>
        </section>

        {/* Statistiche */}
        <section className="form-section">
          <h2 className="section-title">Statistiche</h2>
          <div className="stats-grid">
            {Object.entries(statNames).map(([stat, label]) => (
              <div key={stat} className="stat-group">
                <label className="stat-label">{label}</label>
                <div className="stat-container">
                  <input
                    type="number"
                    value={character.stats[stat]}
                    onChange={(e) => handleStatChange(stat, e.target.value)}
                    min="1"
                    max="30"
                    placeholder="10"
                    className="stat-input"
                  />
                  <div className="stat-modifier">
                    {calculateModifier(character.stats[stat] || 10) >= 0 ? '+' : ''}
                    {calculateModifier(character.stats[stat] || 10)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Statistiche Base */}
        <section className="form-section">
          <h2 className="section-title">Statistiche Base</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Punti Ferita</label>
              <input
                type="number"
                value={character.baseStats?.hitPoints || ''}
                onChange={(e) => handleBaseStatChange('hitPoints', e.target.value)}
                placeholder="0"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Punti Ferita Temporanei</label>
              <input
                type="number"
                value={character.baseStats?.tempHitPoints || ''}
                onChange={(e) => handleBaseStatChange('tempHitPoints', e.target.value)}
                placeholder="0"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Classe Armatura</label>
              <input
                type="number"
                value={character.baseStats?.armorClass || ''}
                onChange={(e) => handleBaseStatChange('armorClass', e.target.value)}
                placeholder="10"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Velocità</label>
              <input
                type="text"
                value={character.baseStats?.speed || ''}
                onChange={(e) => handleBaseStatChange('speed', e.target.value)}
                placeholder="9 metri"
                className="form-input"
              />
            </div>
          </div>
        </section>


        {/* Competenze */}
        <section className="form-section">
          <h2 className="section-title">Competenze</h2>
          
          {/* Bonus di Competenza */}
          <div className="proficiency-bonus-section">
            <label className="form-label">Bonus di Competenza</label>
            <input
              type="number"
              value={character.proficiencyBonus || 2}
              onChange={(e) => handleInputChange('proficiencyBonus', parseInt(e.target.value) || 2)}
              min="1"
              max="6"
              className="form-input proficiency-input"
            />
          </div>

          {/* Caratteristica di Lancio Incantesimi */}
          <div className="spellcasting-ability-section">
            <label className="form-label">Caratteristica di Lancio Incantesimi</label>
            <select
              value={character.spellcastingAbility || ''}
              onChange={(e) => handleInputChange('spellcastingAbility', e.target.value || null)}
              className="form-input"
            >
              <option value="">Automatica (caratteristica più alta)</option>
              <option value="strength">Forza</option>
              <option value="dexterity">Destrezza</option>
              <option value="constitution">Costituzione</option>
              <option value="intelligence">Intelligenza</option>
              <option value="wisdom">Saggezza</option>
              <option value="charisma">Carisma</option>
            </select>
          </div>

          {/* Tiri Salvezza Competenti */}
          <div className="proficiencies-section">
            <h3 className="subsection-title">Tiri Salvezza Competenti</h3>
            <div className="proficiency-grid">
              {Object.entries({
                strength: 'Forza',
                dexterity: 'Destrezza', 
                constitution: 'Costituzione',
                intelligence: 'Intelligenza',
                wisdom: 'Saggezza',
                charisma: 'Carisma'
              }).map(([stat, label]) => (
                <label key={stat} className="proficiency-checkbox">
                  <input
                    type="checkbox"
                    checked={character.proficiencies?.savingThrows?.includes(stat) || false}
                    onChange={(e) => {
                      const currentProficiencies = character.proficiencies?.savingThrows || [];
                      const newProficiencies = e.target.checked
                        ? [...currentProficiencies, stat]
                        : currentProficiencies.filter(s => s !== stat);
                      
                      setCharacter(prev => ({
                        ...prev,
                        proficiencies: {
                          ...prev.proficiencies,
                          savingThrows: newProficiencies
                        }
                      }));
                    }}
                  />
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Abilità Competenti */}
          <div className="proficiencies-section">
            <h3 className="subsection-title">Abilità Competenti</h3>
            <div className="proficiency-grid skills-grid">
              {Object.entries({
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
              }).map(([skill, label]) => (
                <label key={skill} className="proficiency-checkbox">
                  <input
                    type="checkbox"
                    checked={character.proficiencies?.skills?.includes(skill) || false}
                    onChange={(e) => {
                      const currentProficiencies = character.proficiencies?.skills || [];
                      const newProficiencies = e.target.checked
                        ? [...currentProficiencies, skill]
                        : currentProficiencies.filter(s => s !== skill);
                      
                      setCharacter(prev => ({
                        ...prev,
                        proficiencies: {
                          ...prev.proficiencies,
                          skills: newProficiencies
                        }
                      }));
                    }}
                  />
                  <span className="checkbox-label">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Statistiche Calcolate */}
        <section className="form-section">
          <h2 className="section-title">Statistiche Calcolate</h2>
          <CharacterStats character={character} />
        </section>

        {/* Pulsante Salva in Fondo */}
        <div className="form-footer">
          <button className="save-button-large" onClick={handleSave}>
            💾 Salva Personaggio
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterForm;