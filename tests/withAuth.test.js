import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import withAuth from '../components/withAuth';

// Mock the Firebase auth module
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
}));

// Mock the Next.js router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// Mock the component to be wrapped
// Avoid JSX here to keep Vitest/Vite parsing happy for .js test files.
const TestComponent = () => React.createElement('div', null, 'Test Component');

describe('withAuth HOC', () => {
  let mockRouterPush;

  beforeEach(() => {
    mockRouterPush = vi.fn();
    useRouter.mockImplementation(() => ({
      push: mockRouterPush,
      asPath: '/protected',
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component if authenticated', () => {
    // Mock authenticated user
    onAuthStateChanged.mockImplementation((auth, callback) => {
	  callback({ uid: '123', emailVerified: true }); // Simulate authenticated + verified user
      return vi.fn(); // Return unsubscribe function
    });

    const WrappedComponent = withAuth(TestComponent);
	    render(React.createElement(WrappedComponent));

    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('should redirect to verify email if authenticated but not verified', () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: '123', emailVerified: false });
      return vi.fn();
    });

    const WrappedComponent = withAuth(TestComponent);
	    render(React.createElement(WrappedComponent));

    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(mockRouterPush).toHaveBeenCalledWith('/verify_email');
  });

  it('should redirect to login if not authenticated', () => {
    // Mock unauthenticated user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // Simulate unauthenticated user
      return vi.fn(); // Return unsubscribe function
    });

    const WrappedComponent = withAuth(TestComponent);
	    render(React.createElement(WrappedComponent));

    expect(screen.queryByText('Test Component')).not.toBeInTheDocument();
    expect(mockRouterPush).toHaveBeenCalledWith('/login?redirectTo=%2Fprotected');
  });

  it('should show loading state while checking authentication', () => {
    // Mock delayed authentication check
    onAuthStateChanged.mockImplementation((auth, callback) => {
      setTimeout(() => callback({ uid: '123' }), 1000); // Simulate delay
      return vi.fn(); // Return unsubscribe function
    });

    const WrappedComponent = withAuth(TestComponent);
	    render(React.createElement(WrappedComponent));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show error message if authentication check fails', async () => {
    // Simulate a failure while redirecting
    mockRouterPush.mockImplementation(() => Promise.reject(new Error('Authentication failed')));
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // unauthenticated triggers redirect
      return vi.fn();
    });

    const WrappedComponent = withAuth(TestComponent);
	    render(React.createElement(WrappedComponent));

    expect(await screen.findByText('Error: Authentication failed')).toBeInTheDocument();
  });
});
