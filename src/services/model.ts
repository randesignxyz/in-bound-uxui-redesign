import { Dispatch } from "react";
import { useState } from "react";
import { RequestActions } from "./apiGateway";

export type ModalVisibility<ModalName> = {
    modalName: ModalName;
    visible: boolean
};


export type ModalOps<T> = {
    isVisible: (modalName: T) => boolean;
    showModal: (modalName: T) => Promise<void>;
    hideModal: (modalName: T) => void;
}

/*  Model stuffs */

export type InitDateType = 'Detail' | 'Create' | 'List'

export type ProcessingActionType = {
    type: 'Processing',
    payload?: string;
}

export type CompletedActionType = {
    type: 'completed',
    payload?: {
        status: 'SUCCESS' | 'FAILED',
        message?: string
    }
}

export type ShowModalActionType<ModalName> = {
    type: 'showModal',
    payload: ModalName
}

export type HideModalActionType<ModalName> = {
    type: 'hideModal',
    payload: ModalName
}

export type BaseActionType<ModalName> = ProcessingActionType
    | CompletedActionType
    | ShowModalActionType<ModalName>
    | HideModalActionType<ModalName>

export const baseReducer = <ModalName, S extends StateType<ModalName | undefined>>(state: S, action: BaseActionType<ModalName>) => {

    switch (action.type) {
        case 'Processing':
            return { ...state, loading: true, serviceName: action.payload, response: undefined }
        case 'completed':
            return { ...state, loading: false, serviceName: undefined, response: action.payload }
        case 'showModal':


            return {
                ...state, modalVisibility: [
                    ...(state.modalVisibility || []).filter(it => it.modalName !== action.payload), {
                        modalName: action.payload,
                        visible: true
                    }
                ]
            }
        case 'hideModal':
            return {
                ...state, modalVisibility: [
                    ...(state.modalVisibility || []).filter(it => it.modalName !== action.payload), {
                        modalName: action.payload,
                        visible: false
                    }
                ]
            }
        default:
            return { ...state }

    }

}


export interface ModalController<T> {
    showModal: (modalName: T, loadInitialData?: (modalName: T) => Promise<void>) => Promise<void>,
    hideModal: (modalName: T) => void,
    isVisible: (modalName: T) => boolean
}

export const commmonActions = <ModalName, S extends StateType<ModalName | undefined>>(dispatch: Dispatch<BaseActionType<ModalName>>, state: S) => {

    return {
        processAction: () => processAction(dispatch),
        successAction: () => successAction(dispatch),
        failedAction: (message?: string) => failedAction(dispatch)(message),
        requestActions: (): RequestActions => {
            return {
                start: serviceName => processAction(dispatch, serviceName),
                end: (status, reason) => {
                    status == 'SUCCESS' && successAction(dispatch)
                    status == 'FAILED' && failedAction(dispatch)(reason)
                }
            }
        },


        showModalAction: (modalName: ModalName, loadInitialData?: (modalName: ModalName) => Promise<void>) => showModalAction(dispatch)(modalName, loadInitialData),
        hideModalAction: (modalName: ModalName) => hideModalAction(dispatch)(modalName),
        isVisible: (modalName: ModalName) => isVisble(state)(modalName),
        isLoading: (serviceName: string) => state.loading && state.serviceName == serviceName
    }
}


export interface SimpleRequestActions extends RequestActions {

}

export const simpleRequestActions = (): SimpleRequestActions => {
    const [request, setRequest] = useState<{ loading?: boolean, failed?: boolean, message?: string }>({})

    return {
        request: request,
        start: _ => setRequest({ loading: true }),
        end: (status, reason) => {
            status == 'SUCCESS' && setRequest({ loading: false, message: reason })
            status == 'FAILED' && setRequest({ loading: false, failed: true, message: reason })
        }
    }
}

export const successAction = <ModalName>(dispatch: Dispatch<BaseActionType<ModalName>>) => dispatch({ type: 'completed', payload: { status: 'SUCCESS' } })
export const failedAction = <ModalName>(dispatch: Dispatch<BaseActionType<ModalName>>) => (message?: string) => dispatch({ type: 'completed', payload: { status: 'FAILED', message: message } })
export const processAction = <ModalName>(dispatch: Dispatch<BaseActionType<ModalName>>, serviceName?: string) => dispatch({ type: 'Processing', payload: serviceName })

export const showModalAction = <ModalName>(dispatch: Dispatch<BaseActionType<ModalName>>) => async (modalName: ModalName, loadInitialData?: (modalName: ModalName) => Promise<void>) => {

    await loadInitialData?.(modalName)
    dispatch({ type: 'showModal', payload: modalName })
}
export const hideModalAction = <ModalName>(dispatch: Dispatch<BaseActionType<ModalName>>) => (modalName: ModalName) => dispatch({ type: 'hideModal', payload: modalName })
export const isVisble = <ModalName, S extends StateType<ModalName | undefined>>(state: S) => (modalName: ModalName) => {
    const modal = state.modalVisibility?.find(it => it.modalName == modalName)
    return modal && modal.visible
}

export interface StateType<ModalName> {
    id?: number;
    loading?: boolean;
    serviceName?: string;
    response?: {
        status: 'SUCCESS' | 'FAILED',
        message?: string
    }
    modalVisibility?: {
        modalName: ModalName;
        visible: boolean
    }[];
}
