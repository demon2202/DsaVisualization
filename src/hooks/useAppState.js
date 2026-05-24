import { useReducer, useCallback, createContext, useContext, useRef } from 'react';

const initial = {
  activeStructure: 'bst',
  theme: 'dark',
  animationSpeed: 800,
  isAnimating: false,
  isPaused: false,
  operationStatus: { type: 'idle', message: '', detail: '' },
  operationHistory: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STRUCTURE':
      return {
        ...state,
        activeStructure: action.payload,
        operationStatus: { type: 'idle', message: '', detail: '' },
        isAnimating: false,
        isPaused: false,
      };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'SET_SPEED':
      return { ...state, animationSpeed: action.payload };
    case 'SET_ANIMATING':
      return { ...state, isAnimating: action.payload };
    case 'SET_PAUSED':
      return { ...state, isPaused: action.payload };
    case 'SET_STATUS':
      return { ...state, operationStatus: action.payload };
    case 'ADD_HISTORY':
      return {
        ...state,
        operationHistory: [
          { ...action.payload, timestamp: Date.now() },
          ...state.operationHistory,
        ].slice(0, 25),
      };
    case 'CLEAR_HISTORY':
      return { ...state, operationHistory: [] };
    default:
      return state;
  }
}

export const AppContext = createContext(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppContext.Provider');
  return ctx;
}

export default function useAppState() {
  const [state, dispatch] = useReducer(reducer, initial);

  // Stable dispatch wrappers — these never change identity
  const setStructure  = useCallback((s) => dispatch({ type: 'SET_STRUCTURE',  payload: s }), []);
  const toggleTheme   = useCallback(()  => dispatch({ type: 'TOGGLE_THEME' }),                []);
  const setSpeed      = useCallback((s) => dispatch({ type: 'SET_SPEED',      payload: s }), []);
  const setAnimating  = useCallback((v) => dispatch({ type: 'SET_ANIMATING',  payload: v }), []);
  const setPaused     = useCallback((v) => dispatch({ type: 'SET_PAUSED',     payload: v }), []);
  const setStatus     = useCallback((s) => dispatch({ type: 'SET_STATUS',     payload: s }), []);
  const addHistory    = useCallback((h) => dispatch({ type: 'ADD_HISTORY',    payload: h }), []);
  const clearHistory  = useCallback(()  => dispatch({ type: 'CLEAR_HISTORY' }),               []);

  return {
    state,
    setStructure, toggleTheme, setSpeed,
    setAnimating, setPaused, setStatus,
    addHistory, clearHistory,
  };
}