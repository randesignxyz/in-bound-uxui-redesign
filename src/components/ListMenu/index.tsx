import React from 'react';
import { history } from "@umijs/max";
import { List, Card, Typography, Dropdown, MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import styles from './style.less';
import formLogo from '@/assets/icons8-form-80.png';

const { Paragraph } = Typography;

export interface ListMenuItem {
  visible?: boolean;
  id: string;
  name: string;
  description: string;
  link?: string;
  icon?: string; // Using string type for URLs
  // overlay?: React.ReactElement;
  menu?: MenuProps;
  onClick?: () => void;
}

const handleItemClick = (item: ListMenuItem) => {
  if (item.link) {
    history.push(item.link);
  } else if (item.onClick) {
    item.onClick();
  }
};

const renderTitle = (item: ListMenuItem, menu?: MenuProps) => {
  if (item.menu) {
    return (
      <Dropdown
        className={styles.itemTitle}
        menu={menu}
        // overlay={menu ? undefined : item.overlay}
        trigger={['hover']}
      >
        <a>
          {item.name} <DownOutlined />
        </a>
      </Dropdown>
    );
  }
  return <a className={styles.itemTitle}>{item.name}</a>;
};

interface ListMenuCompProps {
  items: ListMenuItem[];
}

const ListMenuComp: React.FC<ListMenuCompProps> = ({ items }) => {
  const filteredItems = items.filter(item => item.visible !== false);

  return (
    <div className={styles.formList}>
      <div className={styles.cardList}>
        <List<ListMenuItem>
          rowKey="id"
          grid={{ gutter: 16, lg: 3, md: 2, sm: 1, xs: 1, xl: 4, xxl: 4 }}
          dataSource={filteredItems}
          renderItem={item => (
            <List.Item
              onClick={(e: React.MouseEvent) => {
                const { className, offsetParent } = e.target as HTMLElement;
                if (
                  ['itemTitle'].some(cls => className.includes(cls) && (item.menu?.items?.length || 0) > 0)
                ) return;
                if (
                  ['cardMenu'].some(cls => offsetParent?.className?.includes(cls))
                ) handleItemClick(item);
              }}
            >
              <Card hoverable className={styles.cardMenu}>
                <Card.Meta
                  avatar={
                    <img
                      height="60px"
                      alt={item.name}
                      className={styles.cardAvatar}
                      src={item.icon || formLogo}
                    />
                  }
                  title={renderTitle(item, item.menu)}
                  description={
                    <Paragraph className={styles.item} ellipsis={{ rows: 3 }}>
                      {item.description}
                    </Paragraph>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default ListMenuComp;
