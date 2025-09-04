import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadCharacters, saveCharacter } from '../utils/storage';
import { calculateModifier, calculateSpellSaveDC } from '../types/character';

const CharacterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    attributes: false,
    skills: false
  });
  const [activeTab, setActiveTab] = useState('sheet');
  const [editingSpell, setEditingSpell] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingAllSlots, setEditingAllSlots] = useState(false);
  const [tempSpell, setTempSpell] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [fullscreenNote, setFullscreenNote] = useState(null);
  const [editingFullscreenNote, setEditingFullscreenNote] = useState(false);
  const [openSpellSections, setOpenSpellSections] = useState({
    0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true
  });
  const [spellSlotsOpen, setSpellSlotsOpen] = useState(true);

  useEffect(() => {
    const characters = loadCharacters();
    const foundCharacter = characters.find(c => c.id === id);
    if (foundCharacter) {
      setCharacter(foundCharacter);
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [id, navigate]);

  const handleFieldChange = (field, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        [field]: value,
        updatedAt: new Date().toISOString()
      };
      
      // Salva automaticamente quando si modificano i campi base
      saveCharacter(updatedCharacter);
      
      return updatedCharacter;
    });
  };

  const handleStatChange = (stat, value) => {
    const numValue = parseInt(value) || 0;
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        stats: {
          ...prev.stats,
          [stat]: numValue
        },
        updatedAt: new Date().toISOString()
      };
      
      // Salva automaticamente quando si modificano i punteggi caratteristica
      saveCharacter(updatedCharacter);
      
      return updatedCharacter;
    });
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        customFields: prev.customFields.map(field => 
          field.id === fieldId ? { ...field, value: value.toString() } : field
        ),
        updatedAt: new Date().toISOString()
      };
      
      // Salva automaticamente per tutti i campi custom
      saveCharacter(updatedCharacter);
      
      return updatedCharacter;
    });
  };


  const handleDamageTakenChange = (value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        damageTaken: parseInt(value) || 0,
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };



  if (loading) {
    return (
      <div className="character-view">
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="character-view">
        <div className="error">Personaggio non trovato</div>
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

  // Funzioni per gestire l'inventario
  const addInventoryItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1
    };
    
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        equipment: [...(prev.equipment || []), newItem],
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const updateInventoryItem = (itemId, field, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        equipment: prev.equipment.map(item => 
          item.id === itemId ? { ...item, [field]: value } : item
        ),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const removeInventoryItem = (itemId) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        equipment: prev.equipment.filter(item => item.id !== itemId),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  // Funzioni per gestire gli incantesimi
  const addSpell = () => {
    const spellSaveDC = calculateSpellSaveDC(character);
    const newSpell = {
      id: Date.now().toString(),
      name: '',
      description: '',
      savingThrow: spellSaveDC.toString(),
      damage: '',
      level: 0
    };
    
    // Crea l'incantesimo temporaneo e apri la modalità edit
    setTempSpell(newSpell);
    setEditingSpell(newSpell.id);
  };

  const updateSpell = (spellId, field, value) => {
    // Se è un incantesimo temporaneo, aggiorna tempSpell
    if (tempSpell && tempSpell.id === spellId) {
      setTempSpell(prev => ({
        ...prev,
        [field]: value
      }));
      return;
    }
    
    // Altrimenti aggiorna l'incantesimo nella lista
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        spells: prev.spells.map(spell => 
          spell.id === spellId ? { ...spell, [field]: value } : spell
        ),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const removeSpell = (spellId) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        spells: prev.spells.filter(spell => spell.id !== spellId),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const saveSpell = (spellId) => {
    // Se è un incantesimo temporaneo, aggiungilo alla lista
    if (tempSpell && tempSpell.id === spellId) {
      setCharacter(prev => {
        const updatedCharacter = {
          ...prev,
          spells: [...(prev.spells || []), tempSpell],
          updatedAt: new Date().toISOString()
        };
        saveCharacter(updatedCharacter);
        return updatedCharacter;
      });
      
      // Pulisci lo stato temporaneo
      setTempSpell(null);
    }
    
    setEditingSpell(null);
  };

  const openSpellEdit = (spellId) => {
    setEditingSpell(spellId);
  };

  const toggleSpellSection = (level) => {
    setOpenSpellSections(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  // Funzioni per gestire gli slot incantesimi
  const addSpellSlot = () => {
    const newSlot = {
      id: Date.now().toString(),
      level: 1,
      total: 1,
      used: 0
    };
    
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        spellSlots: [...(prev.spellSlots || []), newSlot],
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const updateSpellSlot = (slotId, field, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        spellSlots: prev.spellSlots.map(slot => 
          slot.id === slotId ? { ...slot, [field]: parseInt(value) || 0 } : slot
        ),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const removeSpellSlot = (slotId) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        spellSlots: prev.spellSlots.filter(slot => slot.id !== slotId),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const saveSlot = (slotId) => {
    setEditingSlot(null);
  };

  const openSlotEdit = (slotId) => {
    setEditingSlot(slotId);
  };

  const toggleAllSlotsEdit = () => {
    setEditingAllSlots(!editingAllSlots);
    setEditingSlot(null); // Chiudi edit singolo se attivo
  };

  // Funzioni per gestire le note
  const addNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: '',
      description: ''
    };
    
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        notes: [...(prev.notes || []), newNote],
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
    
    // Apri automaticamente la modalità fullscreen per la nuova nota
    setFullscreenNote(newNote.id);
    setEditingFullscreenNote(true);
  };

  const updateNote = (noteId, field, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        notes: prev.notes.map(note => 
          note.id === noteId ? { ...note, [field]: value } : note
        ),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const removeNote = (noteId) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        notes: prev.notes.filter(note => note.id !== noteId),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const openNoteEdit = (noteId) => {
    setEditingNote(noteId);
  };

  const closeNoteEdit = () => {
    setEditingNote(null);
  };

  const openNoteFullscreen = (noteId) => {
    setFullscreenNote(noteId);
  };

  const closeNoteFullscreen = () => {
    setFullscreenNote(null);
    setEditingFullscreenNote(false);
  };

  const toggleFullscreenNoteEdit = () => {
    setEditingFullscreenNote(!editingFullscreenNote);
  };

  return (
    <div className="character-view">
      <header className="character-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Indietro
        </button>
        <h1 className="character-name-large">{character.name || 'Personaggio Senza Nome'}</h1>
        <div className="header-actions">
          {activeTab === 'sheet' && (
            <button 
              className="unified-edit-button" 
              onClick={() => navigate(`/character/${id}/edit`)}
              title="Modifica Completa"
            >
              ✏️ Modifica
            </button>
          )}
        </div>
      </header>

      <div className="character-content">
        {/* Contenuto della scheda - visibile solo quando activeTab === 'sheet' */}
        {activeTab === 'sheet' && (
          <>
            {/* Overview Section */}
        <section className="character-overview">
          <div className="character-avatar-large">
            <div className="avatar-placeholder-large">⚔️</div>
          </div>
          <div className="character-basic-info">
            <div className="info-row">
              <span className="info-label">Livello</span>
              <input
                type="number"
                value={character.level}
                onChange={(e) => handleFieldChange('level', parseInt(e.target.value) || 1)}
                className="inline-input"
                min="1"
                max="20"
              />
            </div>
            <div className="info-row">
              <span className="info-label">Razza</span>
              <input
                type="text"
                value={character.race}
                onChange={(e) => handleFieldChange('race', e.target.value)}
                className="inline-input"
                placeholder="Razza"
              />
            </div>
            <div className="info-row">
              <span className="info-label">Classe</span>
              <input
                type="text"
                value={character.class}
                onChange={(e) => handleFieldChange('class', e.target.value)}
                className="inline-input"
                placeholder="Classe"
              />
            </div>
          </div>
        </section>

        {/* Core Combat Stats */}
        <section className="stats-card">
          <h3 className="card-title">Statistiche di Combattimento</h3>
          <div className="combat-stats">
            <div className="combat-stat">
              <span className="stat-label">Classe Armatura</span>
              <input
                type="number"
                value={character.customFields.find(f => f.id === 'armorClass')?.value || ''}
                onChange={(e) => handleCustomFieldChange('armorClass', e.target.value)}
                className="stat-input-large"
                placeholder="AC"
              />
            </div>
            <div className="combat-stat">
              <span className="stat-label">Velocità</span>
              <input
                type="number"
                value={character.customFields.find(f => f.id === 'speed')?.value || ''}
                onChange={(e) => handleCustomFieldChange('speed', e.target.value)}
                className="stat-input-large"
                placeholder="30"
                min="0"
                max="120"
              />
            </div>
          </div>
          
          {/* HP e Danni - Sempre modificabili */}
          <div className="hp-section">
            <div className="hp-stat">
              <span className="stat-label">Punti Ferita</span>
              <input
                type="number"
                value={character.customFields.find(f => f.id === 'hitPoints')?.value || ''}
                onChange={(e) => handleCustomFieldChange('hitPoints', e.target.value)}
                className="hp-input"
                placeholder="HP"
                min="0"
              />
            </div>
            <div className="damage-stat">
              <span className="stat-label">Danni Subiti</span>
              <input
                type="number"
                value={character.damageTaken || 0}
                onChange={(e) => handleDamageTakenChange(e.target.value)}
                className="damage-input"
                placeholder="0"
                min="0"
              />
            </div>

          </div>
          
          {/* HP Attuali Calcolati */}
          {(() => {
            const maxHP = parseInt(character.customFields.find(f => f.id === 'hitPoints')?.value) || 0;
            const damageTaken = parseInt(character.damageTaken) || 0;
            const currentHP = Math.max(0, maxHP - damageTaken);
            
            if (maxHP > 0) {
              return (
                <div className="current-hp">
                  <span className="current-hp-label">HP Attuali</span>
                  <span className={`current-hp-value ${currentHP <= maxHP * 0.25 ? 'critical' : currentHP <= maxHP * 0.5 ? 'low' : 'healthy'}`}>
                    {currentHP} / {maxHP}
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </section>

        {/* Attribute Scores - Sempre modificabili */}
        <section className="stats-card accordion-section">
          <div className="accordion-header" onClick={() => toggleSection('attributes')}>
            <h3 className="card-title">Punteggi Caratteristica</h3>
            <span className="accordion-icon">{openSections.attributes ? '▼' : '▶'}</span>
          </div>
          {openSections.attributes && (
            <div className="accordion-content">
              <div className="attributes-grid">
            {Object.entries(statNames).map(([stat, label]) => (
              <div key={stat} className="attribute-item">
                <span className="attribute-label">{label}</span>
                <div className="attribute-value-container">
                  <input
                    type="number"
                    value={character.stats[stat]}
                    onChange={(e) => handleStatChange(stat, e.target.value)}
                    className="attribute-input"
                    min="1"
                    max="30"
                  />
                  <span className="attribute-modifier">
                    {calculateModifier(character.stats[stat]) >= 0 ? '+' : ''}
                    {calculateModifier(character.stats[stat])}
                  </span>
                </div>
              </div>
            ))}
              </div>
            </div>
          )}
        </section>

        {/* Abilità e Tiri Salvezza */}
        <section className="stats-card accordion-section">
          <div className="accordion-header" onClick={() => toggleSection('skills')}>
            <h3 className="card-title">Abilità e Tiri Salvezza</h3>
            <span className="accordion-icon">{openSections.skills ? '▼' : '▶'}</span>
          </div>
          {openSections.skills && (
            <div className="accordion-content">
          
          {/* Tiri Salvezza */}
          <div className="saving-throws-section">
            <h4 className="subsection-title">Tiri Salvezza</h4>
            <div className="saving-throws-grid">
              {Object.entries(statNames).map(([stat, label]) => {
                const modifier = calculateModifier(character.stats[stat]);
                const hasProficiency = character.proficiencies?.savingThrows?.includes(stat) || false;
                const proficiency = hasProficiency ? (character.proficiencyBonus || 2) : 0;
                const total = modifier + proficiency;
                
                return (
                  <div key={stat} className={`saving-throw-item ${hasProficiency ? 'proficient' : ''}`}>
                    <span className="saving-throw-label">{label}</span>
                    <span className="saving-throw-value">
                      {total >= 0 ? '+' : ''}{total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Abilità */}
          <div className="skills-section">
            <h4 className="subsection-title">Abilità</h4>
            <div className="skills-grid">
              {(() => {
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

                return Object.entries(skillNames).map(([skill, label]) => {
                  const stat = skillStats[skill];
                  const modifier = calculateModifier(character.stats[stat]);
                  const hasProficiency = character.proficiencies?.skills?.includes(skill) || false;
                  const proficiency = hasProficiency ? (character.proficiencyBonus || 2) : 0;
                  const total = modifier + proficiency;
                  
                  return (
                    <div key={skill} className={`skill-item ${hasProficiency ? 'proficient' : ''}`}>
                      <span className="skill-label">{label}</span>
                      <span className="skill-value">
                        {total >= 0 ? '+' : ''}{total}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
            </div>
          )}
        </section>

          </>
        )}
      </div>

      {/* Contenuto delle sezioni */}
      {activeTab === 'inventory' && (
        <div className="tab-content">
          <div className="stats-card">
            <div className="inventory-header">
              <h3 className="card-title">Inventario</h3>
              <button className="add-item-button" onClick={addInventoryItem}>
                + Aggiungi Oggetto
              </button>
            </div>
            
            <div className="inventory-list">
              {character.equipment && character.equipment.length > 0 ? (
                character.equipment.map((item) => (
                  <div key={item.id} className="inventory-item">
                    <div className="item-quantity">
                      <input
                        type="number"
                        value={item.quantity || 1}
                        onChange={(e) => updateInventoryItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="quantity-input"
                        min="1"
                        max="999"
                      />
                    </div>
                    <div className="item-name">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)}
                        className="name-input"
                        placeholder="Nome oggetto"
                      />
                    </div>
                    <button 
                      className="remove-item-button"
                      onClick={() => removeInventoryItem(item.id)}
                      title="Rimuovi oggetto"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-inventory">
                  <p>Nessun oggetto nell'inventario</p>
                  <p style={{ fontSize: '0.9rem', color: '#888' }}>
                    Clicca "Aggiungi Oggetto" per iniziare
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spells' && (
        <div className="tab-content">
          <div className="stats-card">
            <div className="spells-header">
              <h3 className="card-title">Incantesimi</h3>
              <button className="add-spell-button" onClick={addSpell}>
                + Aggiungi Incantesimo
              </button>
            </div>
            
            {/* Slot Incantesimi */}
            <div className="spell-slots-accordion">
              <div 
                className="spell-slots-header"
                onClick={() => setSpellSlotsOpen(!spellSlotsOpen)}
              >
                <h4 className="spell-slots-title">
                  Slot Incantesimi
                  <span className="spell-slots-count">
                    ({character.spellSlots?.length || 0})
                  </span>
                </h4>
                <div className={`spell-slots-arrow ${spellSlotsOpen ? 'open' : ''}`}>
                  ▼
                </div>
              </div>
              
              {spellSlotsOpen && (
                <div className="spell-slots-content">
                  <div className="spell-slots-actions">
                    <button className="add-slot-button" onClick={addSpellSlot}>
                      + Aggiungi Slot
                    </button>
                    <button 
                      className={`edit-slots-button ${editingAllSlots ? 'active' : ''}`}
                      onClick={toggleAllSlotsEdit}
                    >
                      {editingAllSlots ? '✏️ Salva' : '✏️ Modifica'}
                    </button>
                  </div>
                  
                  {character.spellSlots && character.spellSlots.length > 0 ? (
                    <div className="spell-slots-list">
                      {character.spellSlots
                        .sort((a, b) => a.level - b.level)
                        .map((slot) => (
                        <div key={slot.id} className="spell-slot-item">
                          <div className="spell-slot-compact">
                            <div className="spell-slot-level-badge">
                              <input
                                type="number"
                                value={slot.level}
                                onChange={(e) => updateSpellSlot(slot.id, 'level', e.target.value)}
                                className="spell-slot-level-input"
                                min="0"
                                max="9"
                              />
                            </div>
                            <div className="spell-slot-usage-compact">
                              <input
                                type="number"
                                value={slot.used}
                                onChange={(e) => updateSpellSlot(slot.id, 'used', e.target.value)}
                                className="spell-slot-input-compact"
                                min="0"
                                max={slot.total}
                              />
                              <span className="spell-slot-separator">/</span>
                              <input
                                type="number"
                                value={slot.total}
                                onChange={(e) => updateSpellSlot(slot.id, 'total', e.target.value)}
                                className="spell-slot-input-compact"
                                min="1"
                                max="20"
                              />
                            </div>
                            
                            {editingAllSlots && (
                              <button 
                                className="remove-slot-button-inline"
                                onClick={() => removeSpellSlot(slot.id)}
                                title="Rimuovi slot"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-slots">
                      <p>Nessuno slot incantesimi configurato</p>
                      <p style={{ fontSize: '0.9rem', color: '#888' }}>
                        Clicca "Aggiungi Slot" per iniziare
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Modalità di creazione incantesimo */}
            {editingSpell && tempSpell && (
              <div className="spell-creation-mode">
                <div className="spell-item">
                  <div className="spell-main-info">
                    <div className="spell-name">
                      <input
                        type="text"
                        value={tempSpell.name || ''}
                        onChange={(e) => updateSpell(editingSpell, 'name', e.target.value)}
                        className="spell-name-input"
                        placeholder="Nome incantesimo"
                      />
                    </div>
                    <div className="spell-level">
                      <label className="spell-label">Livello:</label>
                      <input
                        type="number"
                        value={tempSpell.level || 0}
                        onChange={(e) => updateSpell(editingSpell, 'level', parseInt(e.target.value) || 0)}
                        className="spell-level-input"
                        min="0"
                        max="9"
                      />
                    </div>
                  </div>
                  
                  <div className="spell-details">
                    <div className="spell-saving-throw">
                      <label className="spell-label">Tiro Salvezza:</label>
                      <input
                        type="number"
                        value={tempSpell.savingThrow || calculateSpellSaveDC(character)}
                        onChange={(e) => updateSpell(editingSpell, 'savingThrow', e.target.value)}
                        className="spell-detail-input"
                        min="1"
                        max="30"
                      />
                    </div>
                    <div className="spell-damage">
                      <label className="spell-label">Danni:</label>
                      <input
                        type="text"
                        value={tempSpell.damage || ''}
                        onChange={(e) => updateSpell(editingSpell, 'damage', e.target.value)}
                        className="spell-detail-input"
                        placeholder="es. 1d6+3"
                      />
                    </div>
                  </div>
                  
                  <div className="spell-description">
                    <label className="spell-label">Descrizione:</label>
                    <textarea
                      value={tempSpell.description || ''}
                      onChange={(e) => updateSpell(editingSpell, 'description', e.target.value)}
                      className="spell-description-input"
                      placeholder="Descrizione dell'incantesimo..."
                      rows="3"
                    />
                  </div>
                  
                  <div className="spell-actions">
                    <button 
                      className="save-spell-button"
                      onClick={() => saveSpell(editingSpell)}
                    >
                      💾 Salva
                    </button>
                    <button 
                      className="remove-spell-button"
                      onClick={() => {
                        setEditingSpell(null);
                        setTempSpell(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="spells-list">
              {character.spells && character.spells.length > 0 ? (
                (() => {
                  // Raggruppa gli incantesimi per livello
                  const spellsByLevel = [...character.spells].reduce((acc, spell) => {
                    const level = spell.level || 0;
                    if (!acc[level]) acc[level] = [];
                    acc[level].push(spell);
                    return acc;
                  }, {});

                  // Ordina i livelli
                  const sortedLevels = Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b));

                  return sortedLevels.map(level => {
                    const levelNum = parseInt(level);
                    const spells = spellsByLevel[level];
                    const isOpen = openSpellSections[levelNum];

                    return (
                      <div key={level} className="spell-level-section">
                        <div 
                          className="spell-level-header"
                          onClick={() => toggleSpellSection(levelNum)}
                        >
                          <h4 className="spell-level-title">
                            {levelNum === 0 ? 'Trucchetti' : `Incantesimi di ${levelNum}° Livello`}
                            <span className="spell-count">({spells.length})</span>
                          </h4>
                          <div className={`spell-level-arrow ${isOpen ? 'open' : ''}`}>
                            ▼
                          </div>
                        </div>
                        
                        {isOpen && (
                          <div className="spell-level-content">
                            {spells.map((spell) => (
                              <div key={spell.id} className="spell-item">
                                {editingSpell === spell.id ? (
                                  // Vista di modifica
                                  <>
                                    <div className="spell-main-info">
                                      <div className="spell-name">
                                        <input
                                          type="text"
                                          value={spell.name || ''}
                                          onChange={(e) => updateSpell(spell.id, 'name', e.target.value)}
                                          className="spell-name-input"
                                          placeholder="Nome incantesimo"
                                        />
                                      </div>
                                      <div className="spell-level">
                                        <label className="spell-label">Livello:</label>
                                        <input
                                          type="number"
                                          value={spell.level || 0}
                                          onChange={(e) => updateSpell(spell.id, 'level', parseInt(e.target.value) || 0)}
                                          className="spell-level-input"
                                          min="0"
                                          max="9"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="spell-details">
                                      <div className="spell-saving-throw">
                                        <label className="spell-label">Tiro Salvezza:</label>
                                        <input
                                          type="text"
                                          value={spell.savingThrow || ''}
                                          onChange={(e) => updateSpell(spell.id, 'savingThrow', e.target.value)}
                                          className="spell-detail-input"
                                          placeholder="es. Destrezza CD 15"
                                        />
                                      </div>
                                      <div className="spell-damage">
                                        <label className="spell-label">Danni:</label>
                                        <input
                                          type="text"
                                          value={spell.damage || ''}
                                          onChange={(e) => updateSpell(spell.id, 'damage', e.target.value)}
                                          className="spell-detail-input"
                                          placeholder="es. 2d6+3"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="spell-description">
                                      <label className="spell-label">Descrizione:</label>
                                      <textarea
                                        value={spell.description || ''}
                                        onChange={(e) => updateSpell(spell.id, 'description', e.target.value)}
                                        className="spell-description-input"
                                        placeholder="Descrizione dell'incantesimo..."
                                        rows="3"
                                      />
                                    </div>
                                    
                                    <div className="spell-actions">
                                      <button 
                                        className="save-spell-button"
                                        onClick={() => saveSpell(spell.id)}
                                      >
                                        💾 Salva
                                      </button>
                                      <button 
                                        className="remove-spell-button"
                                        onClick={() => removeSpell(spell.id)}
                                        title="Rimuovi incantesimo"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  // Vista compatta
                                  <div 
                                    className="spell-compact"
                                    onClick={() => openSpellEdit(spell.id)}
                                  >
                                    <div className="spell-compact-info">
                                      <div className="spell-compact-name">
                                        <span className="spell-name-text">{spell.name || 'Incantesimo Senza Nome'}</span>
                                        <span className={`spell-level-badge ${spell.level === 0 ? 'cantrip' : ''}`}>
                                          {spell.level === 0 ? 'Trucchetto' : `Liv. ${spell.level}`}
                                        </span>
                                      </div>
                                      <div className="spell-compact-details">
                                        {spell.savingThrow && (
                                          <span className="spell-detail-badge saving-throw">
                                            🎯 {spell.savingThrow}
                                          </span>
                                        )}
                                        {spell.damage && (
                                          <span className="spell-detail-badge damage">
                                            ⚔️ {spell.damage}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="spell-compact-arrow">→</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="empty-spells">
                  <p>Nessun incantesimo conosciuto</p>
                  <p style={{ fontSize: '0.9rem', color: '#888' }}>
                    Clicca "Aggiungi Incantesimo" per iniziare
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="tab-content">
          <div className="notes-section">
            <div className="notes-header">
              <h3 className="card-title">Note</h3>
              <button className="add-note-button" onClick={addNote}>
                + Aggiungi Nota
              </button>
            </div>
            
            {character.notes && character.notes.length > 0 ? (
              <div className="notes-list">
                {character.notes.map((note) => (
                  <div key={note.id} className="note-item">
                    {editingNote === note.id ? (
                      // Vista di modifica
                      <div className="note-edit">
                        <div className="note-title-edit">
                          <label className="note-label">Titolo:</label>
                          <input
                            type="text"
                            value={note.title || ''}
                            onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                            className="note-title-input"
                            placeholder="Titolo della nota"
                          />
                        </div>
                        <div className="note-description-edit">
                          <label className="note-label">Descrizione:</label>
                          <textarea
                            value={note.description || ''}
                            onChange={(e) => updateNote(note.id, 'description', e.target.value)}
                            className="note-description-input"
                            placeholder="Descrizione della nota..."
                            rows="4"
                          />
                        </div>
                        <div className="note-actions">
                          <button 
                            className="save-note-button"
                            onClick={() => closeNoteEdit()}
                          >
                            💾 Salva
                          </button>
                          <button 
                            className="remove-note-button"
                            onClick={() => removeNote(note.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Vista compatta
                      <div className="note-compact">
                        <div 
                          className="note-compact-content"
                          onClick={() => openNoteFullscreen(note.id)}
                        >
                          <div className="note-title">
                            {note.title || 'Nota senza titolo'}
                          </div>
                          {note.description && (
                            <div className="note-description-preview">
                              {note.description.length > 100 
                                ? `${note.description.substring(0, 100)}...` 
                                : note.description
                              }
                            </div>
                          )}
                        </div>
                        <button 
                          className="remove-note-button-inline"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNote(note.id);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-notes">
                <p>Nessuna nota presente</p>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>
                  Clicca "Aggiungi Nota" per iniziare
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modalità fullscreen per le note */}
      {fullscreenNote && (
        <div className="note-fullscreen-overlay">
          <div className="note-fullscreen-content">
            <div className="note-fullscreen-header">
              <button 
                className="note-fullscreen-close"
                onClick={() => closeNoteFullscreen()}
              >
                ×
              </button>
            </div>
            
            <div className="note-fullscreen-body">
              {(() => {
                const note = character.notes?.find(n => n.id === fullscreenNote);
                if (!note) return null;
                
                return (
                  <>
                    {editingFullscreenNote ? (
                      // Vista di modifica
                      <>
                        <input
                          type="text"
                          value={note.title || ''}
                          onChange={(e) => updateNote(note.id, 'title', e.target.value)}
                          className="note-fullscreen-title-input"
                          placeholder="Titolo della nota"
                        />
                        <textarea
                          value={note.description || ''}
                          onChange={(e) => updateNote(note.id, 'description', e.target.value)}
                          className="note-fullscreen-description-input"
                          placeholder="Descrizione della nota..."
                        />
                      </>
                    ) : (
                      // Vista di lettura
                      <>
                        <h1 
                          className="note-fullscreen-title"
                          onClick={toggleFullscreenNoteEdit}
                        >
                          {note.title || 'Nota senza titolo'}
                        </h1>
                        <div 
                          className="note-fullscreen-description"
                          onClick={toggleFullscreenNoteEdit}
                        >
                          {note.description || 'Nessuna descrizione disponibile.'}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Navbar inferiore */}
      <nav className="character-bottom-nav">
        <button 
          className={`nav-tab ${activeTab === 'sheet' ? 'active' : ''}`}
          onClick={() => setActiveTab('sheet')}
        >
          <div className="nav-tab-icon">📋</div>
          <span>Scheda</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <div className="nav-tab-icon">🎒</div>
          <span>Inventario</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'spells' ? 'active' : ''}`}
          onClick={() => setActiveTab('spells')}
        >
          <div className="nav-tab-icon">✨</div>
          <span>Incantesimi</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <div className="nav-tab-icon">📝</div>
          <span>Note</span>
        </button>
      </nav>
    </div>
  );
};

export default CharacterView;