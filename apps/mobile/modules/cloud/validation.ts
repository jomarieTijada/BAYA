import type { CloudServices } from './services';
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizeCode = (value: string) => value.trim().toUpperCase();
export const emailError = (value: string) =>
  {
  if (!value.trim()) {
    return 'Enter your email address.';
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      return 'Enter a valid email address.';
    } else {
      return undefined;
    }
  }
};
export function authErrors(
  values: { name: string; email: string; password: string; confirm: string },
  register: boolean,
  policy: CloudServices['policy'],
) {
  return {
    name: (() => {
      if (register && !values.name.trim()) {
        return 'Enter your full name.';
      } else {
        return undefined;
      }
    })(),
    email: emailError(values.email),
    password: (() => {
      if (!values.password) {
        return 'Enter your password.';
      } else {
        if (register) {
          return policy.passwordError?.(values.password);
        } else {
          return undefined;
        }
      }
    })(),
    confirm:
      (() => {
        if (register && (!values.confirm || values.confirm !== values.password)) {
          return 'Passwords must match.';
        } else {
          return undefined;
        }
      })(),
  };
}
export const nameError = (value: string, policy: CloudServices['policy']) =>
  {
  if (!value.trim()) {
    return 'Enter a workspace name.';
  } else {
    return policy.workspaceNameError?.(value.trim());
  }
};
export const codeError = (value: string, policy: CloudServices['policy']) =>
  {
  if (!value.trim()) {
    return 'Enter the code from your mentor.';
  } else {
    if (/\s/.test(value.trim())) {
      return 'Check the code. It should not contain spaces.';
    } else {
      return policy.workspaceCodeError?.(normalizeCode(value));
    }
  }
};
