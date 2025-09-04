// Utility per gestire il localStorage
const STORAGE_KEY = 'dnd_characters';

export const saveCharacters = (characters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    return true;
  } catch (error) {
    console.error('Errore nel salvare i personaggi:', error);
    return false;
  }
};

export const loadCharacters = () => {
  try {
    const characters = localStorage.getItem(STORAGE_KEY);
    return characters ? JSON.parse(characters) : [];
  } catch (error) {
    console.error('Errore nel caricare i personaggi:', error);
    return [];
  }
};

export const saveCharacter = (character) => {
  const characters = loadCharacters();
  const existingIndex = characters.findIndex(c => c.id === character.id);
  
  if (existingIndex >= 0) {
    characters[existingIndex] = { ...character, updatedAt: new Date().toISOString() };
  } else {
    characters.push(character);
  }
  
  return saveCharacters(characters);
};

export const deleteCharacter = (characterId) => {
  const characters = loadCharacters();
  const filteredCharacters = characters.filter(c => c.id !== characterId);
  return saveCharacters(filteredCharacters);
};