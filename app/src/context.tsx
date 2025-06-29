"use client"
import React, { createContext, useContext, useReducer } from 'react'

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
}

export interface ImageElement extends Element {
    type: 'image'
    url: string
}

export type ToolType = 'select' | 'text' | 'image'

interface GlobalState {
    elements: (TextElement | ImageElement)[]
    selectedElement: (TextElement | ImageElement) | null
    tool: ToolType
    isElementDragging: boolean
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
    isElementDragging: false
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
}

const reducer = (state: GlobalState, action: { type: actionTypes, payload?: any }) => {
    switch (action.type) {
        case actionTypes.ADD_ELEMENT:
            return { ...state, elements: [...state.elements, action.payload] }

        case actionTypes.DELETE_ELEMENT:
            return {
                ...state,
                elements: state.elements.filter(el => el.id !== action.payload.id),
                selectedElement: null
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
            return { ...state, selectedElement: action.payload }

        case actionTypes.SET_TOOL:
            return { ...state, tool: action.payload }

        // Element drag actions
        case actionTypes.START_ELEMENT_DRAG:
            return { ...state, isElementDragging: true }

        case actionTypes.STOP_ELEMENT_DRAG:
            return { ...state, isElementDragging: false }

        case actionTypes.CLEAR_CANVAS:
            return { ...state, elements: [], selectedElement: null }

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
    clearCanvas: () => dispatch({ type: actionTypes.CLEAR_CANVAS })
})


const GlobalStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState)
    const actions = createActions(dispatch)

    return (
        <GlobalStateContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </GlobalStateContext.Provider>
    )
}

const useGlobalState = () => {
    const context = useContext(GlobalStateContext)
    if (!context) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider')
    }
    return context
}

export { useGlobalState, GlobalStateProvider }