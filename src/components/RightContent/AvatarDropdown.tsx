import { LogoutOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { history, useAccess, useModel } from '@umijs/max';
import { Avatar, Modal, Spin } from 'antd';
import { createStyles } from 'antd-style';
import type { MenuInfo } from 'rc-menu/lib/interface';
import React, { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import userIcon from '@/assets/user.png';
import HeaderDropdown from '../HeaderDropdown';
import { simpleRequestActions } from '@/services/model';
import { ProfileServices } from '@/services/profile';
import { getUploadFileObjectUrlV2 } from '@/services/apiGateway';
import styles from './index.less';
import { Space } from 'antd/lib';

export type GlobalHeaderRightProps = {
  menu?: boolean;
  children?: React.ReactNode;
};

export const AvatarName = () => {
  const { initialState } = useModel('@@initialState');
  const { currentUser } = initialState || {};
  const requestActions = simpleRequestActions();
  const [image, setImage] = useState<string>();
  const access = useAccess();
  useEffect(() => {

    ProfileServices.fetchBasicProfile
      .query(requestActions)
      .then((data) => {
        if (access.isRequesterRole && !data.hasPhone) {
          // Modal.confirm({
          //   title: 'User Profile',
          //   content: 'No phone contact available, Do you want to update profile?',
          //   onOk: () => {
          //     history.push('/profile');
          //   },
          // });
        }

        if (data.imageId) getUploadFileObjectUrlV2()(data.imageId).then((url) => setImage(url));
        else setImage(undefined);
      })
      .catch((_) => setImage(undefined));
  }, []);


  return <Space className="anticon">
    {image && <Avatar size="small" className={styles.avatar} src={image} alt="avatar" />}
    {!image && <Avatar size="small" className={styles.avatar} src={userIcon} alt="avatar" />}
    {[currentUser?.firstName, currentUser?.lastName].filter(it => it).join(" ") || currentUser?.login}
  </Space>;
};

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      display: 'flex',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      alignItems: 'center',
      padding: '0 8px',
      cursor: 'pointer',
      borderRadius: token.borderRadius,
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
  };
});

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu, children }) => {

  const { styles } = useStyles();

  const { initialState, setInitialState } = useModel('@@initialState');

  useEffect(() => {
    localStorage.setItem('sidebarEnabled', `${initialState?.settings?.layout === 'mix'}`);
  }, [initialState?.settings?.layout]);

  const onMenuClick = useCallback(
    (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        flushSync(() => {
          setInitialState((s) => ({ ...s, currentUser: undefined }));
        });
        initialState?.logout?.()
        return;
      }

      if (key === 'sidebar') {
        const isSidebarEnabled = localStorage.getItem('sidebarEnabled') ?? 'true' === 'true';
        console.log('isSidebarEnabled', isSidebarEnabled);
        localStorage.setItem('sidebarEnabled', `${!isSidebarEnabled}`);
        setInitialState((s) => ({ ...s, settings: { ...s?.settings, layout: s?.settings?.layout != 'mix' ? 'mix' : 'top' } }));
        return;
      }
      history.push(`/${key}/0/0`);
    },
    [setInitialState],
  );

  const loading = (
    <span className={styles.action}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.login) {
    return loading;
  }

  const menuItems = [{
    key: 'sidebar',
    icon: <MenuUnfoldOutlined />,
    label: initialState.settings?.layout === 'mix' ? 'Disable Sidebar Menu' : 'Enable Sidebar Menu',
  },
  ...(menu
    ? [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'User Profile',
      },
      {
        type: 'divider' as const,
      },
    ]
    : []),
  {
    key: 'logout',
    icon: <LogoutOutlined />,
    label: 'Logout',
  },
  ];

  return (
    <HeaderDropdown
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
    >
      {children}
    </HeaderDropdown>
  );
};
