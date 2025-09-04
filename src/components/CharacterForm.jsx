import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { loadCharacters, saveCharacter } from '../utils/storage';
import { createEmptyCharacter, calculateModifier, calculateSavingThrows, calculateSkills } from '../types/character';
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
        setCharacter(existingCharacter);
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
    const numValue = parseInt(value) || 0;
    setCharacter(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [stat]: numValue
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setCharacter(prev => ({
      ...prev,
      customFields: prev.customFields.map(field => 
        field.id === fieldId ? { ...field, value } : field
      ),
      updatedAt: new Date().toISOString()
    }));
  };

  const addCustomField = () => {
    const newField = {
      id: `custom_${Date.now()}`,
      label: 'Nuovo Campo',
      value: '',
      type: 'text'
    };
    
    setCharacter(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField],
      updatedAt: new Date().toISOString()
    }));
  };

  const removeCustomField = (fieldId) => {
    setCharacter(prev => ({
      ...prev,
      customFields: prev.customFields.filter(field => field.id !== fieldId),
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSave = () => {
    if (!character.name.trim()) {
      alert('Il nome del personaggio è obbligatorio');
      return;
    }

    const characterToSave = {
      ...character,
      id: character.id || uuidv4(),
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
                onChange={(e) => handleInputChange('level', parseInt(e.target.value) || 1)}
                min="1"
                max="20"
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
                    className="stat-input"
                  />
                  <div className="stat-modifier">
                    {calculateModifier(character.stats[stat]) >= 0 ? '+' : ''}
                    {calculateModifier(character.stats[stat])}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Base Stats */}
        <section className="form-section">
          <div className="section-header">
            <h2 className="section-title">Base Stats</h2>
            <button className="add-field-button" onClick={addCustomField}>
              + Aggiungi Campo
            </button>
          </div>
          
          <div className="custom-fields">
            {character.customFields.map((field) => (
              <div key={field.id} className="custom-field">
                <div className="custom-field-header">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => {
                      const newFields = character.customFields.map(f => 
                        f.id === field.id ? { ...f, label: e.target.value } : f
                      );
                      setCharacter(prev => ({ ...prev, customFields: newFields }));
                    }}
                    className="field-label-input"
                  />
                  <button 
                    className="remove-field-button"
                    onClick={() => removeCustomField(field.id)}
                  >
                    🗑️
                  </button>
                </div>
                
                {field.type === 'textarea' ? (
                  <textarea
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    placeholder="Inserisci il valore"
                    className="form-textarea"
                    rows="3"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    placeholder="Inserisci il valore"
                    className="form-input"
                  />
                )}
              </div>
            ))}
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