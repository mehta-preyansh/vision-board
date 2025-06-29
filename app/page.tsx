"use client"
import { useState, useCallback, useRef, useEffect, createContext, useContext, useReducer } from 'react';
import { FiMousePointer, FiType, FiImage, FiRotateCcw, FiSun, FiMoon, FiMenu, FiX, FiCopy, FiTrash2, FiChevronDown, FiUpload, FiInfo, FiTool, FiTrendingUp, FiStar, FiSmartphone, FiRotateCw, FiZap, FiSettings, FiMove } from 'react-icons/fi';
import { FaPalette } from 'react-icons/fa';
import Head from 'next/head';

// =============================================
// CUSTOM SCROLLBAR STYLES
// =============================================
const customScrollbarStyles = `
  /* Custom Scrollbar Styles */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #8b5cf6, #ec4899, #06b6d4);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #7c3aed, #db2777, #0891b2);
    box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }

  ::-webkit-scrollbar-button {
    display: none;
  }

  /* Firefox Scrollbar */
  * {
    scrollbar-width: thin;
    scrollbar-color: #8b5cf6 transparent;
  }

  /* Custom scrollbar for dropdown specifically */
  .custom-dropdown-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .custom-dropdown-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-dropdown-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    border-radius: 6px;
  }

  .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #7c3aed, #db2777);
  }

  .custom-dropdown-scroll::-webkit-scrollbar-button {
    display: none;
  }

  .custom-dropdown-scroll::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

// =============================================
// TYPES & INTERFACES
// =============================================
interface Element {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  borderRadius: {
    topLeft: number
    topRight: number
    bottomLeft: number
    bottomRight: number
  }
  borderWidth: number
  borderColor: string
  borderStyle: 'solid' | 'dashed' | 'dotted'
}

export interface TextElement extends Element {
  type: 'text'
  content: string
  color: string
  fontSize: number
  fontFamily: string
  backgroundColor: string
  autoHeight?: boolean
}

export interface ImageElement extends Element {
  type: 'image'
  url: string
}

export type ToolType = 'select' | 'text' | 'image'
export type ThemeType = 'light' | 'dark'

interface GlobalState {
  elements: (TextElement | ImageElement)[]
  selectedElement: (TextElement | ImageElement) | null
  tool: ToolType
  isElementDragging: boolean
  theme: ThemeType
  isPanelOpen: boolean
  isHelpModalOpen: boolean
}

interface GlobalContextType {
  state: GlobalState
  dispatch: React.Dispatch<any>
  actions: ReturnType<typeof createActions>
}

const initialState: GlobalState = {
  elements: [],
  selectedElement: null,
  tool: 'select',
  isElementDragging: false,
  theme: 'light',
  isPanelOpen: false,
  isHelpModalOpen: false
}

const GlobalStateContext = createContext<GlobalContextType | null>(null)

export enum actionTypes {
  ADD_ELEMENT = 'ADD_ELEMENT',
  DELETE_ELEMENT = 'DELETE_ELEMENT',
  UPDATE_ELEMENT = 'UPDATE_ELEMENT',
  SELECT_ELEMENT = 'SELECT_ELEMENT',
  SET_TOOL = 'SET_TOOL',
  START_ELEMENT_DRAG = 'START_ELEMENT_DRAG',
  STOP_ELEMENT_DRAG = 'STOP_ELEMENT_DRAG',
  CLEAR_CANVAS = 'CLEAR_CANVAS',
  TOGGLE_THEME = 'TOGGLE_THEME',
  TOGGLE_HELP_MODAL = 'TOGGLE_HELP_MODAL',
}

const reducer = (state: GlobalState, action: { type: actionTypes, payload?: any }) => {
  switch (action.type) {
    case actionTypes.ADD_ELEMENT:
      return {
        ...state,
        elements: [...state.elements, action.payload],
        // Show panel when adding new element
        isPanelOpen: true
      }

    case actionTypes.DELETE_ELEMENT:
      return {
        ...state,
        elements: state.elements.filter(el => el.id !== action.payload.id),
        selectedElement: null,
        // Hide panel when deleting element
        isPanelOpen: false
      }

    case actionTypes.UPDATE_ELEMENT:
      const updatedElements = state.elements.map(el =>
        el.id === action.payload.id
          ? { ...el, ...action.payload.updates }
          : el
      )

      // Update selectedElement if it's the element being updated
      const updatedSelectedElement = state.selectedElement?.id === action.payload.id
        ? updatedElements.find(el => el.id === action.payload.id) || null
        : state.selectedElement

      return {
        ...state,
        elements: updatedElements,
        selectedElement: updatedSelectedElement
      }

    case actionTypes.SELECT_ELEMENT:
      return {
        ...state,
        selectedElement: action.payload,
      }

    case actionTypes.SET_TOOL:
      return { ...state, tool: action.payload }

    // Element drag actions - hide panel when dragging starts
    case actionTypes.START_ELEMENT_DRAG:
      return {
        ...state,
        isElementDragging: true,
        isPanelOpen: false
      }

    // Show panel when dragging stops (if element is selected)
    case actionTypes.STOP_ELEMENT_DRAG:
      return {
        ...state,
        isElementDragging: false,
        isPanelOpen: !!state.selectedElement
      }

    case actionTypes.CLEAR_CANVAS:
      return {
        ...state,
        elements: [],
        selectedElement: null,
        isPanelOpen: false
      }

    case actionTypes.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'light' ? 'dark' as ThemeType : 'light' as ThemeType }

    case actionTypes.TOGGLE_HELP_MODAL:
      return { ...state, isHelpModalOpen: !state.isHelpModalOpen }

    default:
      return state
  }
}

const createActions = (dispatch: React.Dispatch<any>) => ({
  startElementDrag: () => dispatch({ type: actionTypes.START_ELEMENT_DRAG }),
  stopElementDrag: () => dispatch({ type: actionTypes.STOP_ELEMENT_DRAG }),
  addElement: (element: TextElement | ImageElement) => dispatch({ type: actionTypes.ADD_ELEMENT, payload: element }),
  deleteElement: (id: string) => dispatch({ type: actionTypes.DELETE_ELEMENT, payload: { id } }),
  updateElement: (id: string, updates: Partial<TextElement | ImageElement>) => dispatch({ type: actionTypes.UPDATE_ELEMENT, payload: { id, updates } }),
  selectElement: (element: TextElement | ImageElement | null) => dispatch({ type: actionTypes.SELECT_ELEMENT, payload: element }),
  setTool: (tool: ToolType) => dispatch({ type: actionTypes.SET_TOOL, payload: tool }),
  setSelectedElement: (element: TextElement | ImageElement) => dispatch({ type: actionTypes.SELECT_ELEMENT, payload: element }),
  clearCanvas: () => dispatch({ type: actionTypes.CLEAR_CANVAS }),
  toggleTheme: () => dispatch({ type: actionTypes.TOGGLE_THEME }),
  toggleHelpModal: () => dispatch({ type: actionTypes.TOGGLE_HELP_MODAL }),
})

// =============================================
// GLOBAL STATE MANAGEMENT
// =============================================

/**
 * GlobalStateProvider Component
 * Provides global state context to the entire application
 */
const GlobalStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const actions = createActions(dispatch)

  return (
    <GlobalStateContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

/**
 * useGlobalState Hook
 * Custom hook to access global state and actions
 * Must be used within GlobalStateProvider
 */
const useGlobalState = () => {
  const context = useContext(GlobalStateContext)
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider')
  }
  return context
}



// =============================================
// THEME CONFIGURATION
// =============================================

/**
 * Global theme colors and design tokens
 * Separated for light and dark themes
 */
const LIGHT_THEME_COLORS = {
  primary: {
    gradient: 'from-violet-600 via-fuchsia-500 to-pink-500',
    solid: '#8b5cf6',
    light: '#c4b5fd',
    dark: '#5b21b6'
  },
  secondary: {
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    solid: '#06b6d4',
    light: '#67e8f9',
    dark: '#0891b2'
  },
  accent: {
    gradient: 'from-orange-400 via-pink-500 to-red-500',
    solid: '#fb923c',
    light: '#fed7aa',
    dark: '#ea580c'
  },
  success: {
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    solid: '#10b981',
    light: '#6ee7b7',
    dark: '#047857'
  },
  warning: {
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    solid: '#f59e0b',
    light: '#fde68a',
    dark: '#d97706'
  },
  background: {
    main: 'from-indigo-100 via-purple-50 to-pink-100',
    glass: 'bg-white/20 backdrop-blur-xl border border-white/30',
    card: 'bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-lg border border-white/40',
    page: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100',
    solid: 'bg-white'
  },
  text: {
    primary: 'text-gray-800',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    inverse: 'text-white'
  },
  border: {
    primary: 'border-white/30',
    secondary: 'border-gray-200/50',
    muted: 'border-gray-300/50'
  },
  hover: {
    background: 'hover:bg-white/50',
    text: 'hover:text-gray-900'
  },
  dropdown: {
    border: 'border-purple-200',
    focusRing: 'focus:ring-purple-500',
    focusBorder: 'focus:border-purple-500',
    optionText: 'text-gray-700',
    optionHover: 'hover:bg-purple-50 hover:text-purple-700',
    optionSelected: 'bg-purple-100 text-purple-800',
    optionBorder: 'border-purple-100'
  }
};

const DARK_THEME_COLORS = {
  primary: {
    gradient: 'from-violet-500 via-fuchsia-400 to-pink-400',
    solid: '#a855f7',
    light: '#d8b4fe',
    dark: '#7c3aed'
  },
  secondary: {
    gradient: 'from-cyan-300 via-blue-400 to-purple-500',
    solid: '#22d3ee',
    light: '#7dd3fc',
    dark: '#0e7490'
  },
  accent: {
    gradient: 'from-orange-300 via-pink-400 to-red-400',
    solid: '#fb7185',
    light: '#fda4af',
    dark: '#be123c'
  },
  success: {
    gradient: 'from-emerald-300 via-teal-400 to-cyan-500',
    solid: '#34d399',
    light: '#6ee7b7',
    dark: '#059669'
  },
  warning: {
    gradient: 'from-yellow-300 via-orange-400 to-red-400',
    solid: '#fbbf24',
    light: '#fcd34d',
    dark: '#d97706'
  },
  background: {
    main: 'from-slate-900 via-gray-900 to-zinc-900',
    glass: 'bg-gray-900/60 backdrop-blur-xl border border-gray-700/50',
    card: 'bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-lg border border-gray-700/40',
    page: 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900',
    solid: 'bg-gray-800'
  },
  text: {
    primary: 'text-gray-200',
    secondary: 'text-gray-400',
    muted: 'text-gray-500',
    inverse: 'text-gray-900'
  },
  border: {
    primary: 'border-gray-700/30',
    secondary: 'border-gray-700/50',
    muted: 'border-gray-600/50'
  },
  hover: {
    background: 'hover:bg-gray-700/50',
    text: 'hover:text-white'
  },
  dropdown: {
    border: 'border-purple-500',
    focusRing: 'focus:ring-purple-400',
    focusBorder: 'focus:border-purple-400',
    optionText: 'text-gray-300',
    optionHover: 'hover:bg-purple-900/30 hover:text-purple-300',
    optionSelected: 'bg-purple-800/60 text-purple-200',
    optionBorder: 'border-purple-200'
  }
};

/**
 * Hook to get theme-aware colors
 */
const useThemeColors = () => {
  const { state: { theme } } = useGlobalState();
  return theme === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;
};

// =============================================
// UI COMPONENTS
// =============================================

/**
 * ToolButtons Component
 * Renders the main toolbar with select, text, image tools and utilities
 * Features responsive design: icons-only on small screens, icons+text on large screens
 */
interface ToolButtonsProps {
  className?: string;
}

function ToolButtons({ className = "" }: ToolButtonsProps) {
  const { state, actions } = useGlobalState();
  const { tool, elements, theme } = state;
  const { setTool, clearCanvas, toggleTheme, toggleHelpModal } = actions;
  const themeColors = useThemeColors();

  const handleClearCanvas = () => {
    if (elements.length === 0) return;
    clearCanvas();
  };

  return (
    <div className={`flex items-center ${className} lg:gap-x-4 gap-x-1`}>
      <button
        onClick={() => setTool('select')}
        className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 justify-center lg:justify-start ${tool === 'select'
          ? `bg-gradient-to-r ${themeColors.primary.gradient} text-white shadow-xl scale-105`
          : `${themeColors.hover.background} ${themeColors.text.primary} ${themeColors.hover.text}`
          } cursor-pointer`}
        title="Select Tool"
      >
        <FiMousePointer size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        <span className="text-xs lg:text-sm font-bold hidden lg:inline">Select</span>
      </button>
      <button
        onClick={() => setTool('text')}
        className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 justify-center lg:justify-start ${tool === 'text'
          ? `bg-gradient-to-r ${themeColors.secondary.gradient} text-white shadow-xl scale-105`
          : `${themeColors.hover.background} ${themeColors.text.primary} ${themeColors.hover.text}`
          } cursor-pointer`}
        title="Text Tool"
      >
        <FiType size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        <span className="text-xs lg:text-sm font-bold hidden lg:inline">Text</span>
      </button>
      <button
        onClick={() => setTool('image')}
        className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 justify-center lg:justify-start ${tool === 'image'
          ? `bg-gradient-to-r ${themeColors.success.gradient} text-white shadow-xl scale-105`
          : `${themeColors.hover.background} ${themeColors.text.primary} ${themeColors.hover.text}`
          } cursor-pointer`}
        title="Image Tool"
      >
        <FiImage size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        <span className="text-xs lg:text-sm font-bold hidden lg:inline">Image</span>
      </button>

      {/* Separator */}
      <div className={`hidden md:block w-px h-8 ${themeColors.border.muted} mx-2`}></div>

      {/* Reset button */}
      <button
        onClick={handleClearCanvas}
        disabled={elements.length === 0}
        className={`p-2 rounded-lg md:rounded-xl transition-all duration-300 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 justify-center lg:justify-start ${elements.length === 0
          ? `opacity-50 cursor-not-allowed ${themeColors.text.muted}`
          : `${theme === 'light' ? 'hover:bg-red-50' : 'hover:bg-red-900/30'} text-red-600 hover:text-red-700 hover:shadow-lg cursor-pointer`
          }`}
        title={elements.length === 0 ? "Canvas is already empty" : "Clear Canvas"}
      >
        <FiRotateCcw size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        <span className="text-xs lg:text-sm font-bold hidden lg:inline">Clear</span>
      </button>

      {/* Separator */}
      <div className={`hidden md:block w-px h-8 ${themeColors.border.muted} mx-2`}></div>

      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 justify-center lg:justify-start hover:bg-gradient-to-r ${themeColors.warning.gradient} hover:text-white ${themeColors.text.primary} hover:shadow-lg cursor-pointer`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? (
          <FiMoon size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        ) : (
          <FiSun size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        )}
        <span className="text-xs lg:text-sm font-bold hidden lg:inline">
          {theme === 'light' ? 'Dark' : 'Light'}
        </span>
      </button>

      {/* Help button */}
      <button
        onClick={toggleHelpModal}
        className={`p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-200 flex items-center space-x-1 md:space-x-2 transform hover:scale-105 justify-center lg:justify-start ${themeColors.text.primary} ${theme === 'light' ? 'hover:text-blue-600 hover:bg-blue-50' : 'hover:text-blue-400 hover:bg-blue-900/30'} hover:shadow-lg hover:border-blue-200 cursor-pointer`}
        title="Getting Started Guide"
      >
        <FiInfo size={18} className="md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px]" />
        <span className="text-xs lg:text-sm font-bold hidden lg:inline">Help</span>
      </button>
    </div>
  );
}

/**
 * CustomDropdown Component
 * Reusable dropdown component for properties panel
 * Supports custom rendering and consistent styling
 */
interface CustomDropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  isMobile?: boolean;
  placeholder?: string;
  renderOption?: (option: string) => React.ReactNode;
  renderValue?: (value: string) => React.ReactNode;
  className?: string;
}

function CustomDropdown({
  value,
  options,
  onChange,
  isMobile = false,
  placeholder = "Select...",
  renderOption,
  renderValue,
  className = ""
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeColors = useThemeColors();
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const displayValue = renderValue ? renderValue(value) : value;

  return (
    <div ref={dropdownRef} className={`relative ${isOpen ? 'z-[60]' : 'z-10'} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`outline-none w-full p-4 pr-6 border-1 border-purple-200 rounded-xl ${themeColors.dropdown.focusRing} ${themeColors.dropdown.focusBorder} transition-all duration-200 ${themeColors.background.glass} backdrop-blur-sm font-bold ${themeColors.text.primary} shadow-sm flex items-center justify-between cursor-pointer`}
      >
        <span className="truncate">
          {value ? displayValue : placeholder}
        </span>
        <FiChevronDown
          size={16}
          className={`transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute ${isMobile ? 'bottom-full' : 'top-full'} left-0 right-0 ${isMobile ? 'mb-2' : 'mt-2'} z-[70]`}>
          <div className={`${themeColors.background.solid} rounded-xl shadow-2xl p-2`}>
            <div className="max-h-60 overflow-y-auto custom-dropdown-scroll">
              {options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full p-4 text-left font-medium transition-all duration-200 ${themeColors.dropdown.optionHover} border-b ${themeColors.dropdown.optionBorder} last:border-b-0 ${value === option
                    ? `${themeColors.dropdown.optionSelected} font-bold`
                    : themeColors.dropdown.optionText
                    } ${index === 0 ? 'rounded-t-xl' : ''
                    } ${index === options.length - 1 ? 'rounded-b-xl' : ''
                    } cursor-pointer`}
                  style={renderOption && option === value ? { fontFamily: option } : undefined}
                >
                  {renderOption ? renderOption(option) : option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * NumberInput Component
 * Reusable number input component with consistent styling
 * Uses element state for rendering and updating values
 */
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  className = "",
  disabled = false
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(Math.round(value).toString());
  const [isFocused, setIsFocused] = useState(false);
  const { state } = useGlobalState();
  const { isPanelOpen } = state;
  const themeColors = useThemeColors();

  // Update input value when prop value changes (from external updates)
  useEffect(() => {
    console.log("label: ", label, "disabled: ", disabled);
    if (!isFocused && isPanelOpen) {
      setInputValue(Math.round(value).toString());
    }
  }, [value, isFocused]);

  const applyConstraintsAndUpdate = (rawValue: string) => {
    const numValue = Number(rawValue);

    // Handle empty or invalid input
    if (rawValue === '' || isNaN(numValue)) {
      setInputValue(Math.round(value).toString());
      return;
    }

    // Apply min/max constraints
    let constrainedValue = numValue;
    if (min !== undefined) constrainedValue = Math.max(min, constrainedValue);
    if (max !== undefined) constrainedValue = Math.min(max, constrainedValue);

    // Update the input display and parent state
    setInputValue(Math.round(constrainedValue).toString());
    onChange(constrainedValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow user to type freely while focused
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyConstraintsAndUpdate(inputValue);
      e.currentTarget.blur(); // Remove focus after applying constraints
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    applyConstraintsAndUpdate(inputValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={className}>
      <label className={`text-xs ${themeColors.text.secondary} mb-2 block font-bold`}>{label}</label>
      {disabled ? (
        <div className="relative w-full">
          <div className={`w-full p-3 border-2 border-gray-200 rounded-xl text-sm font-bold ${themeColors.text.muted} bg-gray-100 opacity-70 shadow-sm cursor-not-allowed select-none flex items-center justify-between`} title="Disabled for text elements">
            {value} <span className="ml-1 text-xs">px</span>
          </div>
          <div className="absolute inset-0 rounded-xl pointer-events-none" />
        </div>
      ) : (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={inputValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`outline-none w-full p-3 border-1 ${themeColors.dropdown.border} rounded-xl text-sm ${themeColors.dropdown.focusRing} ${themeColors.dropdown.focusBorder} transition-all duration-200 ${themeColors.background.glass} backdrop-blur-sm font-bold ${themeColors.dropdown.optionText} shadow-sm`}
        />
      )}
    </div>
  );
}

/**
 * ColorPicker Component
 * Reusable color picker with hex input and preset colors
 * Supports transparent option for background colors
 */
interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  colors: string[];
  showTransparent?: boolean;
  className?: string;
}

/**
 * MobileColorPicker Component
 * Compact horizontal color picker for mobile panel
 */
interface MobileColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  colors: string[];
  showTransparent?: boolean;
}

function ColorPicker({
  label,
  value,
  onChange,
  colors,
  showTransparent = false,
  className = ""
}: ColorPickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempHexValue, setTempHexValue] = useState('');
  const [hexInputError, setHexInputError] = useState('');
  const themeColors = useThemeColors();

  // Get display value for the input
  const getDisplayValue = () => {
    if (isEditing) {
      return tempHexValue;
    }
    if (value === 'transparent') {
      return 'transparent';
    }
    return value;
  };

  // Hex color validation function
  const isValidHex = (hex: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(hex);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setTempHexValue(value === 'transparent' ? '' : value);
    setHexInputError('');
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    applyHexChange(tempHexValue);
  };

  const handleInputChange = (inputValue: string) => {
    setTempHexValue(inputValue);
    setHexInputError('');
  };

  const applyHexChange = (inputValue: string) => {
    if (inputValue === '' || inputValue === 'transparent') {
      return; // Don't change if empty or transparent
    }

    // Add # if not present
    const hexValue = inputValue.startsWith('#') ? inputValue : `#${inputValue}`;

    if (isValidHex(hexValue)) {
      onChange(hexValue);
      setHexInputError('');
    } else {
      setHexInputError('Invalid hex color code');
    }
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsEditing(false);
    setTempHexValue('');
    setHexInputError('');
  };

  return (
    <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg ${className}`}>
      <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
        <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.primary.gradient} rounded-full`}></span>
        <span>{label}</span>
      </label>

      {/* Hex Color Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="#8b5cf6 or transparent"
          value={getDisplayValue()}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`w-full p-3 border-1 ${hexInputError ? 'border-red-400 focus:ring-red-500' : `${themeColors.dropdown.border} ${themeColors.dropdown.focusRing}`} rounded-xl focus:ring-1 ${hexInputError ? '' : themeColors.dropdown.focusBorder} transition-all duration-200 ${themeColors.background.glass} backdrop-blur-sm font-medium ${themeColors.dropdown.optionText} shadow-sm outline-none`}
        />
        {hexInputError && (
          <p className="text-red-500 text-xs mt-2 font-semibold">{hexInputError}</p>
        )}
      </div>

      {/* Preset Colors */}
      <div className="grid grid-cols-5 gap-4">
        {/* Transparent option for background colors */}
        {showTransparent && (
          <button
            onClick={() => handleColorSelect('transparent')}
            className={`w-14 h-14 rounded-2xl border-4 transition-all duration-300 hover:scale-110 bg-white relative overflow-hidden shadow-lg hover:shadow-xl ${value === 'transparent'
              ? 'border-gray-800 shadow-2xl transform scale-110 ring-4 ring-white'
              : 'border-white hover:border-gray-300'
              } cursor-pointer`}
            title="Transparent"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-80 transform rotate-45 translate-y-6"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-80 transform -rotate-45 translate-y-6"></div>
          </button>
        )}

        {/* Color options */}
        {colors.map(color => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className={`w-14 h-14 rounded-2xl border-4 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl ${value === color
              ? 'border-gray-800 shadow-2xl transform scale-110 ring-4 ring-white'
              : 'border-white hover:border-gray-300'
              } cursor-pointer`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

function MobileColorPicker({
  label,
  value,
  onChange,
  colors,
  showTransparent = false
}: MobileColorPickerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempHexValue, setTempHexValue] = useState('');
  const themeColors = useThemeColors();

  // Get display value for the input
  const getDisplayValue = () => {
    if (isEditing) {
      return tempHexValue;
    }
    if (value === 'transparent') {
      return 'transparent';
    }
    return value;
  };

  // Hex color validation function
  const isValidHex = (hex: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(hex);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setTempHexValue(value === 'transparent' ? '' : value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    applyHexChange(tempHexValue);
  };

  const handleInputChange = (inputValue: string) => {
    setTempHexValue(inputValue);
  };

  const applyHexChange = (inputValue: string) => {
    if (inputValue === '' || inputValue === 'transparent') {
      return;
    }

    // Add # if not present
    const hexValue = inputValue.startsWith('#') ? inputValue : `#${inputValue}`;

    if (isValidHex(hexValue)) {
      onChange(hexValue);
    }
  };

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsEditing(false);
    setTempHexValue('');
  };

  return (
    <div className={`${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg h-full`}>
      <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
        <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.primary.gradient} rounded-full`}></span>
        <span>{label}</span>
      </label>

      <div className="flex space-x-4">
        {/* Hex Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="#8b5cf6"
            value={getDisplayValue()}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className={`w-full p-3 border-2 ${themeColors.dropdown.border} rounded-xl ${themeColors.dropdown.focusRing} ${themeColors.dropdown.focusBorder} transition-all duration-200 ${themeColors.background.glass} backdrop-blur-sm font-medium ${themeColors.dropdown.optionText} shadow-sm outline-none text-sm`}
          />
        </div>

        {/* Color Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-2">
            {/* Transparent option */}
            {showTransparent && (
              <button
                onClick={() => handleColorSelect('transparent')}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 hover:scale-110 bg-white relative overflow-hidden shadow-lg hover:shadow-xl ${value === 'transparent'
                  ? 'border-gray-800 shadow-xl transform scale-110 ring-2 ring-white'
                  : 'border-white hover:border-gray-300'
                  } cursor-pointer`}
                title="Transparent"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-80 transform rotate-45 translate-y-2"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-80 transform -rotate-45 translate-y-2"></div>
              </button>
            )}

            {/* Color options */}
            {colors.map(color => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg ${value === color
                  ? 'border-gray-800 shadow-xl transform scale-110 ring-2 ring-white'
                  : 'border-white hover:border-gray-300'
                  } cursor-pointer`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * InlineEditableValue Component
 * Displays a value that can be clicked to edit, maintaining original styling
 */
interface InlineEditableValueProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
}

function InlineEditableValue({
  value,
  onChange,
  min,
  max,
  suffix = '',
  className = ''
}: InlineEditableValueProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    if (!isEditing) {
      setTempValue(Math.round(value).toString());
    }
  }, [value, isEditing]);

  const applyChange = () => {
    const numValue = Number(tempValue);

    if (tempValue === '' || isNaN(numValue)) {
      setTempValue(Math.round(value).toString());
      return;
    }

    let constrainedValue = numValue;
    if (min !== undefined) constrainedValue = Math.max(min, constrainedValue);
    if (max !== undefined) constrainedValue = Math.min(max, constrainedValue);

    onChange(constrainedValue);
    setTempValue(Math.round(constrainedValue).toString());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      applyChange();
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    applyChange();
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyPress={handleKeyPress}
        onBlur={handleBlur}
        className={`font-bold text-purple-800 bg-white/90 px-3 py-1 rounded-full border border-purple-200 shadow-sm outline-none w-16 text-center text-xs ${className}`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`font-bold text-purple-800 bg-white/90 px-3 py-1 rounded-full border border-purple-200 shadow-sm cursor-pointer hover:bg-purple-50 transition-colors ${className}`}
    >
      {Math.round(value)}{suffix}
    </span>
  );
}

/**
 * TopNavbar Component
 * Contains the application logo and toolbar
 * Responsive design adapts to different screen sizes
 */
function TopNavbar() {
  const { state: { theme, isPanelOpen, selectedElement } } = useGlobalState()
  const themeColors = useThemeColors();

  // Hide toolbar buttons on desktop when Properties panel is open
  const isPropertiesPanelOpen = isPanelOpen && selectedElement !== null;

  return (
    <div className={`${themeColors.background.glass} shadow-2xl border-b ${themeColors.border.primary} p-2 sm:p-4 flex items-center justify-between transition-all duration-500`}>
      {/* Logo */}
      <div className="flex items-center space-x-2 sm:space-x-6">
        <h1 className={`text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r ${themeColors.primary.gradient} bg-clip-text text-transparent drop-shadow-lg`}>
          <span className="sm:hidden">Vision Board</span>
          <span className="hidden sm:inline">Vision Board Studio</span>
        </h1>
      </div>

      {/* Tool buttons - animate out on desktop when Properties panel is open */}
      <div className="flex-shrink-0">
        <ToolButtons
          className={`${themeColors.background.card} rounded-xl sm:rounded-2xl p-1 sm:p-2 shadow-lg transition-all duration-300 ease-in-out ${isPropertiesPanelOpen ? 'lg:opacity-0 lg:translate-x-8 lg:pointer-events-none lg:scale-95' : 'lg:opacity-100 lg:translate-x-0 lg:scale-100'}`}
        />
      </div>
    </div>
  );
}

/**
 * Canvas Component
 * Main drawing area where users can place and manipulate elements
 * Handles element creation, selection, and drag & drop functionality
 */
interface CanvasProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageToolClick: (position: { x: number, y: number }) => void;
}

const Canvas = ({
  fileInputRef,
  handleImageUpload,
  onImageToolClick
}: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add refs for tracking drag state
  const dragThresholdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDragEnabledRef = useRef(false);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);

  const {
    actions: {
      setTool, updateElement,
      selectElement, addElement,
      startElementDrag, stopElementDrag,
    },
    state: { tool, selectedElement, elements, isElementDragging, isPanelOpen }
  } = useGlobalState();
  const themeColors = useThemeColors();

  // Configurable drag threshold in milliseconds
  const DRAG_THRESHOLD_MS = 150; // Adjust this value as needed
  const MOVEMENT_THRESHOLD = 5; // Minimum pixel movement to consider it a drag

  // Function to get cursor class based on selected tool
  const getCursorClass = () => {
    switch (tool) {
      case 'text':
        return 'cursor-text';
      case 'image':
        return 'cursor-crosshair';
      case 'select':
      default:
        return 'cursor-default';
    }
  };

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    // Since canvas is centered and fitted, we need to calculate based on the canvas position
    const canvasRect = canvasRef.current?.querySelector('.canvas-background')?.getBoundingClientRect();
    if (!canvasRect) return { x: 0, y: 0 };

    return {
      x: screenX - canvasRect.left,
      y: screenY - canvasRect.top
    };
  }, []);

  // Helper function to get coordinates from either mouse or touch event
  const getEventCoordinates = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else {
      return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
    }
  };

  // Clear any pending drag timer
  const clearDragTimer = useCallback(() => {
    if (dragThresholdTimerRef.current) {
      clearTimeout(dragThresholdTimerRef.current);
      dragThresholdTimerRef.current = null;
    }
    isDragEnabledRef.current = false;
    initialPositionRef.current = null;
  }, []);

  // Handle element mouse/touch down with threshold
  const handleElementDown = useCallback((element: TextElement | ImageElement, startEvent: React.MouseEvent | React.TouchEvent) => {
    startEvent.stopPropagation();
    startEvent.preventDefault();

    // Clear any existing timer
    clearDragTimer();

    // Get initial coordinates
    const startCoords = getEventCoordinates(startEvent.nativeEvent);
    initialPositionRef.current = startCoords;

    // Get the canvas position to calculate relative coordinates
    const canvasRect = canvasRef.current?.querySelector('.canvas-background')?.getBoundingClientRect();
    if (!canvasRect) return;

    // Calculate the offset from cursor/touch to element's top-left corner
    const offsetX = startCoords.x - (canvasRect.left + element.x);
    const offsetY = startCoords.y - (canvasRect.top + element.y);

    // Set up drag timer
    dragThresholdTimerRef.current = setTimeout(() => {
      isDragEnabledRef.current = true;

      // Select the element and start dragging
      if (selectedElement?.id !== element.id) {
        selectElement(element);
      }
      startElementDrag();
    }, DRAG_THRESHOLD_MS);

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();

      const coords = getEventCoordinates(e);

      // Check if we've moved beyond the movement threshold
      if (initialPositionRef.current) {
        const deltaX = Math.abs(coords.x - initialPositionRef.current.x);
        const deltaY = Math.abs(coords.y - initialPositionRef.current.y);

        if ((deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD) && !isDragEnabledRef.current) {
          // Movement detected but drag not enabled yet - enable it immediately
          clearTimeout(dragThresholdTimerRef.current!);
          isDragEnabledRef.current = true;

          if (selectedElement?.id !== element.id) {
            selectElement(element);
          }
          startElementDrag();
        }
      }

      // Only perform drag if enabled
      if (isDragEnabledRef.current) {
        // Calculate new position maintaining the cursor/touch offset
        let newX = coords.x - canvasRect.left - offsetX;
        let newY = coords.y - canvasRect.top - offsetY;

        // Get canvas dimensions for boundary checking
        const canvasWidth = canvasRect.width;
        const canvasHeight = canvasRect.height;

        // Clamp the position to stay within canvas boundaries
        newX = Math.max(0, Math.min(canvasWidth - element.width, newX));
        newY = Math.max(0, Math.min(canvasHeight - element.height, newY));

        updateElement(element.id, {
          x: newX,
          y: newY
        });
      }
    };

    const handleUp = () => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);

      // If drag was enabled, stop dragging
      if (isDragEnabledRef.current) {
        stopElementDrag();
        selectElement(element);
      } else {
        // This was a click - just select the element
        selectElement(element);
      }

      // Clear the timer and reset state
      clearDragTimer();
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);
  }, [selectedElement, selectElement, startElementDrag, stopElementDrag, updateElement, clearDragTimer]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isElementDragging || isDragEnabledRef.current) return;

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    if (tool === 'text') {
      const newElement: TextElement = {
        id: `text-${Date.now().toString()}`,
        type: 'text',
        x: canvasPos.x,
        y: canvasPos.y,
        width: 200,
        height: 50,
        content: 'Your Vision Here',
        color: '#8b5cf6',
        fontSize: 24,
        fontFamily: 'Poppins',
        backgroundColor: 'transparent',
        rotation: 0,
        borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'solid',
        autoHeight: true // Track if height is auto or manually set
      };
      addElement(newElement);
      selectElement(newElement);
      setTool('select');
    } else if (tool === 'image') {
      onImageToolClick(canvasPos);
    } else {
      // Clear selection when clicking empty canvas
      selectElement(null);
      setTool('select');
    }
  }, [tool, screenToCanvas, isElementDragging, setTool, addElement, selectElement, onImageToolClick]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      clearDragTimer();
    };
  }, [clearDragTimer]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden flex items-center justify-center p-6"
    >
      <div
        ref={canvasRef}
        className="flex-1 h-full flex items-center justify-center"
        onClick={handleCanvasClick}
      >
        {/* Canvas Background */}
        <div
          className={`flex-1 h-full canvas-background ${themeColors.background.glass} border-2 border-white/40 relative rounded-2xl ${getCursorClass()}`}
          style={{
            backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.15) 1px, transparent 0),
                radial-gradient(circle at 1px 1px, rgba(236, 72, 153, 0.1) 1px, transparent 0)
              `,
            backgroundSize: `40px 40px, 20px 20px`,
            backgroundPosition: `0 0, 20px 20px`
          }}
        >
          {/* Elements */}
          {elements.map(element => (
            element.type === 'text' ? (
              <TextAutoContainer
                key={element.id}
                element={element}
                isSelected={selectedElement?.id === element.id}
                isDragging={isElementDragging && selectedElement?.id === element.id}
                onSelect={() => selectElement(element)}
                onDragStart={(e) => handleElementDown(element, e)}
                updateElement={updateElement}
              />
            ) : (
              <div
                key={element.id}
                data-element-id={element.id}
                className={`bg-transparent absolute ${isElementDragging && selectedElement?.id === element.id
                  ? 'cursor-grabbing transition-none scale-105 z-50'
                  : 'cursor-grab transition-all duration-200 hover:scale-[1.02]'
                  } ${selectedElement?.id === element.id
                    ? 'ring-4 ring-violet-500 ring-opacity-70 shadow-2xl'
                    : 'hover:shadow-2xl'
                  }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation}deg)`,
                  touchAction: 'none'
                }}
                onMouseDown={(e) => handleElementDown(element, e)}
                onTouchStart={(e) => handleElementDown(element, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  selectElement(element);
                }}
              >
                <img
                  src={element.url}
                  alt=""
                  className="w-full h-full object-cover shadow-xl pointer-events-none select-none"
                  style={{
                    borderWidth: element.borderWidth,
                    borderStyle: element.borderStyle,
                    borderColor: element.borderColor,
                    borderTopLeftRadius: element.borderRadius.topLeft,
                    borderTopRightRadius: element.borderRadius.topRight,
                    borderBottomLeftRadius: element.borderRadius.bottomLeft,
                    borderBottomRightRadius: element.borderRadius.bottomRight,
                  }}
                  draggable={false}
                />
              </div>
            )
          ))}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

// =============================================
// PROPERTIES PANEL COMPONENTS
// =============================================

/**
 * ElementInfoSection Component
 * Displays basic information about the selected element (type, ID)
 */
interface ElementInfoSectionProps {
  selectedElement: TextElement | ImageElement;
}

function ElementInfoSection({ selectedElement }: ElementInfoSectionProps) {
  const themeColors = useThemeColors();
  return (
    <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
      <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
        <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
        <span>Element Info</span>
      </label>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-sm ${themeColors.text.secondary} font-medium`}>Type:</span>
          <div className="flex items-center space-x-2">
            {selectedElement.type === 'text' ? (
              <>
                <FiType className="text-blue-600" size={16} />
                <span className={`font-bold ${themeColors.text.primary} capitalize`}>Text</span>
              </>
            ) : (
              <>
                <FiImage className="text-green-600" size={16} />
                <span className={`font-bold ${themeColors.text.primary} capitalize`}>Image</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${themeColors.text.secondary} font-medium`}>ID:</span>
          <span className={`text-xs font-mono ${themeColors.background.glass} px-2 py-1 rounded ${themeColors.text.secondary}`}>
            {selectedElement.id}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ContentSection Component  
 * Handles content editing for different element types (text vs image)
 */
interface ContentSectionProps {
  selectedElement: TextElement | ImageElement;
  updateElement: (id: string, updates: Partial<TextElement | ImageElement>) => void;
}

function ContentSection({ selectedElement, updateElement }: ContentSectionProps) {
  const themeColors = useThemeColors();
  return (
    <>
      {selectedElement.type === 'text' ? (
        <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
          <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
            <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.primary.gradient} rounded-full`}></span>
            <span>Text Content</span>
          </label>
          <textarea
            value={selectedElement.content}
            onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
            className={`outline-none w-full p-4 border border-purple-200 rounded-xl focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${themeColors.background.glass} backdrop-blur-sm font-bold ${themeColors.text.primary} shadow-sm min-h-[100px] resize-none`}
            placeholder="Enter your text..."
          />
        </div>
      ) : (
        <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
          <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
            <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.primary.gradient} rounded-full`}></span>
            <span>Image Source</span>
          </label>
          <div className={`text-sm ${themeColors.text.secondary} font-medium`}>
            Image uploaded successfully
          </div>
        </div>
      )}
    </>
  );
}

/**
 * ActionButtons Component
 * Duplicate and delete buttons for the selected element
 */
interface ActionButtonsProps {
  selectedElement: TextElement | ImageElement;
  duplicateElement: (id: string) => void;
  deleteElement: (id: string) => void;
}

function ActionButtons({ selectedElement, duplicateElement, deleteElement }: ActionButtonsProps) {
  const themeColors = useThemeColors();
  return (
    <div className="flex space-x-4 pt-4">
      <button
        onClick={() => duplicateElement(selectedElement.id)}
        className={`flex-1 bg-gradient-to-r ${themeColors.secondary.gradient} text-white py-4 px-6 rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer`}
      >
        <FiCopy size={18} />
        <span>Duplicate</span>
      </button>
      <button
        onClick={() => deleteElement(selectedElement.id)}
        className={`flex-1 bg-gradient-to-r ${themeColors.warning.gradient} text-white py-4 px-6 rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer`}
      >
        <FiTrash2 size={18} />
        <span>Delete</span>
      </button>
    </div>
  );
}

/**
 * MobileActionButtons Component
 * Action buttons for mobile panel in column layout
 */
function MobileActionButtons({ selectedElement, duplicateElement, deleteElement }: ActionButtonsProps) {
  const themeColors = useThemeColors();
  return (
    <div className={`flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`} style={{ width: 'fit-content', minWidth: '160px' }}>
      <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
        <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
        <span>Actions</span>
      </label>
      <div className="flex flex-col space-y-3">
        <button
          onClick={() => duplicateElement(selectedElement.id)}
          className={`bg-gradient-to-r ${themeColors.secondary.gradient} text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 font-bold shadow-md transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap`}
        >
          <FiCopy size={16} />
          <span>Duplicate</span>
        </button>
        <button
          onClick={() => deleteElement(selectedElement.id)}
          className={`bg-gradient-to-r ${themeColors.warning.gradient} text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 font-bold shadow-md transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer whitespace-nowrap`}
        >
          <FiTrash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

/**
 * VerticalToolPanel Component
 * Vertical panel that shows tool icons beside the Properties panel
 * Only visible when Properties panel is open on desktop
 */
function VerticalToolPanel() {
  const { state, actions } = useGlobalState();
  const { tool, elements, theme } = state;
  const { setTool, clearCanvas, toggleTheme, toggleHelpModal } = actions;
  const themeColors = useThemeColors();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClearCanvas = () => {
    if (elements.length === 0) return;
    clearCanvas();
  };

  // Trigger animation on mount
  useEffect(() => {
    setTimeout(() => {
      setIsAnimating(true);
    }, 0);
  }, []);

  return (
    <div className={`fixed top-[10px] right-[400px] transform ${themeColors.background.card} rounded-2xl p-3 shadow-2xl border ${themeColors.border.primary} z-40 transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setTool('select')}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${tool === 'select'
            ? `bg-gradient-to-r ${themeColors.primary.gradient} text-white shadow-xl scale-105`
            : `${themeColors.hover.background} ${themeColors.text.primary} ${themeColors.hover.text}`
            } cursor-pointer ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: isAnimating ? '100ms' : '0ms' }}
          title="Select Tool"
        >
          <FiMousePointer size={20} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${tool === 'text'
            ? `bg-gradient-to-r ${themeColors.secondary.gradient} text-white shadow-xl scale-105`
            : `${themeColors.hover.background} ${themeColors.text.primary} ${themeColors.hover.text}`
            } cursor-pointer ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: isAnimating ? '200ms' : '0ms' }}
          title="Text Tool"
        >
          <FiType size={20} />
        </button>
        <button
          onClick={() => setTool('image')}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${tool === 'image'
            ? `bg-gradient-to-r ${themeColors.success.gradient} text-white shadow-xl scale-105`
            : `${themeColors.hover.background} ${themeColors.text.primary} ${themeColors.hover.text}`
            } cursor-pointer ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: isAnimating ? '300ms' : '0ms' }}
          title="Image Tool"
        >
          <FiImage size={20} />
        </button>

        {/* Separator */}
        <div className={`w-full h-px ${themeColors.border.muted} my-1 transition-all duration-300 ${isAnimating ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} style={{ transitionDelay: isAnimating ? '350ms' : '0ms' }}></div>

        {/* Reset button */}
        <button
          onClick={handleClearCanvas}
          disabled={elements.length === 0}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${elements.length === 0
            ? `opacity-50 cursor-not-allowed ${themeColors.text.muted}`
            : `${theme === 'light' ? 'hover:bg-red-50' : 'hover:bg-red-900/30'} text-red-600 hover:text-red-700 hover:shadow-lg cursor-pointer`
            } ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: isAnimating ? '400ms' : '0ms' }}
          title={elements.length === 0 ? "Canvas is already empty" : "Clear Canvas"}
        >
          <FiRotateCcw size={20} />
        </button>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r ${themeColors.warning.gradient} hover:text-white ${themeColors.text.primary} hover:shadow-lg cursor-pointer ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: isAnimating ? '500ms' : '0ms' }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? (
            <FiMoon size={20} />
          ) : (
            <FiSun size={20} />
          )}
        </button>

        {/* Help button */}
        <button
          onClick={toggleHelpModal}
          className={`p-3 rounded-xl transition-all duration-200 transform hover:scale-105 ${themeColors.text.primary} ${theme === 'light' ? 'hover:text-blue-600 hover:bg-blue-50' : 'hover:text-blue-400 hover:bg-blue-900/30'} hover:shadow-lg hover:border-blue-200 cursor-pointer ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: isAnimating ? '600ms' : '0ms' }}
          title="Getting Started Guide"
        >
          <FiInfo size={20} />
        </button>
      </div>
    </div>
  );
}

/**
 * Properties Panel Component
 * Main container for element property editing
 * Shows when an element is selected and provides comprehensive editing options
 */
interface PropertiesPanelProps {
  duplicateElement: (id: string) => void;
  isVisible: boolean;
}

function MobilePropertiesPanel({ duplicateElement, isVisible }: PropertiesPanelProps) {
  const {
    actions: {
      updateElement,
      deleteElement,
      selectElement,
      setTool,
    },
    state: { selectedElement, theme }
  } = useGlobalState();

  const themeColors = useThemeColors();
  const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#f97316', '#14b8a6'];
  const fonts = ['Poppins', 'Inter', 'Playfair Display', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Source Sans Pro'];

  return (
    <div className={`fixed bottom-0 left-0 right-0 h-80 w-full ${theme === 'light' ? themeColors.background.glass : 'bg-gray-900/60 backdrop-blur-xl border border-gray-700/50'} border-t ${theme === 'light' ? 'border-white/30' : 'border-gray-700/30'} shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}>
      {selectedElement && (
        <div className="flex flex-col h-full">
          {/* Chevron Down Icon at Center Top */}
          <div className="flex justify-center py-2">
            <div className={`p-2 bg-gradient-to-r ${themeColors.primary.gradient} rounded-full shadow-lg`} onClick={() => {
              selectElement(null);
              setTool('select');
            }}>
              <FiChevronDown className="text-white" size={16} />
            </div>
          </div>

          {/* Header with title and close button */}
          <div className={`flex items-center justify-between px-6 py-2 border-b ${theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'} bg-inherit`}>
            <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} flex items-center space-x-3`}>
              <div className={`p-2 bg-gradient-to-r ${themeColors.primary.gradient} rounded-xl`}>
                <FaPalette className="text-white" size={18} />
              </div>
              <span>Properties</span>
            </h3>
          </div>

          {/* Horizontally Scrollable Content */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
            <div className="flex space-x-6 min-w-max flex-1 h-full">
              {/* Element Info Section */}
              <div className="w-72 flex-shrink-0 h-full">
                <ElementInfoSection selectedElement={selectedElement} />
              </div>

              {/* Content Section */}
              <div className="w-80 flex-shrink-0 h-full">
                <ContentSection
                  selectedElement={selectedElement}
                  updateElement={updateElement}
                />
              </div>

              {/* Text-specific properties */}
              {selectedElement.type === 'text' && (
                <>
                  <div className={`flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`} style={{ width: 'fit-content', minWidth: '280px' }}>
                    <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                      <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.secondary.gradient} rounded-full`}></span>
                      <span>Font Family</span>
                    </label>
                    <div className="grid grid-cols-4 grid-rows-2 gap-2">
                      {fonts.slice(0, 8).map(font => (
                        <button
                          key={font}
                          onClick={() => updateElement(selectedElement.id, { fontFamily: font })}
                          className={`p-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 whitespace-nowrap ${selectedElement.fontFamily === font
                            ? `${themeColors.dropdown.focusBorder.replace('focus:', '')} ${themeColors.dropdown.optionSelected} shadow-lg`
                            : `${themeColors.dropdown.border} ${themeColors.background.solid} ${themeColors.dropdown.optionHover} ${themeColors.dropdown.optionText}`
                            }`}
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`w-72 flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`}>
                    <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                      <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
                      <span className={themeColors.text.primary}>Font Size</span>
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={selectedElement.fontSize}
                      onChange={(e) => {
                        updateElement(selectedElement.id, { fontSize: Number(e.target.value) });
                      }}
                      className="w-full h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className={`flex justify-between text-xs ${themeColors.text.secondary} mt-3 font-semibold`}>
                      <span className={themeColors.text.primary}>12px</span>
                      <InlineEditableValue
                        value={selectedElement.fontSize}
                        onChange={(value) => updateElement(selectedElement.id, { fontSize: value })}
                        min={12}
                        max={72}
                        suffix="px"
                      />
                      <span className={themeColors.text.primary}>72px</span>
                    </div>
                  </div>

                  <div className="w-[400px] flex-shrink-0 h-full">
                    <MobileColorPicker
                      label="Text Color"
                      value={selectedElement.color}
                      onChange={(color) => updateElement(selectedElement.id, { color })}
                      colors={colors}
                    />
                  </div>

                  <div className="w-[400px] flex-shrink-0 h-full">
                    <MobileColorPicker
                      label="Background Color"
                      value={selectedElement.backgroundColor}
                      onChange={(color) => updateElement(selectedElement.id, { backgroundColor: color })}
                      colors={colors}
                      showTransparent={true}
                    />
                  </div>
                </>
              )}

              {/* Common properties for all element types */}
              <div className={`w-[500px] flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.warning.gradient} rounded-full`}></span>
                  <span>Position & Size</span>
                </label>
                <div className="flex space-x-3">
                  <NumberInput
                    label="X"
                    value={selectedElement.x}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxX = canvasElement ? canvasElement.clientWidth - selectedElement.width : 0;
                      const clampedX = Math.max(0, Math.min(maxX, value));
                      updateElement(selectedElement.id, { x: clampedX });
                    }}
                    min={0}
                    className="flex-1"
                  />
                  <NumberInput
                    label="Y"
                    value={selectedElement.y}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxY = canvasElement ? canvasElement.clientHeight - selectedElement.height : 0;
                      const clampedY = Math.max(0, Math.min(maxY, value));
                      updateElement(selectedElement.id, { y: clampedY });
                    }}
                    min={0}
                    className="flex-1"
                  />
                  <NumberInput
                    label="Width"
                    value={selectedElement.width}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxWidth = canvasElement ? canvasElement.clientWidth - selectedElement.x : 30;
                      const clampedWidth = Math.max(30, Math.min(maxWidth, value));
                      updateElement(selectedElement.id, { width: clampedWidth });
                    }}
                    min={30}
                    className="flex-1"
                    disabled={selectedElement.type === 'text'}
                  />
                  <NumberInput
                    label="Height"
                    value={selectedElement.height}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxHeight = canvasElement ? canvasElement.clientHeight - selectedElement.y : 30;
                      const clampedHeight = Math.max(30, Math.min(maxHeight, value));
                      updateElement(selectedElement.id, { height: clampedHeight });
                    }}
                    min={30}
                    className="flex-1"
                    disabled={selectedElement.type === 'text'}
                  />
                </div>
              </div>

              <div className={`w-72 flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
                  <span>Rotation</span>
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedElement.rotation}
                  onChange={(e) => {
                    updateElement(selectedElement.id, { rotation: Number(e.target.value) });
                  }}
                  className="w-full h-4 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className={`flex justify-between text-xs ${themeColors.text.secondary} mt-3 font-semibold`}>
                  <span>-180°</span>
                  <InlineEditableValue
                    value={selectedElement.rotation}
                    onChange={(value) => updateElement(selectedElement.id, { rotation: value })}
                    min={-180}
                    max={180}
                    suffix="°"
                    className="text-orange-800 border-orange-200"
                  />
                  <span>180°</span>
                </div>
              </div>

              {/* Border Properties */}
              <div className={`flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.warning.gradient} rounded-full`}></span>
                  <span>Border Properties</span>
                </label>

                <div className="flex space-x-6">
                  {/* Border Width */}
                  <div className="flex-1">
                    <label className={`text-xs ${themeColors.text.secondary} mb-2 block font-bold`}>Width</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={selectedElement.borderWidth}
                      onChange={(e) => {
                        updateElement(selectedElement.id, { borderWidth: Number(e.target.value) });
                      }}
                      className="w-full h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-center mt-2">
                      <InlineEditableValue
                        value={selectedElement.borderWidth}
                        onChange={(value) => updateElement(selectedElement.id, { borderWidth: value })}
                        min={0}
                        max={20}
                        suffix="px"
                        className="text-gray-800 border-gray-200"
                      />
                    </div>
                  </div>

                  {/* Border Style */}
                  <div className={`flex-shrink-0 ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`} style={{ width: 'fit-content', minWidth: '200px' }}>
                    <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                      <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.secondary.gradient} rounded-full`}></span>
                      <span>Border Style</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['solid', 'dashed', 'dotted'].map(style => (
                        <button
                          key={style}
                          onClick={() => updateElement(selectedElement.id, { borderStyle: style as 'solid' | 'dashed' | 'dotted' })}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-3 whitespace-nowrap ${selectedElement.borderStyle === style
                            ? `${themeColors.dropdown.focusBorder.replace('focus:', '')} ${themeColors.dropdown.optionSelected} shadow-lg`
                            : `${themeColors.dropdown.border} ${themeColors.background.solid} ${themeColors.dropdown.optionHover} ${themeColors.dropdown.optionText}`
                            }`}
                        >
                          <div
                            className="w-8 h-1"
                            style={{ borderTop: `2px ${style} ${selectedElement.borderStyle === style ? '#1d4ed8' : '#6b7280'}` }}
                          />
                          <span className="capitalize text-xs font-medium">{style}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Color */}
                  <div className="flex-1">
                    <label className={`text-xs ${themeColors.text.secondary} mb-2 block font-bold`}>Color</label>
                    <div className="grid grid-cols-5 gap-2">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement(selectedElement.id, { borderColor: color })}
                          className={`w-8 h-8 rounded-lg border-2 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg ${selectedElement.borderColor === color
                            ? 'border-gray-800 shadow-xl transform scale-110 ring-2 ring-white'
                            : 'border-white hover:border-gray-300'
                            } cursor-pointer`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div className={`w-[520px] flex-shrink-0 h-full ${themeColors.background.card} p-4 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
                  <span>Border Radius</span>
                </label>

                <div className="flex space-x-3 mb-4">
                  <NumberInput
                    label="TL"
                    value={selectedElement.borderRadius.topLeft}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        topLeft: value
                      }
                    })}
                    min={0}
                    max={100}
                    className="flex-1"
                  />
                  <NumberInput
                    label="TR"
                    value={selectedElement.borderRadius.topRight}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        topRight: value
                      }
                    })}
                    min={0}
                    max={100}
                    className="flex-1"
                  />
                  <NumberInput
                    label="BL"
                    value={selectedElement.borderRadius.bottomLeft}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        bottomLeft: value
                      }
                    })}
                    min={0}
                    max={100}
                    className="flex-1"
                  />
                  <NumberInput
                    label="BR"
                    value={selectedElement.borderRadius.bottomRight}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        bottomRight: value
                      }
                    })}
                    min={0}
                    max={100}
                    className="flex-1"
                  />
                </div>

                {/* Apply to All Corners Button */}
                <button
                  onClick={() => {
                    const radius = selectedElement.borderRadius.topLeft;
                    updateElement(selectedElement.id, {
                      borderRadius: {
                        topLeft: radius,
                        topRight: radius,
                        bottomLeft: radius,
                        bottomRight: radius
                      }
                    });
                  }}
                  className={`w-full py-2 px-4 bg-gradient-to-r ${themeColors.secondary.gradient} text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm cursor-pointer`}
                >
                  Apply TL to All
                </button>
              </div>

              {/* Action Buttons */}
              <MobileActionButtons
                selectedElement={selectedElement}
                duplicateElement={duplicateElement}
                deleteElement={deleteElement}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesPanel({ duplicateElement, isVisible }: PropertiesPanelProps) {
  const {
    actions: {
      updateElement,
      deleteElement,
      selectElement,
      setTool,
    },
    state: { selectedElement, theme }
  } = useGlobalState();

  const themeColors = useThemeColors();
  const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#84cc16', '#f97316', '#14b8a6'];
  const fonts = ['Poppins', 'Inter', 'Playfair Display', 'Roboto', 'Open Sans', 'Montserrat', 'Lato', 'Source Sans Pro'];

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 ${theme === 'light' ? themeColors.background.glass : 'bg-gray-900/60 backdrop-blur-xl border border-gray-700/50'} border-l ${theme === 'light' ? 'border-white/30' : 'border-gray-700/30'} shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
    >
      {selectedElement && (
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className={`flex items-center justify-between p-6 border-b ${theme === 'light' ? 'border-gray-200/50' : 'border-gray-700/50'} bg-inherit`}>
            <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} flex items-center space-x-3`}>
              <div className={`p-2 bg-gradient-to-r ${themeColors.primary.gradient} rounded-xl`}>
                <FaPalette className="text-white" size={20} />
              </div>
              <span>Properties</span>
            </h3>
            <button
              onClick={() => {
                selectElement(null);
                setTool('select');
              }}
              className={`p-2 rounded-lg transition-all duration-300 ${theme === 'light' ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'} cursor-pointer`}
              title="Close panel"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 relative">
            <div className="space-y-8">
              {/* Element Info Section */}
              <ElementInfoSection selectedElement={selectedElement} />

              {/* Content Section */}
              <ContentSection
                selectedElement={selectedElement}
                updateElement={updateElement}
              />

              {/* Text-specific properties */}
              {selectedElement.type === 'text' && (
                <>
                  <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
                    <label className={`text-sm font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} mb-4 flex items-center space-x-2`}>
                      <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.secondary.gradient} rounded-full`}></span>
                      <span className={themeColors.text.primary}>Font Family</span>
                    </label>
                    <CustomDropdown
                      value={selectedElement.fontFamily}
                      options={fonts}
                      onChange={(value) => updateElement(selectedElement.id, { fontFamily: value })}
                      renderOption={(font) => (
                        <span style={{ fontFamily: font }}>{font}</span>
                      )}
                      renderValue={(font) => (
                        <span style={{ fontFamily: font }}>{font}</span>
                      )}
                      isMobile={true}
                    />
                  </div>

                  <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
                    <label className={`text-sm font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} mb-4 flex items-center space-x-2`}>
                      <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
                      <span className={themeColors.text.primary}>Font Size</span>
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={selectedElement.fontSize}
                      onChange={(e) => {
                        updateElement(selectedElement.id, { fontSize: Number(e.target.value) });
                      }}
                      className="w-full h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg appearance-none cursor-pointer slider"
                      style={{ touchAction: 'manipulation' }}
                    />
                    <div className={`flex justify-between text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} mt-3 font-semibold`}>
                      <span>12px</span>
                      <InlineEditableValue
                        value={selectedElement.fontSize}
                        onChange={(value) => updateElement(selectedElement.id, { fontSize: value })}
                        min={12}
                        max={72}
                        suffix="px"
                      />
                      <span>72px</span>
                    </div>
                  </div>

                  <ColorPicker
                    label="Text Color"
                    value={selectedElement.color}
                    onChange={(color) => updateElement(selectedElement.id, { color })}
                    colors={colors}
                  />

                  <ColorPicker
                    label="Background Color"
                    value={selectedElement.backgroundColor}
                    onChange={(color) => updateElement(selectedElement.id, { backgroundColor: color })}
                    colors={colors}
                    showTransparent={true}
                  />
                </>
              )}

              {/* Common properties for all element types */}
              <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.warning.gradient} rounded-full`}></span>
                  <span className={themeColors.text.primary}>Position & Size</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="X Position"
                    value={selectedElement.x}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxX = canvasElement ? canvasElement.clientWidth - selectedElement.width : 0;
                      const clampedX = Math.max(0, Math.min(maxX, value));
                      updateElement(selectedElement.id, { x: clampedX });
                    }}
                    min={0}
                  />
                  <NumberInput
                    label="Y Position"
                    value={selectedElement.y}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxY = canvasElement ? canvasElement.clientHeight - selectedElement.height : 0;
                      const clampedY = Math.max(0, Math.min(maxY, value));
                      updateElement(selectedElement.id, { y: clampedY });
                    }}
                    min={0}
                  />
                  <NumberInput
                    label="Width"
                    value={selectedElement.width}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxWidth = canvasElement ? canvasElement.clientWidth - selectedElement.x : 30;
                      const clampedWidth = Math.max(30, Math.min(maxWidth, value));
                      updateElement(selectedElement.id, { width: clampedWidth });
                    }}
                    min={30}
                    disabled={selectedElement.type === 'text'}
                  />
                  <NumberInput
                    label="Height"
                    value={selectedElement.height}
                    onChange={(value) => {
                      const canvasElement = document.querySelector('.canvas-background') as HTMLElement;
                      const maxHeight = canvasElement ? canvasElement.clientHeight - selectedElement.y : 30;
                      const clampedHeight = Math.max(30, Math.min(maxHeight, value));
                      updateElement(selectedElement.id, { height: clampedHeight });
                    }}
                    min={30}
                    disabled={selectedElement.type === 'text'}
                  />
                </div>
              </div>

              <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
                  <span>Rotation</span>
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedElement.rotation}
                  onChange={(e) => {
                    updateElement(selectedElement.id, { rotation: Number(e.target.value) });
                  }}
                  className="w-full h-4 bg-gradient-to-r from-orange-400 to-pink-500 rounded-lg appearance-none cursor-pointer"
                />
                <div className={`flex justify-between text-xs ${themeColors.text.secondary} mt-3 font-semibold`}>
                  <span>-180°</span>
                  <InlineEditableValue
                    value={selectedElement.rotation}
                    onChange={(value) => updateElement(selectedElement.id, { rotation: value })}
                    min={-180}
                    max={180}
                    suffix="°"
                    className="text-orange-800 border-orange-200"
                  />
                  <span>180°</span>
                </div>
              </div>

              {/* Border Properties */}
              <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.warning.gradient} rounded-full`}></span>
                  <span>Border Properties</span>
                </label>

                <div className="space-y-4">
                  {/* Border Width */}
                  <div>
                    <label className={`text-xs ${themeColors.text.secondary} mb-2 block font-bold`}>Border Width</label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={selectedElement.borderWidth}
                      onChange={(e) => {
                        updateElement(selectedElement.id, { borderWidth: Number(e.target.value) });
                      }}
                      className="w-full h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className={`flex justify-between text-xs ${themeColors.text.secondary} mt-2 font-semibold`}>
                      <span>0px</span>
                      <InlineEditableValue
                        value={selectedElement.borderWidth}
                        onChange={(value) => updateElement(selectedElement.id, { borderWidth: value })}
                        min={0}
                        max={20}
                        suffix="px"
                        className="text-gray-800 border-gray-200"
                      />
                      <span>20px</span>
                    </div>
                  </div>

                  {/* Border Style */}
                  <div>
                    <label className={`text-xs ${themeColors.text.secondary} mb-2 block font-bold`}>Border Style</label>
                    <CustomDropdown
                      value={selectedElement.borderStyle}
                      options={['solid', 'dashed', 'dotted']}
                      onChange={(value) => updateElement(selectedElement.id, { borderStyle: value as 'solid' | 'dashed' | 'dotted' })}
                      renderOption={(style) => (
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-1"
                            style={{ borderTop: `2px ${style} #6b7280` }}
                          />
                          <span className="capitalize">{style}</span>
                        </div>
                      )}
                      renderValue={(style) => (
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-1"
                            style={{ borderTop: `2px ${style} #6b7280` }}
                          />
                          <span className="capitalize">{style}</span>
                        </div>
                      )}
                      className="border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Border Color */}
                  <div>
                    <label className={`text-xs ${themeColors.text.secondary} mb-2 block font-bold`}>Border Color</label>
                    <div className="grid grid-cols-5 gap-3">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => updateElement(selectedElement.id, { borderColor: color })}
                          className={`w-12 h-12 rounded-xl border-4 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg ${selectedElement.borderColor === color
                            ? 'border-gray-800 shadow-xl transform scale-110 ring-2 ring-white'
                            : 'border-white hover:border-gray-300'
                            } cursor-pointer`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Border Radius */}
              <div className={`${themeColors.background.card} p-6 rounded-2xl border border-white/40 shadow-lg`}>
                <label className={`text-sm font-bold ${themeColors.text.primary} mb-4 flex items-center space-x-2`}>
                  <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.accent.gradient} rounded-full`}></span>
                  <span>Border Radius</span>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="Top Left"
                    value={selectedElement.borderRadius.topLeft}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        topLeft: value
                      }
                    })}
                    min={0}
                    max={100}
                  />
                  <NumberInput
                    label="Top Right"
                    value={selectedElement.borderRadius.topRight}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        topRight: value
                      }
                    })}
                    min={0}
                    max={100}
                  />
                  <NumberInput
                    label="Bottom Left"
                    value={selectedElement.borderRadius.bottomLeft}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        bottomLeft: value
                      }
                    })}
                    min={0}
                    max={100}
                  />
                  <NumberInput
                    label="Bottom Right"
                    value={selectedElement.borderRadius.bottomRight}
                    onChange={(value) => updateElement(selectedElement.id, {
                      borderRadius: {
                        ...selectedElement.borderRadius,
                        bottomRight: value
                      }
                    })}
                    min={0}
                    max={100}
                  />
                </div>

                {/* Apply to All Corners Button */}
                <div className="mt-4">
                  <button
                    onClick={() => {
                      const radius = selectedElement.borderRadius.topLeft;
                      updateElement(selectedElement.id, {
                        borderRadius: {
                          topLeft: radius,
                          topRight: radius,
                          bottomLeft: radius,
                          bottomRight: radius
                        }
                      });
                    }}
                    className={`w-full py-2 px-4 bg-gradient-to-r ${themeColors.secondary.gradient} text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm cursor-pointer`}
                  >
                    Apply Top-Left to All Corners
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <ActionButtons
                selectedElement={selectedElement}
                duplicateElement={duplicateElement}
                deleteElement={deleteElement}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ImageOptionsModal Component
 * Modal that appears when image tool is used, offering upload or URL options
 */
interface ImageOptionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onFileUpload: () => void;
  onUrlSubmit: (url: string) => void;
  theme: ThemeType;
}

function ImageOptionsModal({ isVisible, onClose, onFileUpload, onUrlSubmit, theme }: ImageOptionsModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const themeColors = useThemeColors();

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const validateAndSubmitUrl = async () => {
    if (!imageUrl.trim()) {
      setUrlError('Please enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      setUrlError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setUrlError('');

    // Test if the URL is a valid image by creating an Image object
    const img = new Image();
    img.onload = () => {
      setIsLoading(false);
      onUrlSubmit(imageUrl);
      setImageUrl('');
      handleClose();
    };
    img.onerror = () => {
      setIsLoading(false);
      setUrlError('Unable to load image from this URL. Please check the URL and try again.');
    };
    img.src = imageUrl;
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setImageUrl('');
      setUrlError('');
      setIsLoading(false);
      onClose();
    }, 200); // Wait for exit animation
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndSubmitUrl();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[100] transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      style={{
        background: theme === 'light'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15), rgba(6, 182, 212, 0.15))'
          : 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(31, 41, 55, 0.8), rgba(0, 0, 0, 0.6))',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Backdrop overlay for additional blur and color */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${theme === 'light'
          ? 'bg-white/20'
          : 'bg-black/40'
          }`}
        onClick={handleClose}
      />

      <div
        className={`relative ${theme === 'light'
          ? 'bg-white/95 backdrop-blur-xl border-2 border-white/60 shadow-2xl'
          : 'bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl'
          } rounded-3xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} flex items-center space-x-3`}>
            <div className={`p-3 bg-gradient-to-r ${themeColors.success.gradient} rounded-xl shadow-lg`}>
              <FiImage className="text-white" size={24} />
            </div>
            <span>Add Image</span>
          </h3>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${theme === 'light'
              ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              } cursor-pointer`}
            title="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-6">
          {/* Upload from device */}
          <div>
            <button
              onClick={() => {
                onFileUpload();
                handleClose();
              }}
              className={`w-full p-4 border-2 border-dashed transition-all duration-300 rounded-xl flex items-center justify-center space-x-3 group hover:scale-[1.02] ${theme === 'light'
                ? 'border-purple-300 hover:border-purple-400 bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100'
                : 'border-purple-500 hover:border-purple-400 bg-purple-900/20 hover:bg-purple-900/30'
                } cursor-pointer`}
            >
              <div className="text-left">
                <div className={`font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} text-lg flex items-center space-x-2`}>
                  <FiUpload className="text-white" size={20} />
                  <span>Upload from Device</span>
                </div>
                <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Browse and select an image file</div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className={`flex-1 h-px ${theme === 'light' ? 'bg-gradient-to-r from-transparent via-gray-300 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'}`}></div>
            <span className={`px-4 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} font-medium bg-gradient-to-r ${themeColors.accent.gradient} bg-clip-text text-transparent`}>OR</span>
            <div className={`flex-1 h-px ${theme === 'light' ? 'bg-gradient-to-r from-transparent via-gray-300 to-transparent' : 'bg-gradient-to-r from-transparent via-gray-600 to-transparent'}`}></div>
          </div>

          {/* Paste URL */}
          <div>
            <label className={`text-sm font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} mb-3 flex items-center space-x-2`}>
              <span className={`w-3 h-3 bg-gradient-to-r ${themeColors.secondary.gradient} rounded-full shadow-sm`}></span>
              <span>Paste Image URL</span>
            </label>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setUrlError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="https://example.com/image.jpg"
              className={`w-full p-4 border-2 rounded-xl focus:ring-2 transition-all duration-200 font-medium shadow-sm outline-none ${urlError
                ? 'border-red-400 focus:ring-red-500'
                : theme === 'light'
                  ? 'border-purple-200 focus:ring-purple-500 focus:border-purple-500 bg-white/90 text-gray-800'
                  : 'border-purple-500 focus:ring-purple-400 focus:border-purple-400 bg-gray-800/50 text-gray-200'
                } cursor-pointer`}
              disabled={isLoading}
            />

            {urlError && (
              <p className="text-red-500 text-sm mt-2 font-semibold animate-pulse">{urlError}</p>
            )}

            <button
              onClick={validateAndSubmitUrl}
              disabled={!imageUrl.trim() || isLoading}
              className={`w-full mt-4 py-4 px-6 bg-gradient-to-r ${themeColors.secondary.gradient} text-white rounded-xl transition-all duration-300 font-bold shadow-lg transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 cursor-pointer`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading Image...</span>
                </>
              ) : (
                <>
                  <FiImage size={18} />
                  <span>Add Image from URL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * HelpModal Component
 * Comprehensive getting started guide for new users
 * Shows step-by-step instructions for using all tools and features
 */
interface HelpModalProps {
  isVisible: boolean;
  onClose: () => void;
  theme: ThemeType;
}

function HelpModal({ isVisible, onClose, theme }: HelpModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const themeColors = useThemeColors();

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isVisible) return null;

  return (

    <div
      className={`fixed inset-0 flex items-center justify-center z-[100] transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
      style={{
        background: theme === 'light'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15), rgba(6, 182, 212, 0.15))'
          : 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(31, 41, 55, 0.8), rgba(0, 0, 0, 0.6))',
        backdropFilter: 'blur(12px)',
      }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Backdrop overlay */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${theme === 'light'
          ? 'bg-white/20'
          : 'bg-black/40'
          }`}
        onClick={handleClose}
      />
      <div
        className={`${theme === 'light'
          ? 'bg-white/95 backdrop-blur-xl border-2 border-white/60 shadow-2xl'
          : 'bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl'
          } rounded-3xl max-w-4xl w-full mx-4 h-[90vh] sm:h-[85vh] overflow-hidden transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          } flex flex-col`}
      >
        {/* Fixed Header */}
        <div className="p-4 sm:p-8 pb-3 sm:pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg sm:text-2xl lg:text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'} flex items-center space-x-2 sm:space-x-4`}>
              <div className={`p-2 sm:p-4 bg-gradient-to-r ${themeColors.accent.gradient} rounded-xl sm:rounded-2xl shadow-lg`}>
                <FiInfo className="text-white" size={20} />
              </div>
              <span className="leading-tight">Getting Started with Vision Board Studio</span>
            </h2>
            <button
              onClick={handleClose}
              className={`p-2 sm:p-3 rounded-xl transition-all duration-300 hover:scale-110 ${theme === 'light'
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                } cursor-pointer`}
              title="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-8 pt-4 sm:pt-6 h-full overflow-y-auto flex-1">
          {/* Welcome */}
          <div className={`${themeColors.background.card} p-4 sm:p-6 rounded-2xl border border-white/40 shadow-lg mb-4 sm:mb-6`}>
            <h3 className={`text-lg sm:text-xl font-bold ${themeColors.text.primary} mb-3 flex items-center space-x-2`}>
              <FaPalette className="text-purple-600" size={18} />
              <span>Welcome!</span>
            </h3>
            <p className={`${themeColors.text.secondary} leading-relaxed text-sm sm:text-base`}>
              Vision Board Studio is a powerful tool for creating beautiful vision boards with text and images.
              This guide will walk you through all the features to help you bring your dreams to life!
            </p>
          </div>

          {/* Main Content in Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

            {/* Tools Section */}
            <div className={`${themeColors.background.card} p-4 sm:p-6 rounded-2xl border border-white/40 shadow-lg`}>
              <h3 className={`text-base sm:text-lg font-bold ${themeColors.text.primary} mb-3 sm:mb-4 flex items-center space-x-2`}>
                <FiTool className="text-purple-600" size={14} />
                <span>Tools Overview</span>
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 sm:p-2 bg-gradient-to-r ${themeColors.primary.gradient} rounded-lg`}>
                    <FiMousePointer className="text-white" size={14} />
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-semibold ${themeColors.text.primary}`}>Select Tool</div>
                    <div className={`text-xs sm:text-sm ${themeColors.text.secondary}`}>Click elements to select, drag to move, access properties panel</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 sm:p-2 bg-gradient-to-r ${themeColors.secondary.gradient} rounded-lg`}>
                    <FiType className="text-white" size={14} />
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-semibold ${themeColors.text.primary}`}>Text Tool</div>
                    <div className={`text-xs sm:text-sm ${themeColors.text.secondary}`}>Click anywhere on canvas to add motivational text</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 sm:p-2 bg-gradient-to-r ${themeColors.success.gradient} rounded-lg`}>
                    <FiImage className="text-white" size={14} />
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-semibold ${themeColors.text.primary}`}>Image Tool</div>
                    <div className={`text-xs sm:text-sm ${themeColors.text.secondary}`}>Click to upload images or paste URLs from the web</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Getting Started Steps */}
            <div className={`${themeColors.background.card} p-4 sm:p-6 rounded-2xl border border-white/40 shadow-lg`}>
              <h3 className={`text-base sm:text-lg font-bold ${themeColors.text.primary} mb-3 sm:mb-4 flex items-center space-x-2`}>
                <FiTrendingUp className="text-blue-600" size={14} />
                <span>Quick Start</span>
              </h3>
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full text-white text-xs font-bold flex items-center justify-center">1</div>
                  <span className={`text-xs flex-1 sm:text-sm ${themeColors.text.secondary}`}>Select the <strong>Text tool</strong> and click on the canvas</span>
                </div>
                <div className="flex space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full text-white text-xs font-bold flex items-center justify-center">2</div>
                  <span className={`text-xs flex-1 sm:text-sm ${themeColors.text.secondary}`}>Type your inspirational message or goal</span>
                </div>
                <div className="flex space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full text-white text-xs font-bold flex items-center justify-center">3</div>
                  <span className={`text-xs flex-1 sm:text-sm ${themeColors.text.secondary}`}>Use the <strong>Image tool</strong> to add inspiring photos</span>
                </div>
                <div className="flex space-x-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">4</div>
                  <span className={`text-xs flex-1 sm:text-sm ${themeColors.text.secondary}`}>Select elements to customize colors, fonts, and sizes</span>
                </div>
              </div>
            </div>

            {/* Text Customization */}
            <div className={`${themeColors.background.card} p-4 sm:p-6 rounded-2xl border border-white/40 shadow-lg`}>
              <h3 className={`text-base sm:text-lg font-bold ${themeColors.text.primary} mb-3 sm:mb-4 flex items-center space-x-2`}>
                <FiStar className="text-yellow-600" size={14} />
                <span>Text Customization</span>
              </h3>
              <div className={`space-y-2.5 sm:space-y-3 text-xs sm:text-sm ${themeColors.text.secondary}`}>
                <div className="flex space-x-2">
                  <div className="flex items-center justify-center">
                    <FaPalette className="text-purple-600" size={12} />
                  </div>
                  <span className="flex-1"><strong>Colors:</strong> Change text and background colors</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center justify-center">
                    <FiType className="text-blue-600" size={12} />
                  </div>
                  <span className="flex-1"><strong>Fonts:</strong> Choose from 8 beautiful font families</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center justify-center">
                    <span className="w-3 h-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></span>
                  </div>
                  <span className="flex-1"><strong>Size:</strong> Adjust font size with slider (12-72px)</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center justify-center">
                    <span className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                  </div>
                  <span className="flex-1"><strong>Borders:</strong> Add styled borders with custom colors</span>
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center justify-center">
                    <span className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></span>
                  </div>
                  <span className="flex-1"><strong>Shape:</strong> Round corners for modern look</span>
                </div>
              </div>
            </div>

            {/* Controls & Shortcuts */}
            <div className={`${themeColors.background.card} p-4 sm:p-6 rounded-2xl border border-white/40 shadow-lg`}>
              <h3 className={`text-base sm:text-lg font-bold ${themeColors.text.primary} mb-3 sm:mb-4 flex items-center space-x-2`}>
                <FiSettings className={themeColors.text.primary} size={14} />
                <span>Controls & Shortcuts</span>
              </h3>
              <div className={`space-y-2.5 sm:space-y-3 text-xs sm:text-sm ${themeColors.text.secondary}`}>
                <div className="flex items-center justify-between">
                  <span>Delete selected element:</span>
                  <kbd className={`px-1.5 sm:px-2 py-1 ${themeColors.background.glass} rounded text-xs font-mono`}>Delete</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duplicate element:</span>
                  <kbd className={`px-1.5 sm:px-2 py-1 ${themeColors.background.glass} rounded text-xs font-mono`}>Ctrl+D</kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Drag elements:</span>
                  <span className="text-xs">Click & hold to move</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Toggle theme:</span>
                  <span className="text-xs">Click sun/moon button</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Clear canvas:</span>
                  <span className="text-xs">Click reset button</span>
                </div>
              </div>
            </div>

            {/* Mobile Tips */}
            <div className={`${themeColors.background.card} p-4 sm:p-6 rounded-2xl border border-white/40 shadow-lg lg:col-span-2`}>
              <h3 className={`text-base sm:text-lg font-bold ${themeColors.text.primary} mb-3 sm:mb-4 flex items-center space-x-2`}>
                <FiSmartphone className="text-green-600" size={14} />
                <span>Mobile & Touch Support</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className={`space-y-2.5 sm:space-y-3 text-xs sm:text-sm ${themeColors.text.secondary}`}>
                  <div className="flex items-center space-x-2">
                    <FiMousePointer className="text-blue-600" size={12} />
                    <span><strong>Touch to select:</strong> Tap any element to select it</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiMove className="text-green-600" size={12} />
                    <span><strong>Hold to drag:</strong> Press and hold to move elements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaPalette className="text-purple-600" size={12} />
                    <span><strong>Bottom panel:</strong> Properties appear at bottom on mobile</span>
                  </div>
                </div>
                <div className={`space-y-2.5 sm:space-y-3 text-xs sm:text-sm ${themeColors.text.secondary}`}>
                  <div className="flex items-center space-x-2">
                    <FiSettings className="text-orange-600" size={12} />
                    <span><strong>Responsive design:</strong> Tools adapt to screen size</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiRotateCw className="text-red-600" size={12} />
                    <span><strong>Scroll panels:</strong> Swipe horizontally for more options</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiZap className="text-indigo-600" size={12} />
                    <span><strong>Close help:</strong> Tap the chevron to dismiss properties</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <div className={`flex flex-col sm:flex-row items-center justify-between gap-4`}>
              <p className={`text-xs sm:text-sm ${themeColors.text.secondary} flex items-center space-x-2 text-center sm:text-left`}>
                <FiStar className="text-yellow-500" size={14} />
                <span><strong>Pro tip:</strong> Your vision board autosaves as you create. Have fun bringing your dreams to life!</span>
              </p>
              <button
                onClick={handleClose}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r ${themeColors.primary.gradient} text-white rounded-xl hover:shadow-lg transition-all duration-300 font-semibold transform hover:scale-105 cursor-pointer text-sm sm:text-base whitespace-nowrap`}
              >
                Start Creating!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// MAIN APPLICATION
// =============================================

/**
 * VisionBoardApp Component
 * Main application component that orchestrates all the UI components
 * Handles high-level state management and file operations
 */
function VisionBoardApp() {
  const { actions: { setTool, addElement, selectElement, deleteElement, toggleHelpModal }, state: { elements, selectedElement, theme, isPanelOpen, isElementDragging, isHelpModalOpen } } = useGlobalState()
  const themeColors = useThemeColors();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imageClickPosition, setImageClickPosition] = useState({ x: 100, y: 100 });

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = { ...element, id: `${element.type}-${Date.now().toString()}`, x: element.x + 30, y: element.y + 30 };
      addElement(newElement);
      selectElement(newElement);
    }
  }, [elements, addElement, selectElement]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newElement: ImageElement = {
        id: `image-${Date.now().toString()}`,
        type: 'image',
        x: imageClickPosition.x,
        y: imageClickPosition.y,
        width: 250,
        height: 200,
        url: event.target?.result as string,
        rotation: 0,
        borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: 0,
          bottomRight: 0
        },
        borderWidth: 0,
        borderColor: '#000000',
        borderStyle: 'solid'
      };
      addElement(newElement);
      selectElement(newElement);
    };
    reader.readAsDataURL(file);
    setTool('select');
  }, [addElement, selectElement, setTool, imageClickPosition]);

  const handleImageFromUrl = useCallback((url: string) => {
    const newElement: ImageElement = {
      id: `image-${Date.now().toString()}`,
      type: 'image',
      x: imageClickPosition.x,
      y: imageClickPosition.y,
      width: 250,
      height: 200,
      url: url,
      rotation: 0,
      borderRadius: {
        topLeft: 0,
        topRight: 0,
        bottomLeft: 0,
        bottomRight: 0
      },
      borderWidth: 0,
      borderColor: '#000000',
      borderStyle: 'solid'
    };
    addElement(newElement);
    selectElement(newElement);
    setTool('select');
  }, [addElement, selectElement, setTool, imageClickPosition]);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedElement) {
        deleteElement(selectedElement.id);
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedElement) {
        e.preventDefault();
        duplicateElement(selectedElement.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, deleteElement, duplicateElement]);

  return (
    <div className={`w-full h-screen bg-gradient-to-br ${themeColors.background.page} flex flex-col overflow-hidden relative select-none transition-all duration-500`}>
      {/* Top Navbar */}
      <TopNavbar />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <Canvas
          fileInputRef={fileInputRef}
          handleImageUpload={handleImageUpload}
          onImageToolClick={(position) => {
            setImageClickPosition(position);
            setIsImageModalVisible(true);
          }}
        />
      </div>

      {/* Image Options Modal */}
      <ImageOptionsModal
        isVisible={isImageModalVisible}
        onClose={() => setIsImageModalVisible(false)}
        onFileUpload={handleFileUpload}
        onUrlSubmit={handleImageFromUrl}
        theme={theme}
      />

      {/* Help Modal */}
      <HelpModal
        isVisible={isHelpModalOpen}
        onClose={toggleHelpModal}
        theme={theme}
      />

      {/* Desktop Properties Panel (lg and up) */}
      <div className="hidden lg:block">
        <PropertiesPanel
          duplicateElement={duplicateElement}
          isVisible={isPanelOpen && selectedElement !== null}
        />
      </div>

      {/* Vertical Tool Panel - appears beside Properties panel on desktop */}
      <div className="hidden lg:block">
        {isPanelOpen && selectedElement !== null && <VerticalToolPanel />}
      </div>

      {/* Mobile Properties Panel (md and below) */}
      <div className="block lg:hidden">
        <MobilePropertiesPanel
          duplicateElement={duplicateElement}
          isVisible={isPanelOpen && selectedElement !== null}
        />
      </div>
    </div>
  );
}

/**
 * App Component
 * Root component that wraps the entire application with global state provider
 * This is the main export for the Vision Board application
 */
export default function App() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* Google Fonts for font family options */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap" rel="stylesheet" />
      {/* Base app font */}
      <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet" />
      <div style={{ fontFamily: "Nunito Sans, sans-serif" }}>
        {/* Global Custom Scrollbar Styles */}
        <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
        <GlobalStateProvider>
          <VisionBoardApp />
        </GlobalStateProvider>
      </div>
    </>
  );
}

interface TextAutoContainerProps {
  element: any;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  updateElement: (id: string, updates: any) => void;
}
function TextAutoContainer({ element, isSelected, isDragging, onSelect, onDragStart, updateElement }: TextAutoContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (element.type !== 'text') return;
    const node = containerRef.current;
    if (!node) return;
    // Only auto-grow width/height if autoHeight is true
    if (element.autoHeight) {
      const resizeObserver = new window.ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          if (width !== element.width || height !== element.height) {
            updateElement(element.id, { width: Math.round(width), height: Math.round(height) });
          }
        }
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, [element, updateElement]);
  const style = element.autoHeight
    ? {
      left: element.x,
      top: element.y,
      minWidth: 60,
      minHeight: 40,
      maxWidth: 800,
      maxHeight: 800,
      width: 'auto',
      height: 'auto',
      transform: `rotate(${element.rotation}deg)`,
      touchAction: 'none',
    }
    : {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      touchAction: 'none',
    };
  return (
    <div
      data-element-id={element.id}
      ref={containerRef}
      className={`bg-transparent absolute ${isDragging
        ? 'cursor-grabbing transition-none scale-105 z-50'
        : 'cursor-grab transition-all duration-200 hover:scale-[1.02]'} ${isSelected
          ? 'ring-4 ring-violet-500 ring-opacity-70 shadow-2xl'
          : 'hover:shadow-2xl'}`}
      style={style}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className={`w-full h-full flex items-center justify-center p-4 transition-all duration-300 pointer-events-none select-none align-top whitespace-pre-wrap break-words ${element.autoHeight ? 'overflow-x-visible overflow-y-visible' : 'overflow-x-hidden overflow-y-hidden'}`}
        style={{
          color: element.color,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          backgroundColor: element.backgroundColor,
          fontWeight: '700',
          textShadow: element.backgroundColor === 'transparent' ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
          borderWidth: element.borderWidth,
          borderStyle: element.borderStyle,
          borderColor: element.borderColor,
          borderTopLeftRadius: element.borderRadius.topLeft,
          borderTopRightRadius: element.borderRadius.topRight,
          borderBottomLeftRadius: element.borderRadius.bottomLeft,
          borderBottomRightRadius: element.borderRadius.bottomRight,
        }}
      >
        {element.content}
      </div>
    </div>
  );
}