import { DefaultFooter } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import React from 'react';

const Footer: React.FC = () => {
  const intl = useIntl();
  const defaultMessage = intl.formatMessage({
    id: 'app.copyright.produced',
    defaultMessage: 'Powered By ICT, OFL',
  });
  const currentYear = new Date().getFullYear();

  return (
    <DefaultFooter 

      style={{
        background: 'none',
        fontWeight: 'lighter'
      }}
      copyright={`${currentYear} ${defaultMessage}`}
      links={undefined}
    />
  );
};

export default Footer;
