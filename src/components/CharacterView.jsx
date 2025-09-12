import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadCharacters, saveCharacter } from '../utils/storage';
import { calculateModifier, calculateSpellSaveDC, migrateCharacter, calculateWeaponHit } from '../types/character';

const CharacterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    attributes: false,
    skills: false,
    weapons: false,
    languages: false
  });
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sheet');
  const [editingSpell, setEditingSpell] = useState(null);
  const [viewingSpell, setViewingSpell] = useState(null);
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
  const [editingWeapon, setEditingWeapon] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showingTooltip, setShowingTooltip] = useState(null);

  useEffect(() => {
    const characters = loadCharacters();
    const foundCharacter = characters.find(c => c.id === id);
    if (foundCharacter) {
      // Migra il personaggio esistente al nuovo formato
      const migratedCharacter = migrateCharacter(foundCharacter);
      setCharacter(migratedCharacter);
      // Salva il personaggio migrato
      if (JSON.stringify(migratedCharacter) !== JSON.stringify(foundCharacter)) {
        saveCharacter(migratedCharacter);
      }
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

  const handleBaseStatChange = (statId, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        baseStats: {
          ...prev.baseStats,
          [statId]: value
        },
        updatedAt: new Date().toISOString()
      };
      
      // Salva automaticamente per tutti i campi base
      saveCharacter(updatedCharacter);
      
      return updatedCharacter;
    });
  };



  const handleDamageTakenChange = (value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        damageTaken: value === '' ? '' : parseInt(value) || '',
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

  const addWeapon = () => {
    const newWeapon = {
      id: `weapon_${Date.now()}`,
      name: '',
      damageDice: '',
      damageType: '',
      ability: 'strength', // default a Forza
      isProficient: false
    };
    
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        weapons: [...(prev.weapons || []), newWeapon],
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
    
    // Metti la nuova arma in modalità editing
    setEditingWeapon(newWeapon.id);
  };

  const updateWeapon = (weaponId, field, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        weapons: prev.weapons.map(weapon => 
          weapon.id === weaponId ? { ...weapon, [field]: value } : weapon
        ),
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const removeWeapon = (weaponId) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        weapons: prev.weapons.filter(weapon => weapon.id !== weaponId),
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const addLanguage = () => {
    const newLanguage = {
      id: `language_${Date.now()}`,
      name: ''
    };
    
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        languages: [...(prev.languages || []), newLanguage],
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const updateLanguage = (languageId, value) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        languages: prev.languages.map(language => 
          language.id === languageId ? { ...language, name: value } : language
        ),
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  const removeLanguage = (languageId) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        languages: prev.languages.filter(language => language.id !== languageId),
        updatedAt: new Date().toISOString()
      };
      
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  // Funzione per calcolare la dimensione ottimale del font basata sulla lunghezza del testo
  const calculateOptimalFontSize = (text) => {
    if (!text || text.length === 0) return 'clamp(0.8rem, 4vw, 1rem)';
    
    const baseSize = 1; // rem
    const minSize = 0.7; // rem
    const textLength = text.length;
    
    // Scala basata sulla lunghezza del testo
    let scaleFactor = 1;
    if (textLength > 30) {
      scaleFactor = 0.7;
    } else if (textLength > 20) {
      scaleFactor = 0.8;
    } else if (textLength > 15) {
      scaleFactor = 0.9;
    }
    
    const calculatedSize = Math.max(baseSize * scaleFactor, minSize);
    
    // Usa clamp per responsiveness con i nuovi valori
    return `clamp(${calculatedSize * 0.7}rem, 4vw, ${calculatedSize}rem)`;
  };

  // Funzioni per gestire l'espansione del testo
  const toggleItemExpansion = (itemId, itemName) => {
    if (!itemName || itemName.length <= 15) return; // Non espandere testi corti
    
    const newExpandedItems = new Set(expandedItems);
    
    if (expandedItems.has(itemId)) {
      newExpandedItems.delete(itemId);
    } else {
      newExpandedItems.add(itemId);
    }
    
    setExpandedItems(newExpandedItems);
  };

  // Funzione per mostrare il tooltip inline mobile-friendly
  const showFullText = (itemId, itemName) => {
    if (itemName && itemName.length > 40) {
      setShowingTooltip(itemId);
      // Auto-hide dopo 3 secondi
      setTimeout(() => {
        setShowingTooltip(null);
      }, 3000);
    }
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

  const weaponDamageTypes = [
    { value: '', label: 'Seleziona tipo' },
    { value: 'slashing', label: 'Tagliente' },
    { value: 'piercing', label: 'Perforante' },
    { value: 'bludgeoning', label: 'Contundente' },
    { value: 'acid', label: 'Acido' },
    { value: 'cold', label: 'Freddo' },
    { value: 'fire', label: 'Fuoco' },
    { value: 'force', label: 'Forza' },
    { value: 'lightning', label: 'Fulmine' },
    { value: 'necrotic', label: 'Necrotico' },
    { value: 'poison', label: 'Veleno' },
    { value: 'psychic', label: 'Psichico' },
    { value: 'radiant', label: 'Radiante' },
    { value: 'thunder', label: 'Tuono' }
  ];

  const spellDamageTypes = [
    { value: '', label: 'Nessuno/Altro' },
    { value: 'acid', label: 'Acido' },
    { value: 'cold', label: 'Freddo' },
    { value: 'fire', label: 'Fuoco' },
    { value: 'force', label: 'Forza' },
    { value: 'lightning', label: 'Fulmine' },
    { value: 'necrotic', label: 'Necrotico' },
    { value: 'poison', label: 'Veleno' },
    { value: 'psychic', label: 'Psichico' },
    { value: 'radiant', label: 'Radiante' },
    { value: 'thunder', label: 'Tuono' },
    { value: 'bludgeoning', label: 'Contundente' },
    { value: 'piercing', label: 'Perforante' },
    { value: 'slashing', label: 'Tagliente' }
  ];

  // Dati delle valute D&D
  const currencyTypes = [
    { 
      key: 'platinum', 
      name: 'Platino', 
      abbreviation: 'PP', 
      icon: '⚪', 
      color: '#E5E7EB',
      value: 10 // rispetto all'oro
    },
    { 
      key: 'gold', 
      name: 'Oro', 
      abbreviation: 'GP', 
      icon: '🟡', 
      color: '#FCD34D',
      value: 1 // unità base
    },
    { 
      key: 'electrum', 
      name: 'Electrum', 
      abbreviation: 'EP', 
      icon: '🟠', 
      color: '#F59E0B',
      value: 0.5 // rispetto all'oro
    },
    { 
      key: 'silver', 
      name: 'Argento', 
      abbreviation: 'SP', 
      icon: '⚪', 
      color: '#9CA3AF',
      value: 0.1 // rispetto all'oro
    },
    { 
      key: 'copper', 
      name: 'Rame', 
      abbreviation: 'CP', 
      icon: '🟤', 
      color: '#92400E',
      value: 0.01 // rispetto all'oro
    }
  ];

  // Funzioni per gestire l'inventario
  const addInventoryItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      quantity: ''
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

  // Funzioni per gestire le valute
  const updateCurrency = (currencyType, value) => {
    // Se il valore è vuoto, mantienilo vuoto
    let processedValue = value;
    if (value === '') {
      processedValue = '';
    } else {
      const numericValue = parseInt(value) || 0;
      processedValue = Math.max(0, numericValue).toString(); // Previene valori negativi
    }
    
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        currency: {
          ...prev.currency,
          [currencyType]: processedValue
        },
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  // Calcola il valore totale in oro
  const calculateTotalGoldValue = () => {
    if (!character.currency) return 0;
    
    return currencyTypes.reduce((total, currency) => {
      const amountStr = character.currency[currency.key] || '';
      const amount = amountStr === '' ? 0 : parseInt(amountStr) || 0;
      return total + (amount * currency.value);
    }, 0);
  };

  // Funzioni per gestire gli incantesimi
  const addSpell = (specificLevel = null) => {
    const newSpell = {
      id: Date.now().toString(),
      name: '',
      description: '',
      hasSavingThrow: false,
      savingThrow: '',
      hasDamage: false,
      damage: '',
      damageType: '',
      level: specificLevel !== null ? specificLevel : '',
      isRitual: false,
      isPrepared: false
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
      // Applica i valori di default prima del salvataggio
      const processedSpell = {
        ...tempSpell,
        level: tempSpell.level === '' ? 1 : (parseInt(tempSpell.level) >= 0 ? parseInt(tempSpell.level) : 1)
      };
      
      setCharacter(prev => {
        const updatedCharacter = {
          ...prev,
          spells: [...(prev.spells || []), processedSpell],
          updatedAt: new Date().toISOString()
        };
        saveCharacter(updatedCharacter);
        return updatedCharacter;
      });
      
      // Pulisci lo stato temporaneo
      setTempSpell(null);
    } else {
      // È un incantesimo esistente in modifica, applica i valori di default
      setCharacter(prev => {
        const updatedCharacter = {
          ...prev,
          spells: prev.spells.map(spell => 
            spell.id === spellId 
              ? {
                  ...spell,
                  level: spell.level === '' ? 1 : (parseInt(spell.level) >= 0 ? parseInt(spell.level) : 1)
                }
              : spell
          ),
          updatedAt: new Date().toISOString()
        };
        saveCharacter(updatedCharacter);
        return updatedCharacter;
      });
    }
    
    setEditingSpell(null);
  };

  const openSpellEdit = (spellId) => {
    setEditingSpell(spellId);
    setViewingSpell(null); // Chiudi vista espansa se aperta
  };

  const openSpellView = (spellId) => {
    setViewingSpell(spellId);
    setEditingSpell(null); // Chiudi edit se aperto
  };

  const closeSpellView = () => {
    setViewingSpell(null);
  };

  const toggleSpellSection = (level) => {
    setOpenSpellSections(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const toggleSpellPrepared = (spellId, currentState) => {
    setCharacter(prev => {
      const updatedCharacter = {
        ...prev,
        spells: prev.spells.map(spell => 
          spell.id === spellId ? { ...spell, isPrepared: !currentState } : spell
        ),
        updatedAt: new Date().toISOString()
      };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
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
                onChange={(e) => handleFieldChange('level', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                className="inline-input"
                min="1"
                max="20"
                placeholder="1"
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

        {/* Statistiche di Combattimento */}
        <section className="stats-card">
          <h3 className="card-title">Statistiche di Combattimento</h3>
          
          {/* Classe Armatura - Centrata sopra il box HP */}
          <div className="armor-class-section">
            <div className="armor-class-stat">
              <span className="stat-label">Classe Armatura</span>
              <input
                type="number"
                value={character.baseStats?.armorClass || ''}
                onChange={(e) => handleBaseStatChange('armorClass', e.target.value)}
                className="stat-input-large"
                placeholder="10"
              />
            </div>
          </div>
          
          {/* HP e Danni - Sempre modificabili */}
          <div className="hp-section">
            <div className="hp-stat">
              <span className="stat-label">Punti Ferita</span>
              <input
                type="number"
                value={character.baseStats?.hitPoints || ''}
                onChange={(e) => handleBaseStatChange('hitPoints', e.target.value)}
                className="hp-input"
                placeholder="0"
                min="0"
              />
            </div>
            <div className="hp-stat">
              <span className="stat-label">HP Temporanei</span>
              <input
                type="number"
                value={character.baseStats?.tempHitPoints || ''}
                onChange={(e) => handleBaseStatChange('tempHitPoints', e.target.value)}
                className="hp-input"
                placeholder="0"
                min="0"
              />
            </div>
            <div className="hp-stat">
              <span className="stat-label">Velocità</span>
              <input
                type="text"
                value={character.baseStats?.speed || ''}
                onChange={(e) => handleBaseStatChange('speed', e.target.value)}
                className="hp-input"
                placeholder="9 metri"
              />
            </div>
            <div className="damage-stat">
              <span className="stat-label">Danni Subiti</span>
              <input
                type="number"
                value={character.damageTaken}
                onChange={(e) => handleDamageTakenChange(e.target.value)}
                className="damage-input"
                placeholder="0"
                min="0"
              />
            </div>

          </div>
          
          {/* HP Attuali Calcolati */}
          {(() => {
            const maxHP = parseInt(character.baseStats?.hitPoints) || 0;
            const tempHP = parseInt(character.baseStats?.tempHitPoints) || 0;
            const damageTaken = parseInt(character.damageTaken) || 0;
            
            // Calcola HP rimanenti con logica: prima si consumano gli HP temporanei
            let remainingTempHP = Math.max(0, tempHP - damageTaken);
            let remainingRegularHP = maxHP;
            
            if (damageTaken > tempHP) {
              // Se i danni superano gli HP temporanei, intacca quelli normali
              remainingRegularHP = Math.max(0, maxHP - (damageTaken - tempHP));
              remainingTempHP = 0;
            }
            
            const totalCurrentHP = remainingRegularHP + remainingTempHP;
            const totalMaxHP = maxHP + tempHP;
            
            if (maxHP > 0 || tempHP > 0) {
              return (
                <div className="current-hp">
                  <span className="current-hp-label">HP Attuali</span>
                  <span className={`current-hp-value ${totalCurrentHP <= totalMaxHP * 0.25 ? 'critical' : totalCurrentHP <= totalMaxHP * 0.5 ? 'low' : 'healthy'}`}>
                    {totalCurrentHP} / {totalMaxHP}
                    {tempHP > 0 && (
                      <span className="hp-breakdown">
                        {' '}({remainingRegularHP}
                        {remainingTempHP > 0 && ` + ${remainingTempHP} temp`})
                      </span>
                    )}
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </section>

        {/* Armi */}
        <section className="stats-card accordion-section">
          <div className="accordion-header" onClick={() => toggleSection('weapons')}>
            <h3 className="card-title">Armi</h3>
            <span className="accordion-icon">{openSections.weapons ? '▼' : '▶'}</span>
          </div>
          {openSections.weapons && (
            <div className="accordion-content">
              <div className="weapons-section">
                <div className="weapons-header">
                  <button className="add-weapon-button" onClick={addWeapon}>
                    + Aggiungi Arma
                  </button>
                </div>
                
                <div className="weapons-list">
                  {character.weapons && character.weapons.length > 0 ? (
                    character.weapons.map((weapon) => (
                      <div key={weapon.id} className="weapon-item">
                        {editingWeapon === weapon.id ? (
                          // Modalità editing (espansa)
                          <div className="weapon-edit-form">
                            <div className="weapon-name-section">
                              <input
                                type="text"
                                value={weapon.name}
                                onChange={(e) => updateWeapon(weapon.id, 'name', e.target.value)}
                                placeholder="Nome arma"
                                className="weapon-name-input"
                              />
                              <button 
                                className="weapon-save-button"
                                onClick={() => setEditingWeapon(null)}
                              >
                                ✓
                              </button>
                              <button 
                                className="remove-weapon-button"
                                onClick={() => removeWeapon(weapon.id)}
                              >
                                🗑️
                              </button>
                            </div>
                            
                            <div className="weapon-stats-section">
                              <div className="weapon-stat">
                                <label>Caratteristica:</label>
                                <select
                                  value={weapon.ability}
                                  onChange={(e) => updateWeapon(weapon.id, 'ability', e.target.value)}
                                  className="weapon-ability-select"
                                >
                                  <option value="strength">Forza</option>
                                  <option value="dexterity">Destrezza</option>
                                </select>
                              </div>
                              
                              <div className="weapon-stat">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={weapon.isProficient}
                                    onChange={(e) => updateWeapon(weapon.id, 'isProficient', e.target.checked)}
                                  />
                                  Competente
                                </label>
                              </div>
                              
                              <div className="weapon-stat">
                                <label>Dadi Danno:</label>
                                <input
                                  type="text"
                                  value={weapon.damageDice || weapon.damage?.split(' ')[0] || ''}
                                  onChange={(e) => updateWeapon(weapon.id, 'damageDice', e.target.value)}
                                  placeholder="es. 1d8"
                                  className="weapon-damage-input"
                                />
                              </div>
                              
                              <div className="weapon-stat">
                                <label>Tipo Danno:</label>
                                <select
                                  value={weapon.damageType || (weapon.damage?.includes(' ') ? weapon.damage.split(' ').slice(1).join(' ') : '')}
                                  onChange={(e) => updateWeapon(weapon.id, 'damageType', e.target.value)}
                                  className="weapon-damage-type-select"
                                >
                                  {weaponDamageTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Modalità visualizzazione (compatta)
                          <div className="weapon-compact-view" onClick={() => setEditingWeapon(weapon.id)}>
                            <div className="weapon-compact-header">
                              <span className="weapon-name">{weapon.name || 'Arma senza nome'}</span>
                              <div className="weapon-compact-actions">
                                <button 
                                  className="weapon-edit-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWeapon(weapon.id);
                                  }}
                                >
                                  ✏️
                                </button>
                                <button 
                                  className="remove-weapon-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeWeapon(weapon.id);
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                            <div className="weapon-compact-stats">
                              <span className="weapon-hit-calc">
                                Tiro: 1d20 {calculateWeaponHit(character, weapon)}
                              </span>
                              <span className="weapon-damage-display">
                                Danno: {(() => {
                                  // Usa i nuovi campi separati o fallback al vecchio formato
                                  const diceRoll = weapon.damageDice || weapon.damage?.split(' ')[0] || '';
                                  const damageType = weapon.damageType || 
                                    (weapon.damage?.includes(' ') ? weapon.damage.split(' ').slice(1).join(' ') : '');
                                  
                                  if (!diceRoll) return 'non specificato';
                                  
                                  // Calcola il modificatore
                                  const statValue = character.stats[weapon.ability] || 10;
                                  const abilityModifier = calculateModifier(statValue);
                                  const modifierStr = abilityModifier >= 0 ? `+${abilityModifier}` : `${abilityModifier}`;
                                  
                                  // Trova il label del tipo di danno
                                  const damageTypeLabel = weaponDamageTypes.find(type => type.value === damageType)?.label || damageType;
                                  
                                  return `${diceRoll} ${modifierStr}${damageTypeLabel ? ` ${damageTypeLabel.toLowerCase()}` : ''}`;
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-weapons-message">
                      Nessuna arma aggiunta. Clicca "Aggiungi Arma" per iniziare.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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

        {/* Lingue */}
        <section className="stats-card accordion-section">
          <div className="accordion-header" onClick={() => toggleSection('languages')}>
            <h3 className="card-title">Lingue</h3>
            <span className="accordion-icon">{openSections.languages ? '▼' : '▶'}</span>
          </div>
          {openSections.languages && (
            <div className="accordion-content">
              <div className="languages-section">
                <div className="languages-header">
                  <button className="add-language-button" onClick={addLanguage}>
                    + Aggiungi Lingua
                  </button>
                </div>
                
                <div className="languages-list">
                  {character.languages && character.languages.length > 0 ? (
                    character.languages.map((language) => (
                      <div key={language.id} className="language-item">
                        <input
                          type="text"
                          value={language.name}
                          onChange={(e) => updateLanguage(language.id, e.target.value)}
                          placeholder="Nome della lingua"
                          className="language-input"
                        />
                        <button 
                          className="remove-language-button"
                          onClick={() => removeLanguage(language.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-languages-message">
                      Nessuna lingua aggiunta. Clicca "Aggiungi Lingua" per iniziare.
                    </div>
                  )}
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
                  <div key={item.id}>
                    <div className="inventory-item">
                      <div className="item-quantity">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateInventoryItem(item.id, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                          className="quantity-input"
                          min="1"
                          max="999"
                          placeholder="1"
                        />
                      </div>
                      <div className="item-name">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)}
                          onClick={() => {
                            if (item.name && item.name.length > 40) {
                              showFullText(item.id, item.name);
                            } else {
                              toggleItemExpansion(item.id, item.name);
                            }
                          }}
                          className={`name-input ${expandedItems.has(item.id) ? 'expanded' : ''} ${item.name && item.name.length > 15 ? 'clickable' : ''}`}
                          placeholder="Nome oggetto"
                          title={item.name && item.name.length > 15 ? (item.name.length > 40 ? 'Clicca per vedere tutto' : 'Clicca per espandere') : ''}
                          style={{
                            fontSize: expandedItems.has(item.id) ? 'clamp(0.8rem, 4vw, 1rem)' : calculateOptimalFontSize(item.name || ''),
                            whiteSpace: expandedItems.has(item.id) ? 'normal' : 'nowrap',
                            overflow: expandedItems.has(item.id) ? 'visible' : 'hidden',
                            textOverflow: expandedItems.has(item.id) ? 'clip' : 'ellipsis',
                            height: expandedItems.has(item.id) ? 'auto' : '40px',
                            minHeight: '40px'
                          }}
                        />
                        {item.name && item.name.length > 15 && (
                          <div className="expand-indicator">
                            {item.name.length > 40 ? '👁️' : expandedItems.has(item.id) ? '▲' : '▼'}
                          </div>
                        )}
                      </div>
                      <button 
                        className="remove-item-button"
                        onClick={() => removeInventoryItem(item.id)}
                        title="Rimuovi oggetto"
                      >
                        🗑️
                      </button>
                    </div>
                    {showingTooltip === item.id && item.name && item.name.length > 40 && (
                      <div className="full-text-tooltip">
                        <div className="tooltip-content">
                          <strong>Nome completo:</strong><br />
                          {item.name}
                        </div>
                        <button 
                          className="close-tooltip-button"
                          onClick={() => setShowingTooltip(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
            
            {/* Sezione Valute - Accordion */}
            <div className="currency-accordion">
              <div className="currency-accordion-header" onClick={() => setCurrencyOpen(!currencyOpen)}>
                <h4 className="currency-accordion-title">
                  💰 Valute
                  <span className="currency-total-preview">
                    ({(() => {
                      const total = calculateTotalGoldValue();
                      return total > 0 ? `${total.toFixed(2)} GP` : '0 GP';
                    })()})
                  </span>
                </h4>
                <span className="currency-accordion-icon">{currencyOpen ? '▼' : '▶'}</span>
              </div>
              
              {currencyOpen && (
                <div className="currency-accordion-content">
                  <div className="currency-grid">
                    {currencyTypes.map((currency) => (
                      <div key={currency.key} className="currency-item">
                        <div className="currency-header">
                          <span 
                            className="currency-icon"
                            style={{ color: currency.color }}
                          >
                            {currency.icon}
                          </span>
                          <div className="currency-info">
                            <span className="currency-name">{currency.name}</span>
                            <span className="currency-abbr">({currency.abbreviation})</span>
                          </div>
                        </div>
                        <input
                          type="number"
                          value={character.currency?.[currency.key] || ''}
                          onChange={(e) => updateCurrency(currency.key, e.target.value)}
                          className="currency-input"
                          min="0"
                          max="999999"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Riepilogo valore totale */}
                  <div className="currency-total">
                    <span className="total-label">Valore totale:</span>
                    <span className="total-value">
                      {(() => {
                        const total = calculateTotalGoldValue();
                        return total > 0 ? `${total.toFixed(2)} GP` : '0 GP';
                      })()}
                    </span>
                  </div>
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
            
            {/* Tiro Salvezza Globale */}
            <div className="global-spell-save-dc">
              <div className="save-dc-container">
                <span className="save-dc-label">🎯 Tiro Salvezza Incantesimi:</span>
                <span className="save-dc-value">{calculateSpellSaveDC(character)}</span>
              </div>
              <div className="save-dc-formula">
                8 + bonus competenza + mod. caratteristica da incantatore
              </div>
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
                        value={tempSpell.level || ''}
                        onChange={(e) => updateSpell(editingSpell, 'level', e.target.value)}
                        className="spell-level-input"
                        min="0"
                        max="9"
                        placeholder="1"
                      />
                    </div>
                  </div>
                  
                  <div className="spell-details">
                    <div className="spell-optional-fields">
                      <div className="spell-option">
                        <label className="spell-checkbox-label">
                          <input
                            type="checkbox"
                            checked={tempSpell.hasSavingThrow || false}
                            onChange={(e) => updateSpell(editingSpell, 'hasSavingThrow', e.target.checked)}
                            className="spell-checkbox"
                          />
                          Ha Tiro Salvezza
                        </label>
                        {tempSpell.hasSavingThrow && (
                          <div className="spell-conditional-field">
                            <span className="spell-global-note">
                              (Usa valore globale: {calculateSpellSaveDC(character)})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="spell-option">
                        <label className="spell-checkbox-label">
                          <input
                            type="checkbox"
                            checked={tempSpell.hasDamage || false}
                            onChange={(e) => updateSpell(editingSpell, 'hasDamage', e.target.checked)}
                            className="spell-checkbox"
                          />
                          Ha Danni
                        </label>
                        {tempSpell.hasDamage && (
                          <div className="spell-conditional-field">
                            <div className="spell-damage-fields">
                              <input
                                type="text"
                                value={tempSpell.damage || ''}
                                onChange={(e) => updateSpell(editingSpell, 'damage', e.target.value)}
                                className="spell-detail-input"
                                placeholder="es. 1d6+3, 2d8"
                              />
                              <select
                                value={tempSpell.damageType || ''}
                                onChange={(e) => updateSpell(editingSpell, 'damageType', e.target.value)}
                                className="spell-damage-type-select"
                              >
                                {spellDamageTypes.map(type => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="spell-option">
                        <label className="spell-checkbox-label">
                          <input
                            type="checkbox"
                            checked={tempSpell.isRitual || false}
                            onChange={(e) => updateSpell(editingSpell, 'isRitual', e.target.checked)}
                            className="spell-checkbox"
                          />
                          Può essere lanciato come Rituale
                        </label>
                      </div>
                      
                      <div className="spell-option">
                        <label className="spell-checkbox-label">
                          <input
                            type="checkbox"
                            checked={tempSpell.isPrepared || false}
                            onChange={(e) => updateSpell(editingSpell, 'isPrepared', e.target.checked)}
                            className="spell-checkbox"
                          />
                          Incantesimo Preparato
                        </label>
                      </div>
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
                          </h4>
                          <div className="spell-level-actions">
                            <button 
                              className="add-level-spell-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addSpell(levelNum);
                              }}
                              title={`Aggiungi ${levelNum === 0 ? 'trucchetto' : `incantesimo di ${levelNum}° livello`}`}
                            >
                              +
                            </button>
                            <div className={`spell-level-arrow ${isOpen ? 'open' : ''}`}>
                              ▼
                            </div>
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
                                          value={spell.level || ''}
                                          onChange={(e) => updateSpell(spell.id, 'level', e.target.value)}
                                          className="spell-level-input"
                                          min="0"
                                          max="9"
                                          placeholder="1"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="spell-details">
                                      <div className="spell-optional-fields">
                                        <div className="spell-option">
                                          <label className="spell-checkbox-label">
                                            <input
                                              type="checkbox"
                                              checked={spell.hasSavingThrow || false}
                                              onChange={(e) => updateSpell(spell.id, 'hasSavingThrow', e.target.checked)}
                                              className="spell-checkbox"
                                            />
                                            Ha Tiro Salvezza
                                          </label>
                                          {spell.hasSavingThrow && (
                                            <div className="spell-conditional-field">
                                              <span className="spell-global-note">
                                                (Usa valore globale: {calculateSpellSaveDC(character)})
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="spell-option">
                                          <label className="spell-checkbox-label">
                                            <input
                                              type="checkbox"
                                              checked={spell.hasDamage || false}
                                              onChange={(e) => updateSpell(spell.id, 'hasDamage', e.target.checked)}
                                              className="spell-checkbox"
                                            />
                                            Ha Danni
                                          </label>
                                          {spell.hasDamage && (
                                            <div className="spell-conditional-field">
                                              <div className="spell-damage-fields">
                                                <input
                                                  type="text"
                                                  value={spell.damage || ''}
                                                  onChange={(e) => updateSpell(spell.id, 'damage', e.target.value)}
                                                  className="spell-detail-input"
                                                  placeholder="es. 1d6+3, 2d8"
                                                />
                                                <select
                                                  value={spell.damageType || ''}
                                                  onChange={(e) => updateSpell(spell.id, 'damageType', e.target.value)}
                                                  className="spell-damage-type-select"
                                                >
                                                  {spellDamageTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                      {type.label}
                                                    </option>
                                                  ))}
                                                </select>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="spell-option">
                                          <label className="spell-checkbox-label">
                                            <input
                                              type="checkbox"
                                              checked={spell.isRitual || false}
                                              onChange={(e) => updateSpell(spell.id, 'isRitual', e.target.checked)}
                                              className="spell-checkbox"
                                            />
                                            Può essere lanciato come Rituale
                                          </label>
                                        </div>
                                        
                                        <div className="spell-option">
                                          <label className="spell-checkbox-label">
                                            <input
                                              type="checkbox"
                                              checked={spell.isPrepared || false}
                                              onChange={(e) => updateSpell(spell.id, 'isPrepared', e.target.checked)}
                                              className="spell-checkbox"
                                            />
                                            Incantesimo Preparato
                                          </label>
                                        </div>
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
                                ) : viewingSpell === spell.id ? (
                                  // Vista espansa (solo lettura)
                                  <div className="spell-expanded" onClick={closeSpellView}>
                                    <div className="spell-expanded-header">
                                      <div className="spell-expanded-title">
                                        <h4 className="spell-expanded-name">{spell.name || 'Incantesimo Senza Nome'}</h4>
                                        <span className={`spell-level-badge ${spell.level === 0 ? 'cantrip' : ''}`}>
                                          {spell.level === 0 ? 'Trucchetto' : `Livello ${spell.level}`}
                                        </span>
                                      </div>
                                      <div className="spell-expanded-actions">
                                        <button 
                                          className="edit-spell-button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openSpellEdit(spell.id);
                                          }}
                                          title="Modifica incantesimo"
                                        >
                                          ✏️ Modifica
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="spell-expanded-content">
                                      <div className="spell-expanded-details">
                                        {spell.hasSavingThrow && (
                                          <div className="spell-expanded-detail">
                                            <span className="spell-detail-label">🎯 Tiro Salvezza:</span>
                                            <span className="spell-detail-value">CD {calculateSpellSaveDC(character)}</span>
                                          </div>
                                        )}
                                        {spell.hasDamage && spell.damage && (
                                          <div className="spell-expanded-detail">
                                            <span className="spell-detail-label">⚔️ Danni:</span>
                                            <span className="spell-detail-value">
                                              {spell.damage}
                                              {spell.damageType && spellDamageTypes.find(t => t.value === spell.damageType)?.label && 
                                                ` ${spellDamageTypes.find(t => t.value === spell.damageType).label.toLowerCase()}`
                                              }
                                            </span>
                                          </div>
                                        )}
                                        {spell.isRitual && (
                                          <div className="spell-expanded-detail">
                                            <span className="spell-detail-label">🕯️ Rituale:</span>
                                            <span className="spell-detail-value">Può essere lanciato come rituale</span>
                                          </div>
                                        )}
                                        <div className="spell-expanded-detail">
                                          <span className="spell-detail-label">📋 Preparato:</span>
                                          <span className="spell-detail-value">{spell.isPrepared ? 'Sì' : 'No'}</span>
                                        </div>
                                      </div>
                                      
                                      {spell.description && (
                                        <div className="spell-expanded-description">
                                          <h5 className="spell-description-title">Descrizione:</h5>
                                          <p className={`spell-description-text ${spell.description.length > 200 ? 'long-description' : ''}`}>
                                            {spell.description}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  // Vista compatta
                                  <div className={`spell-compact ${spell.isPrepared ? 'prepared' : 'unprepared'}`}>
                                    <div 
                                      className="spell-compact-main"
                                      onClick={() => openSpellView(spell.id)}
                                    >
                                      <div className="spell-compact-info">
                                        <div className="spell-compact-name">
                                          <span className="spell-name-text">{spell.name || 'Incantesimo Senza Nome'}</span>
                                        </div>
                                        <div className="spell-compact-details">
                                          {spell.hasDamage && spell.damage && (
                                            <span className="spell-detail-badge damage">
                                              ⚔️ {spell.damage}
                                              {spell.damageType && spellDamageTypes.find(t => t.value === spell.damageType)?.label && 
                                                ` ${spellDamageTypes.find(t => t.value === spell.damageType).label.toLowerCase()}`
                                              }
                                            </span>
                                          )}
                                          <div className="spell-mini-icons">
                                            {spell.hasSavingThrow && (
                                              <span className="spell-mini-icon saving-throw" title="Ha Tiro Salvezza">S</span>
                                            )}
                                            {spell.isRitual && (
                                              <span className="spell-mini-icon ritual" title="Può essere lanciato come Rituale">R</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="spell-prepared-toggle">
                                      <button 
                                        className={`prepared-toggle-btn ${spell.isPrepared ? 'prepared' : 'unprepared'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSpellPrepared(spell.id, spell.isPrepared);
                                        }}
                                        title={spell.isPrepared ? 'Rimuovi preparazione' : 'Prepara incantesimo'}
                                      >
                                        {spell.isPrepared ? '✓' : '○'}
                                      </button>
                                    </div>
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
      <nav className={`character-bottom-nav ${fullscreenNote ? 'hidden-fullscreen' : ''}`}>
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