jest.mock('antd', () => require('../../workspaces/test-support/antdMock'));
import React from 'react';
Object.assign(globalThis, { React });
Object.assign(globalThis, { TextEncoder: require('util').TextEncoder, TextDecoder: require('util').TextDecoder });
import { fireEvent, render, screen } from '@testing-library/react';
import { ExportButton } from './WorkspaceUI';
import { exportWorkspace } from './workspaceExport';

it('opens an Export menu and sends the selected format', () => {
  const onExport = jest.fn();
  render(<ExportButton onExport={onExport} />);
  fireEvent.click(screen.getByRole('button', { name: 'Export' }));
  expect(screen.getByRole('menu', { name: 'Export format' })).toBeTruthy();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Excel' }));
  expect(onExport).toHaveBeenCalledWith('excel');
  expect(screen.queryByRole('menu')).toBeNull();
});

it.each([
  ['csv', 'text/csv;charset=utf-8;', '.csv'],
  ['excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
  ['pdf', 'application/pdf', '.pdf'],
] as const)('downloads a %s file with the correct format', async (format, mime, extension) => {
  const createUrl = jest.fn((_blob: Blob) => 'blob:export');
  const oldCreate = URL.createObjectURL;
  URL.createObjectURL = createUrl;
  const downloads: string[] = [];
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloads.push(this.download);
  });
  try {
    exportWorkspace('test-export', [['Name', 'Qty'], ['Item', 2]], format);
    expect(createUrl.mock.calls[0][0].type).toBe(mime);
    expect(click).toHaveBeenCalledTimes(1);
    expect(downloads).toEqual([`test-export${extension}`]);
    const reader = new FileReader();
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(createUrl.mock.calls[0][0]);
    });
    if (format === 'pdf') expect(String.fromCharCode(...bytes.slice(0, 8))).toBe('%PDF-1.4');
    if (format === 'excel') expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('PK\u0003\u0004');
    if (format === 'csv') expect(new TextDecoder().decode(bytes)).toContain('"Item","2"');
  } finally {
    URL.createObjectURL = oldCreate;
    click.mockRestore();
  }
});

it('renders non-Latin PDF text through the browser canvas', async () => {
  const context = { fillRect: jest.fn(), fillText: jest.fn(), measureText: (text: string) => ({ width: text.length * 8 }) };
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as any);
  const toDataURL = jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,/9j/2Q==');
  const createUrl = jest.fn((_blob: Blob) => 'blob:export');
  const oldCreate = URL.createObjectURL;
  URL.createObjectURL = createUrl;
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  try {
    exportWorkspace('test-export', [['Vendor'], ['ក្រុមហ៊ុន']], 'pdf');
    expect(context.fillText).toHaveBeenCalledWith('Vendor: ក្រុមហ៊ុន', expect.any(Number), expect.any(Number), expect.any(Number));
    const reader = new FileReader();
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(createUrl.mock.calls[0][0]);
    });
    expect(new TextDecoder('latin1').decode(bytes)).toContain('/DCTDecode');
  } finally {
    getContext.mockRestore();
    toDataURL.mockRestore();
    URL.createObjectURL = oldCreate;
    click.mockRestore();
  }
});
