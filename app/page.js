"use client";

import React, { useState, useMemo, memo, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  Loader2,
  X,
  AlertCircle,
  MessageCircle,
  Plus,
  LogOut,
  Car,
  Send,
} from "lucide-react";

// --- CONEXIÓN SUPABASE ---
const supabaseUrl = "https://xkwkgcjgxjvidiwthwbr.supabase.co";
const supabaseAnonKey =
  "sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- BUSCADOR GLOBAL ---
const GlobalSearch = memo(({ onSearch }) => {
  const [val, setVal] = useState("");

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);
    onSearch(v);
  };

  return (
    <div className="relative max-w-xl mx-auto md:mx-0">
      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"
        size={20}
      />
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
  const [view, setView] = useState("marketplace");
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("");
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const [authData, setAuthData] = useState({ email: "", password: "" });
  const [newCar, setNewCar] = useState({
    brand: "",
    model: "",
    year: "",
    price: "",
    km: "",
    image: "",
    status: "Disponible",
  });

  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const WHATSAPP_NUMBER = "5491123456789";

  // --- TRAER AUTOS ---
  const fetchCars = async () => {
    setLoading(true);
    try {
      let query = supabase.from("cars").select("*");

      if (view === "office" && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (!error) setInventory(data || []);
      else setInventory([]);
    } catch {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // --- SESIÓN ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session) setView("marketplace");
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchCars();
  }, [view, user]);

  const filteredCars = useMemo(() => {
    const t = filter.toLowerCase().trim();
    return inventory.filter(
      (c) =>
        c.brand?.toLowerCase().includes(t) ||
        c.model?.toLowerCase().includes(t)
    );
  }, [filter, inventory]);

  // --- AUTH ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: "", type: "" });

    const { error } = await supabase.auth.signInWithPassword(authData);

    if (error) {
      const signup = await supabase.auth.signUp(authData);
      if (signup.error)
        setStatusMsg({ text: signup.error.message, type: "error" });
      else
        setStatusMsg({
          text: "Cuenta creada. Confirmá tu mail.",
          type: "success",
        });
    } else {
      setShowAuthModal(false);
      setAuthData({ email: "", password: "" });
    }

    setLoading(false);
  };

  // --- AGREGAR AUTO ---
  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("cars").insert([
      {
        ...newCar,
        user_id: user.id,
      },
    ]);

    if (error) {
      setStatusMsg({ text: error.message, type: "error" });
    } else {
      setShowAddModal(false);
      fetchCars();
      setNewCar({
        brand: "",
        model: "",
        year: "",
        price: "",
        km: "",
        image: "",
        status: "Disponible",
      });
    }

    setLoading(false);
  };

  const openWhatsApp = (car) => {
    const msg = `¡Hola HotCars! Me interesa el ${car.brand} ${car.model} (${car.year}) por $${Number(
      car.price
    ).toLocaleString()}.`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
  };

  const handleFilterUpdate = useCallback((val) => {
    setFilter(val);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* 🔥 Tu JSX completo va acá (no lo cambié, solo ajusté lógica arriba) */}
    </div>
  );
}
