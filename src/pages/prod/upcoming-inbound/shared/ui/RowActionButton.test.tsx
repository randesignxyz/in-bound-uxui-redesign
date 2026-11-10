jest.mock('antd', () => require('../../workspaces/test-support/antdMock'));
import React from 'react';
Object.assign(globalThis, { React });
import { fireEvent, render, screen } from '@testing-library/react';
import { RowActionButton } from './RowActionButton';

it('runs the action once without also opening the clickable row', () => {
  const rowClick = jest.fn();
  const action = jest.fn();
  render(<div onClick={rowClick}><RowActionButton onClick={action}>View Inspection</RowActionButton></div>);
  fireEvent.click(screen.getByRole('button', { name: 'View Inspection' }));
  expect(action).toHaveBeenCalledTimes(1);
  expect(rowClick).not.toHaveBeenCalled();
});

it('blocks actions while disabled or loading', () => {
  const action = jest.fn();
  const { rerender } = render(<RowActionButton onClick={action} disabled>Review & Post</RowActionButton>);
  fireEvent.click(screen.getByRole('button', { name: 'Review & Post' }));
  rerender(<RowActionButton onClick={action} loading>Review & Post</RowActionButton>);
  fireEvent.click(screen.getByRole('button', { name: 'Review & Post' }));
  expect(action).not.toHaveBeenCalled();
});
