import qs from 'qs';
import { request } from 'umi';
import { API } from './API';
import { WORKFLOW_API } from './ApiUrl';

export const KEYCLOAK_CLIENT_ID = 'mobile_app';
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

export async function fetchUser(params: { id: string }) {
  return request<API.HttpResponse<{}>>(`${WORKFLOW_API}/account/user/${params.id}/fetch`);
}

export async function query() {
  return request<API.CurrentUser[]>('/api/users');
}

export async function queryCurrent() {
  return request<API.CurrentUser>(`/api/account`);
}

export async function login(username: string, password: string) {
  let data = qs.stringify({
    client_id: 'mobile_app',
    username: username,
    password: password,
    scope: 'offline_access',
    grant_type: 'password',
  });

  return request<API.LoggedIn>(`/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: data,
  });
}

export async function queryNotices(): Promise<any> {
  return request<{ data: API.NoticeIconData[] }>('/api/notices');
}
