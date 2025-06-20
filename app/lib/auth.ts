import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
    };
  }
  
  interface User {
    id: string;
    email: string;
    name?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    email: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For demo purposes, accept any email/password combination
        // In production, implement proper user authentication
        return {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.userId,
          email: token.email,
          name: session.user?.name,
        };
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Middleware to check if user is authenticated
export async function requireAuth(request: Request) {
  // For now, we'll implement a simple token check
  // In production, integrate with NextAuth getServerSession
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // For demo purposes, accept any non-empty token
  // In production, validate JWT properly
  if (token === 'demo-token') {
    return { id: '1', email: 'demo@example.com' };
  }

  return null;
} 