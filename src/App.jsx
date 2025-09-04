import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { loadCharacters, saveCharacter, deleteCharacter } from './utils/storage';
import { createEmptyCharacter } from './types/character';
import CharacterForm from './components/CharacterForm';
import CharacterView from './components/CharacterView';
import './App.css';

// Componente per la lista personaggi
function CharacterList() {
  const [characters, setCharacters] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setCharacters(loadCharacters());
  }, []);

  const handleCreateCharacter = () => {
    navigate('/character/new');
  };

  const [deletingCharacter, setDeletingCharacter] = useState(null);
  const [pressTimer, setPressTimer] = useState(null);

  const handleDeleteStart = (characterId, event) => {
    event.stopPropagation();
    setDeletingCharacter(characterId);
    
    const timer = setTimeout(() => {
      deleteCharacter(characterId);
      setCharacters(loadCharacters());
      setDeletingCharacter(null);
    }, 2000);
    
    setPressTimer(timer);
  };

  const handleDeleteEnd = (event) => {
    event.stopPropagation();
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setDeletingCharacter(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">D&D</h1>
        <div className="header-icon">👤</div>
      </header>

      <main className="main-content">
        <section className="characters-section">
          <h2 className="section-title">I Miei Personaggi</h2>
          <div className="characters-list">
            {characters.length === 0 ? (
              <div className="empty-state">
                <p>Nessun personaggio creato</p>
              </div>
            ) : (
              characters.map(character => (
                <div 
                  key={character.id} 
                  className="character-card"
                  onClick={() => navigate(`/character/${character.id}`)}
                >
                  <div className="character-avatar">
                    <div className="avatar-placeholder">⚔️</div>
                  </div>
                  <div className="character-info">
                    <h3 className="character-name">{character.name || 'Personaggio Senza Nome'}</h3>
                    <p className="character-details">
                      Livello {character.level} • {character.race} {character.class}
                    </p>
                  </div>
                  <div className="character-actions">
                    <button 
                      className={`delete-button ${deletingCharacter === character.id ? 'deleting' : ''}`}
                      onMouseDown={(e) => handleDeleteStart(character.id, e)}
                      onMouseUp={handleDeleteEnd}
                      onMouseLeave={handleDeleteEnd}
                      onTouchStart={(e) => handleDeleteStart(character.id, e)}
                      onTouchEnd={handleDeleteEnd}
                      onTouchCancel={handleDeleteEnd}
                    >
                      {deletingCharacter === character.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="create-section">
          <h2 className="section-title">Crea Nuovo Personaggio</h2>
          <button className="create-button" onClick={handleCreateCharacter}>
            <div className="create-icon">+</div>
            <span>Crea Nuovo Personaggio</span>
          </button>
        </section>
      </main>

    </div>
  );
}

// Componente per la gestione personaggio
function CharacterManager() {
  return <CharacterForm />;
}

// Componente per la visualizzazione personaggio
function CharacterDisplay() {
  return <CharacterView />;
}

// Componente principale
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CharacterList />} />
        <Route path="/character/new" element={<CharacterManager />} />
        <Route path="/character/:id" element={<CharacterDisplay />} />
        <Route path="/character/:id/edit" element={<CharacterManager />} />
        <Route path="/campaigns" element={<div>Campagne (da implementare)</div>} />
        <Route path="/settings" element={<div>Impostazioni (da implementare)</div>} />
      </Routes>
    </Router>
  );
}

export default App;