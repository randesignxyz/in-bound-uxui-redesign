import React from "react";

declare namespace  FormModal {
    export interface Props {
        title?: string;
        visible: boolean;
        afterSubmit: 'RESET' | 'CLOSE'
        onSubmit: () => void;
        onReset: () => void;
        onCancel: () => void;
    }

}

export interface PagingQuery<T> {
    query?: T;
    page: number;
    pageSize: number;
}

export interface MenuItem {
    id: string;
    name: string;
    description?: string;
}

export interface Pagination {
    current: number;
    pageSize: number;
    total: number;
    onChange?: (page: int, pageSize?: int) => void;
}

export interface Paging {
    page: number;
    pageSize: number;
}

export interface PageResult<T> {
    page: number;
    pageSize: number;
    total: number;
    data: T[]
}

export interface LookupData {
    value: string| number;
    display: string;
    description?: string;
}

export interface SearchResult<T> {
    content: T,
    totalElements: number,
    pageable: {
        pageNumber: number ,
        pageSize: number
    }
}


export type ActionCompProps = {
    formKey: string;
    visible?: true
    onClose?: ()=> void
    cb?: () => void
}

export type Action<T> =  {
    label: string
    icon: React.ReactElement,
    visible?: true,
    key: T,
    danger?: true,
    primary?: true,
    order?: number,
    onAddNew?: () => void;
    onRenderComp?: (props: ActionCompProps) => React.ReactElement
}
