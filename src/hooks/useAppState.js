import { useReducer, useCallback, createContext, useContext } from 'react';

const initialState = {
  activeStructure: 'bst',
  theme: 'dark',
  animationSpeed: 1500,
  isAnimating: false,
  isPaused: false,
  operationStatus: { type: 'idle', message: '', detail: '' },
  operationHistory: [],
  showReference: true,
  stepMode: false,
};

function appReducer(state, action) {
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
        ].slice(0, 30),
      };
    case 'CLEAR_HISTORY':
      return { ...state, operationHistory: [] };
    case 'TOGGLE_REFERENCE':
      return { ...state, showReference: !state.showReference };
    case 'TOGGLE_STEP_MODE':
      return { ...state, stepMode: !state.stepMode };
    default:
      return state;
  }
}

export const AppContext = createContext(null);

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext.Provider');
  return ctx;
}

export default function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return {
    state,
    setStructure: useCallback((s) => dispatch({ type: 'SET_STRUCTURE', payload: s }), []),
    toggleTheme: useCallback(() => dispatch({ type: 'TOGGLE_THEME' }), []),
    setSpeed: useCallback((s) => dispatch({ type: 'SET_SPEED', payload: s }), []),
    setAnimating: useCallback((v) => dispatch({ type: 'SET_ANIMATING', payload: v }), []),
    setPaused: useCallback((v) => dispatch({ type: 'SET_PAUSED', payload: v }), []),
    setStatus: useCallback((s) => dispatch({ type: 'SET_STATUS', payload: s }), []),
    addHistory: useCallback((h) => dispatch({ type: 'ADD_HISTORY', payload: h }), []),
    clearHistory: useCallback(() => dispatch({ type: 'CLEAR_HISTORY' }), []),
    toggleReference: useCallback(() => dispatch({ type: 'TOGGLE_REFERENCE' }), []),
    toggleStepMode: useCallback(() => dispatch({ type: 'TOGGLE_STEP_MODE' }), []),
  };
}