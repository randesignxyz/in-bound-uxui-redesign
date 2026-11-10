const React = require('react');

global.React = React;

const { fireEvent, render, screen, waitFor } = require('@testing-library/react');

jest.mock('@/services/user', () => ({
  login: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');

  return {
    ...actual,
    message: {
      ...actual.message,
      error: jest.fn(),
    },
  };
});

jest.mock('@ant-design/pro-form', () => {
  const React = jest.requireActual('react');
  const MockLoginForm = ({ children, onFinish, title }) =>
    React.createElement(
      'form',
      {
        'aria-label': 'login-form',
        onSubmit: (event) => {
          event.preventDefault();

          const formData = new FormData(event.currentTarget);
          onFinish({
            username: formData.get('username'),
            password: formData.get('password'),
          });
        },
      },
      React.createElement('h1', null, title),
      children,
      React.createElement('button', { type: 'submit' }, 'Login'),
    );

  const MockProFormText = ({ name }) => React.createElement('input', { 'aria-label': name, name });
  MockProFormText.Password = ({ name }) =>
    React.createElement('input', { 'aria-label': name, name, type: 'password' });

  return {
    LoginForm: MockLoginForm,
    ProFormText: MockProFormText,
  };
});

const Login = require('@/pages/User/Login').default;
const { login } = require('@/services/user');
const { message } = require('antd');
const { jwtDecode } = require('jwt-decode');

const mockLogin = login;
const mockJwtDecode = jwtDecode;
const mockMessageError = message.error;

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the offline login form', () => {
    render(React.createElement(Login, { onLogin: jest.fn() }));

    expect(screen.getByText('Offline Login')).not.toBeNull();
    expect(screen.getByLabelText('username')).not.toBeNull();
    expect(screen.getByLabelText('password')).not.toBeNull();
  });

  it('calls onLogin when the user has queue dashboard permission', async () => {
    const onLogin = jest.fn();
    mockLogin.mockResolvedValue({ access_token: 'access-token' } as any);
    mockJwtDecode.mockReturnValue({
      realm_access: {
        roles: ['ROLE_QUEUE_DASHBOARD'],
      },
    } as any);

    render(React.createElement(Login, { onLogin }));

    fireEvent.change(screen.getByLabelText('username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('password'), { target: { value: 'secret' } });
    fireEvent.submit(screen.getByLabelText('login-form'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'secret');
      expect(onLogin).toHaveBeenCalledWith('access-token');
    });
  });

  it('shows no permission when login succeeds without the required role', async () => {
    mockLogin.mockResolvedValue({ access_token: 'access-token' } as any);
    mockJwtDecode.mockReturnValue({
      realm_access: {
        roles: ['OTHER_ROLE'],
      },
    } as any);

    render(React.createElement(Login, { onLogin: jest.fn() }));

    fireEvent.submit(screen.getByLabelText('login-form'));

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('No permission.');
    });
  });

  it('shows an error when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(React.createElement(Login, { onLogin: jest.fn() }));

    fireEvent.submit(screen.getByLabelText('login-form'));

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('Failed to longin.');
    });
  });
});
