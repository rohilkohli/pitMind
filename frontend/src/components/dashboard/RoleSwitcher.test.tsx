import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleSwitcher } from '../src/components/dashboard/RoleSwitcher';

describe('RoleSwitcher', () => {
  const mockOnRoleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render current role button', () => {
    render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    expect(screen.getByText(/Engineer/)).toBeInTheDocument();
  });

  it('should open dropdown menu on button click', async () => {
    const user = userEvent.setup();
    render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Strategist/)).toBeInTheDocument();
      expect(screen.getByText(/Commentator/)).toBeInTheDocument();
    });
  });

  it('should display all three roles in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Engineer/)).toBeInTheDocument();
      expect(screen.getByText(/Strategist/)).toBeInTheDocument();
      expect(screen.getByText(/Commentator/)).toBeInTheDocument();
    });
  });

  it('should show role descriptions in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Pit wall strategy/)).toBeInTheDocument();
      expect(screen.getByText(/Long-term race planning/)).toBeInTheDocument();
      expect(screen.getByText(/Race narrative/)).toBeInTheDocument();
    });
  });

  it('should call onRoleChange when role is selected', async () => {
    const user = userEvent.setup();
    render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const strategistOption = await screen.findByText(/Strategist/);
    const strategistButton = strategistOption.closest('button');
    
    await user.click(strategistButton!);
    
    expect(mockOnRoleChange).toHaveBeenCalledWith('strategist');
  });

  it('should close dropdown after role selection', async () => {
    const user = userEvent.setup();
    render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const strategistOption = await screen.findByText(/Strategist/);
    const strategistButton = strategistOption.closest('button');
    await user.click(strategistButton!);
    
    await waitFor(() => {
      // Check that dropdown description is no longer visible
      expect(screen.queryByText(/Long-term race planning/)).not.toBeInTheDocument();
    });
  });

  it('should highlight current role with pit-accent border', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RoleSwitcher currentRole="engineer" onRoleChange={mockOnRoleChange} />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      const engineerRole = screen.getByText('Engineer').closest('button');
      expect(engineerRole?.className).toContain('border-pit-accent');
    });
  });
});
