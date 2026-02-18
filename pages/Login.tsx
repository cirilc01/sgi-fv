import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { supabase } from '../App';

interface LoginProps {
  setCurrentUser: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ setCurrentUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // LOGIN
    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !data.user) {
      setError('Email ou senha inválidos');
      return;
    }

    const userId = data.user.id;

    // BUSCA PERFIL
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);

let profile = profiles?.[0] ?? null;

    // SE NÃO EXISTIR → CRIA
    if (profileError) {
  console.error(profileError);
  setError('Erro ao buscar perfil');
  return;
}

if (!profile) {
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert([{
      id: userId,
      email: data.user.email,
      role: 'user',
      nome_completo: data.user.user_metadata?.name ?? null, // se sua coluna existir
    }])
    .select('*');

  // Se falhar por duplicado, busca de novo (corrige race condition)
  if (insertError) {
    console.error(insertError);

    const { data: retryProfiles, error: retryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);

    if (retryError || !retryProfiles || retryProfiles.length === 0) {
      setError('Perfil do usuário não encontrado no sistema SGI.');
      return;
    }

    profile = retryProfiles[0];
  } else {
    profile = inserted?.[0] ?? null;
  }
}
    setCurrentUser(profile);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">

        <form onSubmit={handleLogin} className="space-y-6">

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-slate-700 rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-500 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-gray-900 border border-slate-700 rounded-lg text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-500"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
          >
            Entrar
          </button>

        </form>

        <div className="mt-6 text-center">
          <Link to="/register" className="text-slate-400">
            Criar conta
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
