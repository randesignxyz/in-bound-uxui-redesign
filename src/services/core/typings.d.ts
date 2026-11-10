declare namespace API {

    type TokenInfo = {
        logout: () => void;
    }

    type CurrentUser = {
        avatar?: string;
        name?: string;
        login?: string;
        firstName?: string;
        lastName?: string;
        title?: string;
        email?: string;
        group?: string;
        signature?: string;
        tags?: {
            key: string;
            label: string;
        }[];
        userId?: string;
        access?: 'user' | 'guest' | 'admin';
        authorities: []
        unreadCount?: number;
        groupAttributeMap?:any
        employeeInfo?: {
            id: number
            department: string
            firstName: string
            internalName: string
            jobTitle: string
            lastName: string
            reportTo: string
            hod: string
        }
    }

}
