import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthConsole } from '../src/components/dashboard/HealthConsole';

describe('HealthConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all health metrics', () => {
    render(<HealthConsole />);
    
    expect(screen.getByText(/System Health/i)).toBeInTheDocument();
    expect(screen.getByText(/API Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Response Latency/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Quality Score/i)).toBeInTheDocument();
  });

  it('should display overall health status', () => {
    render(<HealthConsole />);
    
    expect(screen.getByText(/Healthy · 8\/8 Systems/i)).toBeInTheDocument();
  });

  it('should show performance timeline with bars', () => {
    render(<HealthConsole />);
    
    expect(screen.getByText(/API Latency/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Quality Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Error Rate/i)).toBeInTheDocument();
  });

  it('should display system info section', () => {
    render(<HealthConsole />);
    
    expect(screen.getByText(/Strategy Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/Granite v1.2/i)).toBeInTheDocument();
    expect(screen.getByText(/Live/i)).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked', async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();
    
    render(<HealthConsole onRefresh={onRefresh} />);
    
    const refreshButton = screen.getByRole('button');
    await user.click(refreshButton);
    
    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it('should have rotating animation on refresh button during loading', async () => {
    const user = userEvent.setup();
    const { container } = render(<HealthConsole />);
    
    const refreshButton = screen.getByRole('button');
    await user.click(refreshButton);
    
    // Check if animation class is applied
    const icon = container.querySelector('svg');
    expect(icon?.parentElement?.className).toContain('animate-spin');
  });
});
