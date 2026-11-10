import React from 'react';

// These tests cover workspace navigation and callbacks; the live browser covers Ant Design rendering.
const Box = ({ children }: any) => <div>{children}</div>;
export const Typography = { Text: Box, Title: Box };
export const Space = Box;
export const Row = Box;
export const Col = Box;
export const Card = Box;
export const Tag = Box;
export const Tooltip = Box;
export const Divider = Box;
export const Progress = Box;
export const Statistic = Box;
export const Timeline = Box;
export const Alert = ({ message, description }: any) => <div>{message}{description}</div>;
export const Empty = Object.assign(({ description }: any) => <div>{description}</div>, { PRESENTED_IMAGE_SIMPLE: null });
export const Button = ({ children, onClick, disabled, ...props }: any) => <button disabled={disabled} onClick={onClick} aria-label={props['aria-label']}>{children}</button>;
export const Input = Object.assign(({ value, onChange, placeholder }: any) => <input readOnly={!onChange} value={value || ''} onChange={onChange} placeholder={placeholder} />, {
  TextArea: ({ value, onChange, placeholder }: any) => <textarea readOnly={!onChange} value={value || ''} onChange={onChange} placeholder={placeholder} />,
});
export const InputNumber = ({ value, onChange }: any) => <input type="number" readOnly={!onChange} value={value ?? ''} onChange={e => onChange?.(Number(e.target.value))} />;
export const Select = ({ value, onChange, options = [] }: any) => <select value={value} onChange={e => onChange?.(e.target.value)}>{options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
export const DatePicker = Object.assign(Box, { RangePicker: Box });
export const Form = Object.assign(Box, { Item: Box, useForm: () => [{ setFieldsValue: jest.fn(), validateFields: jest.fn().mockResolvedValue({}), resetFields: jest.fn() }] });
export const message = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
const leafColumns = (columns: any[]): any[] => columns.flatMap(column => column.children ? leafColumns(column.children) : [column]);
export const Table = ({ columns = [], dataSource = [], expandable }: any) => <table><tbody>{dataSource.map((r: any, i: number) => <React.Fragment key={i}>
  <tr>{leafColumns(columns).map((c: any, j: number) => <td key={j}>{c.render ? c.render(r[c.dataIndex], r, i) : r[c.dataIndex]}</td>)}</tr>
  {expandable?.defaultExpandAllRows && <tr><td colSpan={leafColumns(columns).length}>{expandable.expandedRowRender(r, i, 0, true)}</td></tr>}
</React.Fragment>)}</tbody></table>;
export const Modal = ({ open, title, children, footer, onCancel }: any) => open ? <div role="dialog"><button onClick={onCancel}>Close</button>{title}{children}{footer}</div> : null;
export const Drawer = Modal;
