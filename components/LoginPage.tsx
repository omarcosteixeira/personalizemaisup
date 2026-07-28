
import React, { useState } from 'react';
import { auth, db } from '../services/firebaseService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Printer, Mail, Lock, LogIn, UserPlus, AlertCircle, Clock } from 'lucide-react';

interface Props {
  userStatus: 'GUEST' | 'PENDING' | 'EXPIRED' | 'APPROVED';
  onAuthChange: () => void;
}

const LoginPage: React.FC<Props> = ({ userStatus, onAuthChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const isAdmin = email === 'atelie.arianeartes@gmail.com';
        
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email,
          isAdmin,
          isApproved: isAdmin,
          createdAt: new Date().toISOString(),
          expiresAt: isAdmin ? 'NEVER' : null
        });
      }
      onAuthChange();
    } catch (err: any) {
      setError(err.message === 'Firebase: Error (auth/invalid-credential).' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  if (userStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-xl p-10 text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Acesso Pendente</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Seu cadastro foi realizado com sucesso! Agora, o administrador precisa liberar seu acesso.
          </p>
          <button onClick={() => signOut(auth).then(onAuthChange)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (userStatus === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] shadow-xl p-10 text-center space-y-6 border border-red-50">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Acesso Expirado</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Seu período de uso terminou. Entre em contato com o administrador para renovar sua assinatura.
          </p>
          <button onClick={() => signOut(auth).then(onAuthChange)} className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex p-4 bg-indigo-900 rounded-3xl text-white shadow-2xl mb-6">
            <Printer className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Personalize +</h1>
          <p className="text-slate-500 mt-2 font-medium">Seu sistema de gestão gráfica</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-center text-slate-800">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" required placeholder="Seu e-mail" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" required placeholder="Sua senha" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center animate-pulse">{error}</p>}

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isLogin ? <><LogIn className="w-5 h-5"/> ENTRAR</> : <><UserPlus className="w-5 h-5"/> CRIAR CONTA</>}
          </button>

          <p className="text-center text-sm text-slate-500 font-medium">
            {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="ml-2 text-indigo-600 font-bold hover:underline">
              {isLogin ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
