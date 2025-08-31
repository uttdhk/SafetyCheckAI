import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  padding: ${props => {
    switch (props.size) {
      case 'small': return '8px 16px';
      case 'large': return '16px 32px';
      default: return '12px 24px';
    }
  }};
  
  font-size: ${props => {
    switch (props.size) {
      case 'small': return '14px';
      case 'large': return '18px';
      default: return '16px';
    }
  }};
  
  font-weight: 600;
  border-radius: ${props => props.theme.borderRadius};
  cursor: pointer;
  transition: all ${props => props.theme.transition};
  border: 2px solid transparent;
  
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return props.theme.colors.primary;
      case 'secondary': return props.theme.colors.secondary;
      case 'outline': return 'transparent';
      case 'text': return 'transparent';
      default: return props.theme.colors.surface;
    }
  }};
  
  color: ${props => {
    switch (props.variant) {
      case 'primary':
      case 'secondary': return 'white';
      case 'outline': return props.theme.colors.primary;
      case 'text': return props.theme.colors.primary;
      default: return props.theme.colors.text.primary;
    }
  }};
  
  border-color: ${props => {
    switch (props.variant) {
      case 'outline': return props.theme.colors.primary;
      default: return 'transparent';
    }
  }};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.medium};
    
    background-color: ${props => {
      switch (props.variant) {
        case 'primary': return props.theme.colors.primaryDark;
        case 'outline': return props.theme.colors.primary;
        case 'text': return props.theme.colors.primary + '10';
        default: return props.theme.colors.background;
      }
    }};
    
    color: ${props => {
      switch (props.variant) {
        case 'outline': return 'white';
        default: return props.color;
      }
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Button = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};

export default Button;