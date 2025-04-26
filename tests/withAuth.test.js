import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import withAuth from '../components/withAuth';

// Mock the Firebase auth module
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}));

// Mock the Next.js router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// Mock the component to be wrapped
const TestComponent = () => <div>Test Component</div>;

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
      callback({ uid: '123' }); // Simulate authenticated user
      return vi.fn(); // Return unsubscribe function
    });

    const WrappedComponent = withAuth(TestComponent);
    render(<WrappedComponent />);

    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('should redirect to login if not authenticated', () => {
    // Mock unauthenticated user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // Simulate unauthenticated user
      return vi.fn(); // Return unsubscribe function
    });

    const WrappedComponent = withAuth(TestComponent);
    render(<WrappedComponent />);

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
    render(<WrappedComponent />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show error message if authentication check fails', () => {
    // Mock authentication error
    onAuthStateChanged.mockImplementation((auth, callback) => {
      try {
        throw new Error('Authentication failed');
      } catch (err) {
        callback(null); // Simulate error
      }
      return vi.fn(); // Return unsubscribe function
    });

    const WrappedComponent = withAuth(TestComponent);
    render(<WrappedComponent />);

    expect(screen.getByText('Error: Authentication failed')).toBeInTheDocument();
  });
});
