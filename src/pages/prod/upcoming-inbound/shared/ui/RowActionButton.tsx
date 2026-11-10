import React from 'react';
import { Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import './RowActionButton.less';

export const rowActionColumn = { title: 'Action', key: 'action', width: 160, align: 'left' as const };

type RowActionButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
};

/** One table-action contract for every role. Styling stays here, not in callers. */
export function RowActionButton({
  children, variant = 'secondary', icon = <EyeOutlined />, onClick,
  disabled = false, loading = false, 'aria-label': ariaLabel,
}: RowActionButtonProps) {
  return <Button
    htmlType="button"
    size="small"
    type={variant === 'primary' ? 'primary' : 'text'}
    danger={variant === 'danger'}
    className={`inbound-row-action inbound-row-action--${variant}`}
    icon={icon}
    disabled={disabled}
    loading={loading}
    aria-label={ariaLabel}
    onClick={event => {
      event.stopPropagation();
      if (!disabled && !loading) onClick(event);
    }}
  >{children}</Button>;
}
