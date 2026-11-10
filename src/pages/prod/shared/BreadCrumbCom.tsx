import { Link } from '@umijs/max';
import { Breadcrumb, Typography } from 'antd';

type RouteParam = {
  label: string;
  path: string;
};

interface Props {
  separator: '/' | '>';
  routes: RouteParam[];
}

export default function BreadCrumbCom({ separator, routes }: Props) {
  const { Text } = Typography;

  return (
    <Breadcrumb separator={separator}>
      {routes.map((item, index) => {
        const isLast = index === routes.length - 1;
        return (
          <Breadcrumb.Item key={`${item.path}-${item.label}-${index}`}>
            {isLast || !item.path ? <Text>{item.label}</Text> : <Link to={item.path}>{item.label}</Link>}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
