"use client";

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Search, Loader2, X, MessageCircle, Plus, LogOut, Car, Send, AlertCircle
} from 'lucide-react';

const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const WHATSAPP_NUMBER = "5491123456789";

// --- COMPONENTE BUSCADOR ---
const PersistentSearch = memo(({ onSearch }) => {
  const [val, setVal] = useState("");
  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    onSearch(v);
  };
  return (
    <div className="relative max-w-xl mx-auto md:mx-0">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
      <input
        type="text"
        placeholder="Buscá por marca o modelo..."
        className="w-full pl-14 pr-4 py-5 bg-slate-900 border border-white/10 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-orange-600 shadow-2xl"
        value={val}
        onChange={handleChange}
        autoComplete="off"
      />
    </div>
  );
});

export default function Page() {
  const [view, setView] = useState('marketplace');
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [newCar, setNewCar] = useState({ brand: '', model: '', year: '', price: '', km: '', image: '', status: 'Disponible' });
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // --- TRAER AUTOS ---
  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('cars').select('*');
      if (view === 'office' && user) query = query.eq('user_id', user.id);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error) setInventory(data || []);
      else setInventory([]);
    } catch {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [view, user]);

  // --- SESIÓN ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setView('marketplace');
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const filteredCars = useMemo(() => {
    const t = filter.toLowerCase().trim();
    return inventory.filter(c => c.brand?.toLowerCase().includes(t) || c.model?.toLowerCase().includes(t));
  }, [filter, inventory]);

  // --- AUTENTICACIÓN ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    const { error } = await supabase.auth.signInWithPassword(authData);
    if (error) {
      const signup = await supabase.auth.signUp(authData);
      if (signup.error) setStatusMsg({ text: signup.error.message, type: 'error' });
      else setStatusMsg({ text: 'Cuenta creada. Confirmá tu email.', type: 'success' });
    } else {
      setShowAuthModal(false);
      setAuthData({ email: '', password: '' });
    }
    setLoading(false);
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('cars').insert([{ ...newCar, user_id: user.id }]);
    if (error) setStatusMsg({ text: error.message, type: 'error' });
    else { setShowAddModal(false); fetchCars(); setNewCar({ brand: '', model: '', year: '', price: '', km: '', image: '', status: 'Disponible' }); }
    setLoading(false);
  };

  const openWhatsApp = (car) => {
    const msg = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) publicado por $${Number(car.price).toLocaleString()}.`;
    if (typeof window !== 'undefined') window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleFilterUpdate = useCallback((val) => setFilter(val), []);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-orange-600">
      <h1 className="text-3xl font-black p-6">HotCars</h1>
      {/* Acá puedes pegar tu JSX de marketplace, office, modales y filtros sin tocar la conexión Supabase */}
    </div>
  );
}
