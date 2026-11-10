import { PageContainer } from '@ant-design/pro-components';
import React from 'react'
import { useParams, history } from "@umijs/max";

export type ViewType = 'list' | 'create' | 'detail' | 'edit' | 'view' | undefined;

interface Props {
    baseURL?: string;
    title?: string;
    onBack?: () => void;
    disablePageContainer?: true
    children?: (
        viewType: ViewType,
        id?: number | string,
        navigate?: {
            goToDetail?: (data: { id: number | string }) => void;
            gotToListHandler?: () => void;
            goToCreate?: (data?: { id?: number | string }) => void;
            gotoEdit?: (data: { id: number | string }) => void;
        }
    ) => React.ReactNode;
}


const CrudWrapper: React.FC<Props> = ({ baseURL, onBack, children, title, disablePageContainer }) => {
    const params = useParams()

    const view: ViewType = (params['view'] as ViewType) || undefined

    // console.log(view);

    const id = params['*']

    const onGoToDetailHandler = (data: { id: number | string }) => {
        baseURL && history.push(`${baseURL}/detail/${data.id}`)
    }
    const onGoToListHandler = () => {
        baseURL && history.push(`${baseURL}/list`)
    }

    const onGotoCreateHandler = (data?: { id?: number | string }) => {
        if (data && (data.id || data.id == 0)) {
            baseURL && history.push(`${baseURL}/create/${data.id}`)
        } else {
            baseURL && history.push(`${baseURL}/create`)
        }
    }

    const onGoToEditHandler = (data: { id: number | string }) => {
        baseURL && history.push(`${baseURL}/edit/${data.id}`)
    }

    const content = view == undefined ? <div>Not implemented</div> : children?.(
        view,
        id,
        {
            goToCreate: onGotoCreateHandler,
            goToDetail: onGoToDetailHandler,
            gotToListHandler: onGoToListHandler,
            gotoEdit: onGoToEditHandler
        }
    )

    return disablePageContainer ? <>{content}</> : <PageContainer onBack={onBack} title={title ? title : false}>
        {content}
    </PageContainer>

}

export default CrudWrapper