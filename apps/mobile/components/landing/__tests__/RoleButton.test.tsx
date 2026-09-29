import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { RoleButton } from '../RoleButton';
import { Colors } from '../../../constants/theme';

describe('RoleButton (White-Box Suite)', () => {
  const defaultProps = {
    label: 'Learner',
    accessibilityLabel: 'Choose Learner Role',
    variant: 'primary' as const,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Traverses up to <Pressable> to evaluate dynamic ({ pressed }) style function
  const getPressableStyle = (element: any, pressed = false) => {
    let current = element;
    while (current) {
      if (typeof current.props?.style === 'function') {
        return StyleSheet.flatten(current.props.style({ pressed }));
      }
      current = current.parent;
    }
    return StyleSheet.flatten(element.props.style);
  };

  const getTextStyle = (element: any) => StyleSheet.flatten(element.props.style);

  // --- BRANCH 1: Default Primary & Regular Size ---
  it('Branch: renders primary regular button with defaults', () => {
    render(<RoleButton {...defaultProps} />);

    const button = screen.getByRole('button', { name: 'Choose Learner Role' });
    const label = screen.getByText('Learner');

    expect(button).toBeTruthy();
    expect(button.props.accessibilityState).toEqual({ disabled: false });

    // Regular size & primary colors
    const buttonStyle = getPressableStyle(button);
    expect(buttonStyle.minHeight).toBe(76);
    expect(buttonStyle.backgroundColor).toBe(Colors.rolePrimary);

    const labelStyle = getTextStyle(label);
    expect(labelStyle.fontSize).toBe(26);
    expect(labelStyle.color).toBe(Colors.surface);

    // Fires onPress
    fireEvent.press(button);
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  // --- BRANCH 2: Secondary & Compact Variant ---
  it('Branch: renders secondary compact button', () => {
    render(<RoleButton {...defaultProps} variant="secondary" compact={true} />);

    const button = screen.getByRole('button');
    const label = screen.getByText('Learner');

    const buttonStyle = getPressableStyle(button);
    expect(buttonStyle.minHeight).toBe(52);
    expect(buttonStyle.borderWidth).toBe(3);
    expect(buttonStyle.backgroundColor).toBe(Colors.surface);

    const labelStyle = getTextStyle(label);
    expect(labelStyle.fontSize).toBe(18);
    expect(labelStyle.color).toBe(Colors.rolePrimary);
  });

  // --- BRANCH 3: Hover In & Hover Out (Primary and Secondary) ---
  it('Branch: handles hover state for primary and secondary variants', () => {
    const { rerender } = render(<RoleButton {...defaultProps} variant="primary" />);
    let button = screen.getByRole('button');

    // Hover in (primary)
    fireEvent(button, 'hoverIn');
    expect(getPressableStyle(button).backgroundColor).toBe(Colors.rolePrimaryHover);

    // Hover out (primary)
    fireEvent(button, 'hoverOut');
    expect(getPressableStyle(button).backgroundColor).toBe(Colors.rolePrimary);

    // Hover in (secondary)
    rerender(<RoleButton {...defaultProps} variant="secondary" />);
    button = screen.getByRole('button');
    fireEvent(button, 'hoverIn');
    expect(getPressableStyle(button).backgroundColor).toBe(Colors.roleSecondaryHover);
  });

  // --- BRANCH 4: Focus and Blur ---
  it('Branch: handles focus and blur events', () => {
    render(<RoleButton {...defaultProps} />);
    const button = screen.getByRole('button');

    fireEvent(button, 'focus');
    expect(getPressableStyle(button).borderColor).toBe(Colors.focus);

    fireEvent(button, 'blur');
    expect(getPressableStyle(button).borderColor).toBe(Colors.rolePrimary);
  });

  // --- BRANCH 5: Pressed Dynamic Styles ---
  it('Branch: applies pressed transform and background styles', () => {
    const { rerender } = render(<RoleButton {...defaultProps} variant="primary" />);
    let button = screen.getByRole('button');

    // Primary pressed
    const primaryPressedStyle = getPressableStyle(button, true);
    expect(primaryPressedStyle.backgroundColor).toBe(Colors.rolePrimaryPressed);
    expect(primaryPressedStyle.transform).toEqual([{ scale: 0.99 }]);

    // Secondary pressed
    rerender(<RoleButton {...defaultProps} variant="secondary" />);
    button = screen.getByRole('button');
    const secondaryPressedStyle = getPressableStyle(button, true);
    expect(secondaryPressedStyle.backgroundColor).toBe(Colors.roleSecondaryHover);
    expect(secondaryPressedStyle.transform).toEqual([{ scale: 0.99 }]);
  });

  // --- BRANCH 6: Disabled State and Guard Clauses ---
  it('Branch: enforces disabled styles and suppresses hover/pressed overrides', () => {
    render(<RoleButton {...defaultProps} disabled={true} />);

    const button = screen.getByRole('button');
    const label = screen.getByText('Learner');

    expect(button.props.accessibilityState).toEqual({ disabled: true });

    // Disabled base styles
    const buttonStyle = getPressableStyle(button);
    expect(buttonStyle.backgroundColor).toBe(Colors.disabled);
    expect(buttonStyle.opacity).toBe(0.72);

    const labelStyle = getTextStyle(label);
    expect(labelStyle.color).toBe(Colors.surface);

    // Guard check: pressed=true must NOT override disabled style
    const suppressedStyle = getPressableStyle(button, true);
    expect(suppressedStyle.backgroundColor).toBe(Colors.disabled);
  });
});