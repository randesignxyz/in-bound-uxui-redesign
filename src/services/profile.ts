import { fetchDataItemService } from '@/services/apiGateway';

export interface BasicProfileData {
  id?: number;
  hasPhone?: boolean;
  imageId?: string;
  [key: string]: any;
}

export const ProfileServices = {
  fetchBasicProfile: fetchDataItemService<BasicProfileData>({
    actionName: 'fetch-basic-info',
    endpoint: 'HR',
  }),
};
