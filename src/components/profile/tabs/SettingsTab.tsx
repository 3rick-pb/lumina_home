"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  User as UserIcon, 
  KeyRound, 
  Crown, 
  Mail, 
  Loader2, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Trash2, 
  MapPin, 
  Check, 
  Star, 
  Navigation 
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUserStore, clearAdminCache, syncAddressesToCloud } from "@/lib/userStore";
import { supabase } from "@/lib/supabase";
import { CloudSyncStatus } from "../CloudSyncStatus";

interface SettingsTabProps {
  isAdmin: boolean;
  isRootAdmin: boolean;
  showAddressForm: boolean;
  setShowAddressForm: (show: boolean) => void;
}

export function SettingsTab({
  isAdmin,
  showAddressForm,
  setShowAddressForm
}: SettingsTabProps) {
  const { 
    user, 
    addresses, 
    addAddress, 
    removeAddress, 
    setDefaultAddress,
    updateUserName,
    updateUserPassword 
  } = useUserStore();

  // Settings State
  const [editName, setEditName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [invitedAdmins, setInvitedAdmins] = useState<string[]>([]);
  const [adminInviteInput, setAdminInviteInput] = useState("");
  const [isSyncingAdmins, setIsSyncingAdmins] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [settingsFeedback, setSettingsFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isSyncingAddresses, setIsSyncingAddresses] = useState(false);
  const [syncAddressError, setSyncAddressError] = useState<string | null>(null);

  const handleSyncAddresses = async () => {
    setIsSyncingAddresses(true);
    setSyncAddressError(null);
    try {
      const active = addresses.find(a => a.isDefault) || addresses[0] || null;
      await syncAddressesToCloud(user?.id, addresses, active);
    } catch {
      setSyncAddressError("Error al sincronizar direcciones");
    } finally {
      setIsSyncingAddresses(false);
    }
  };

  // Address form fields
  const [recipient, setRecipient] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("España");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const isMasterAdmin = (user?.email || '').toLowerCase().trim() === 'admin@lumina.com';

  useEffect(() => {
    if (user?.name) setEditName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (isAdmin && isMasterAdmin) {
      fetchInvitedAdmins();
    }
  }, [isAdmin, isMasterAdmin]);

  const fetchInvitedAdmins = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/invitations', { 
        cache: 'no-store',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.invitedAdmins)) {
          const filtered = data.invitedAdmins
            .map((e: string) => String(e).toLowerCase().trim())
            .filter((e: string) => Boolean(e) && e !== 'admin@lumina.com');
          setInvitedAdmins(filtered);
          return;
        }
      }
    } catch {
      // Non-critical fallback
    }

    try {
      const { data: sysRow } = await supabase
        .from('active_sessions')
        .select('email')
        .eq('user_id', 'SYS_ADMIN_INVITES')
        .maybeSingle();

      if (sysRow?.email) {
        try {
          const parsed = JSON.parse(sysRow.email);
          if (Array.isArray(parsed)) {
            const filtered = parsed
              .map((e: string) => String(e).toLowerCase().trim())
              .filter((e: string) => Boolean(e) && e !== 'admin@lumina.com');
            setInvitedAdmins(filtered);
            return;
          }
        } catch {}
      }
    } catch {}
  };

  const handleAddAdminInvite = async (emailsToAdd?: string) => {
    const raw = (emailsToAdd !== undefined ? emailsToAdd : adminInviteInput).trim().toLowerCase();
    if (!raw) return;

    setInviteError(null);
    setInviteSuccess(null);
    setIsSyncingAdmins(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'add',
          emails: raw,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al agregar administradores.');
      }
      const filtered = Array.isArray(data.invitedAdmins)
        ? data.invitedAdmins
            .map((e: string) => String(e).toLowerCase().trim())
            .filter((e: string) => Boolean(e) && e !== 'admin@lumina.com')
        : [];
      setInvitedAdmins(filtered);
      clearAdminCache();
      setAdminInviteInput("");
      setInviteSuccess(data.message || '¡Administrador(es) agregados con éxito!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la invitación.';
      setInviteError(msg);
    } finally {
      setIsSyncingAdmins(false);
    }
  };

  const handleRemoveAdminInvite = async (targetEmail: string) => {
    setInviteError(null);
    setInviteSuccess(null);
    setIsSyncingAdmins(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'remove',
          email: targetEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al revocar administrador.');
      }
      const filtered = Array.isArray(data.invitedAdmins)
        ? data.invitedAdmins
            .map((e: string) => String(e).toLowerCase().trim())
            .filter((e: string) => Boolean(e) && e !== 'admin@lumina.com')
        : [];
      setInvitedAdmins(filtered);
      clearAdminCache();
      setInviteSuccess(`Administrador "${targetEmail}" revocado correctamente.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al revocar la invitación.';
      setInviteError(msg);
    } finally {
      setIsSyncingAdmins(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    setSettingsFeedback(null);

    try {
      if (editName.trim() && editName.trim() !== user?.name) {
        await updateUserName(editName.trim());
      }
      if (newPass.trim()) {
        if (newPass.length < 6) {
          throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
        }
        await updateUserPassword(newPass.trim());
        setNewPass("");
      }
      setSettingsFeedback({ msg: "Ajustes guardados correctamente.", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar perfil.";
      setSettingsFeedback({ msg, type: "error" });
    } finally {
      setIsUpdatingSettings(false);
      setTimeout(() => setSettingsFeedback(null), 4000);
    }
  };

  const applyResolvedLocation = (data: {
    data?: { street?: string; city?: string; state?: string; postalCode?: string; country?: string };
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    source?: string;
  }) => {
    const resolvedStreet = data.data?.street || data.street || "";
    const resolvedCity = data.data?.city || data.city || "";
    const resolvedState = data.data?.state || data.state || "";
    const resolvedPostal = data.data?.postalCode || data.postalCode || "";
    const resolvedCountry = data.data?.country || data.country || "Ecuador";

    if (resolvedStreet) setStreet(resolvedStreet);
    if (resolvedCity) setCity(resolvedCity);
    if (resolvedState) setStateProv(resolvedState);
    if (resolvedPostal) setPostalCode(resolvedPostal);
    if (resolvedCountry) setCountry(resolvedCountry);
    setLocationSuccess(true);
    setLocationError(null);
  };

  const fetchIpLocationFallback = async () => {
    try {
      const res = await fetch("/api/geocode?fallback=ip");
      if (!res.ok) throw new Error("Fallback por red no disponible");
      const data = await res.json();
      if (data.success) {
        applyResolvedLocation(data);
        return true;
      }
    } catch {}
    return false;
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    setLocationSuccess(false);

    if (typeof window === "undefined" || !navigator.geolocation) {
      // Direct IP fallback
      fetchIpLocationFallback().finally(() => setIsDetectingLocation(false));
      return;
    }

    let handled = false;
    const timeoutId = setTimeout(async () => {
      if (!handled) {
        handled = true;
        await fetchIpLocationFallback();
        setIsDetectingLocation(false);
      }
    }, 4500);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (handled) return;
        handled = true;
        clearTimeout(timeoutId);
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error("Error en resolución");
          const data = await res.json();
          if (data.success) {
            applyResolvedLocation(data);
          } else {
            await fetchIpLocationFallback();
          }
        } catch {
          await fetchIpLocationFallback();
        } finally {
          setIsDetectingLocation(false);
        }
      },
      async () => {
        if (handled) return;
        handled = true;
        clearTimeout(timeoutId);
        const ok = await fetchIpLocationFallback();
        if (!ok) {
          setLocationError("No se pudo detectar la ubicación. Por favor, ingresa los datos manualmente.");
        }
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 120000 }
    );
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !city.trim() || !postalCode.trim() || !stateProv.trim() || !country.trim()) return;
    if (addresses.length >= 4) {
      alert("Has alcanzado el límite máximo de 4 direcciones.");
      return;
    }
    await addAddress({
      recipient: recipient.trim() || user?.name || "Destinatario",
      street: street.trim(),
      city: city.trim(),
      state: stateProv.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefault: addresses.length === 0,
    });
    setRecipient("");
    setStreet("");
    setCity("");
    setStateProv("");
    setPostalCode("");
    setCountry("España");
    setLocationError(null);
    setLocationSuccess(false);
    setShowAddressForm(false);
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Account & Credentials (7 cols) */}
      <div className="lg:col-span-7 bg-white/90 dark:bg-[#202022]/5 backdrop-blur-3xl p-8 md:p-10 rounded-[3rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-10 relative overflow-hidden">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#8c9276]" /> Ajustes de Cuenta & Sistema
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza tu experiencia, apariencia visual y seguridad de acceso.</p>
        </div>

        {settingsFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold text-center border ${
            settingsFeedback.type === "success" 
              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-100 dark:border-emerald-500/30" 
              : "bg-red-50 dark:bg-red-500/20 text-red-800 dark:text-red-200 border-red-100 dark:border-red-500/30"
          }`}>
            {settingsFeedback.msg}
          </div>
        )}

        {/* Theme & Appearance */}
        <div className="p-6 rounded-[2rem] bg-gray-50/5 dark:bg-black/20 border border-gray-100 dark:border-white/5 relative z-10">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Apariencia del Sistema</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Elige el modo visual. El modo automático usará una elegante paleta oscura a partir de las 18:00h para proteger tu vista.</p>
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nombre Completo</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input 
                type="text" 
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Correo Electrónico (No editable)</label>
            <input 
              type="email" 
              readOnly 
              value={user.email}
              className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm cursor-not-allowed bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nueva Contraseña (Opcional)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input 
                type="password" 
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Escribe al menos 6 caracteres para cambiarla"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c9276] transition-all bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
              {!isMasterAdmin ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3 shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="font-semibold text-xs tracking-wide leading-relaxed">
                    Su cuenta ha sido otorgada con acceso de administrador.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-[#2a2a2c]/80 dark:to-[#222224]/80 border border-gray-200/80 dark:border-white/10 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Crown className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          Gestión de Administradores Extras
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Otorga acceso de administrador ingresando correos separados por comas (máximo 3 cupos adicionales).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full py-1 px-4 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {invitedAdmins.length} de 3 cupos utilizados
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={adminInviteInput}
                          onChange={e => setAdminInviteInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAdminInvite();
                            }
                          }}
                          placeholder="correo1@amigo.com, correo2@amigo.com (separados por coma)"
                          disabled={invitedAdmins.length >= 3 || isSyncingAdmins}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8c9276] disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddAdminInvite()}
                        disabled={!adminInviteInput.trim() || invitedAdmins.length >= 3 || isSyncingAdmins}
                        className="px-4 py-2.5 rounded-xl bg-[#8c9276] hover:bg-[#7b8166] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                      >
                        {isSyncingAdmins ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>Invitar</span>
                      </button>
                    </div>

                    {inviteError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inviteError}</span>
                      </div>
                    )}

                    {inviteSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{inviteSuccess}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Administradores Adicionales Activos ({invitedAdmins.length})
                    </p>
                    {invitedAdmins.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic bg-white/60 dark:bg-[#1a1a1c]/60 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center">
                        No hay administradores adicionales registrados. Los 3 cupos están disponibles.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {invitedAdmins.map((admEmail) => (
                          <div
                            key={admEmail}
                            className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-white dark:bg-[#1e1e20] border border-gray-100 dark:border-white/5 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ShieldCheck className="w-4 h-4 text-[#8c9276] shrink-0" />
                              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{admEmail}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">ADMINISTRADOR</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAdminInvite(admEmail)}
                              disabled={isSyncingAdmins}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                              title="Revocar acceso de administrador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isUpdatingSettings}
              className="px-8 py-3.5 bg-gray-900 dark:bg-[#202022] text-white dark:text-gray-100 rounded-2xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 dark:hover:bg-[#3a3a3c] transition-all shadow-lg dark:shadow-none hover:shadow-xl dark:shadow-none hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {isUpdatingSettings ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#8c9276]" /> Conexión segura a Supabase Auth</span>
          <span>ID: {user.id.substring(0, 8)}...</span>
        </div>
      </div>

      {/* Shipping Address Manager (5 cols) */}
      <div className="lg:col-span-5 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
        <div>
          <div className="mb-3">
            <CloudSyncStatus
              isSyncing={isSyncingAddresses}
              syncError={syncAddressError}
              onSave={handleSyncAddresses}
              saveLabel="Guardar en nube"
              savedLabel="Guardado en nube"
              compact
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#8c9276]" />
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Direcciones de Entrega</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-mono font-semibold">
                {addresses.length}/4
              </span>
            </div>
            {addresses.length < 4 && !showAddressForm && (
              <button 
                onClick={() => setShowAddressForm(true)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                + Añadir
              </button>
            )}
          </div>

          {addresses.length > 0 ? (
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <div 
                  key={addr.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    addr.isDefault 
                      ? "bg-white dark:bg-[#202022] border-emerald-500/60 shadow-sm dark:shadow-none ring-1 ring-emerald-500/20" 
                      : "bg-gray-50/80 dark:bg-[#2a2a2c]/80 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <UserIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-xs truncate">
                          {addr.recipient || user.name}
                        </span>
                      </div>
                      {addr.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          <Check className="w-2.5 h-2.5 text-emerald-700" /> Predeterminada
                        </span>
                      ) : (
                        <button 
                          onClick={() => setDefaultAddress(addr.id)}
                          className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:hover:text-gray-900 border border-blue-200 hover:border-blue-600 transition-all cursor-pointer shadow-2xs shrink-0 group"
                          title="Establecer como dirección predeterminada"
                        >
                          <Star className="w-2.5 h-2.5 text-blue-500 group-hover:text-white dark:hover:text-gray-900 transition-colors" />
                          <span>Hacer predeterminada</span>
                        </button>
                      )}
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-xs font-medium">{addr.street}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                      {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                    </p>
                    <p className="text-gray-400 text-[10px] font-medium mt-0.5">{addr.country}</p>
                  </div>

                  <div className={`pt-2.5 mt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center ${addr.isDefault ? 'justify-end' : 'justify-between'}`}>
                    {!addr.isDefault && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        Dirección secundaria
                      </span>
                    )}
                    <button 
                      onClick={() => removeAddress(addr.id)}
                      className="text-[11px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-2 bg-gray-50/40 dark:bg-[#2a2a2c]/40">
              <MapPin className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Sin direcciones registradas</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Puedes guardar hasta 4 direcciones para agilizar el proceso de compra.
              </p>
              {!showAddressForm && (
                <button 
                  onClick={() => {
                    setRecipient(user.name);
                    setShowAddressForm(true);
                  }}
                  className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  + Agregar Primera Dirección
                </button>
              )}
            </div>
          )}
        </div>

        {showAddressForm && (
          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
            <form onSubmit={handleAddressSubmit} className="space-y-3 bg-gray-50/70 dark:bg-[#2a2a2c]/70 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
              <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-white/10">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Nueva Dirección de Entrega
                </span>
                <button 
                  type="button" 
                  onClick={() => {
                    setLocationError(null);
                    setLocationSuccess(false);
                    setShowAddressForm(false);
                  }} 
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              {/* Geolocation Auto-fill Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed
                  bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100 hover:border-blue-300 active:scale-[0.99]"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span>Detectando ubicación real del dispositivo...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>Autocompletar con mi ubicación actual</span>
                    </>
                  )}
                </button>

                {locationError && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-2 leading-tight">
                    {locationError}
                  </p>
                )}

                {locationSuccess && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 mt-2 leading-tight flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>¡Ubicación detectada! Revisa los campos y escribe el nombre de quién recibe.</span>
                  </p>
                )}
              </div>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                <span className="flex-shrink mx-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">o llena los datos manualmente</span>
                <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  ¿Quién recibe? (Nombre y apellidos)
                </label>
                <input 
                  type="text" 
                  required 
                  value={recipient} 
                  onChange={e => setRecipient(e.target.value)} 
                  placeholder={user.name} 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calle y Número</label>
                <input 
                  type="text" 
                  required 
                  value={street} 
                  onChange={e => setStreet(e.target.value)} 
                  placeholder="Av. Diagonal 450, 3ro 2da" 
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Ciudad</label>
                  <input 
                    type="text" 
                    required 
                    value={city} 
                    onChange={e => setCity(e.target.value)} 
                    placeholder="Barcelona" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
                  <input 
                    type="text" 
                    required 
                    value={postalCode} 
                    onChange={e => setPostalCode(e.target.value)} 
                    placeholder="08006" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Provincia/Estado</label>
                  <input 
                    type="text" 
                    required
                    value={stateProv} 
                    onChange={e => setStateProv(e.target.value)} 
                    placeholder="Cataluña" 
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">País</label>
                  <input 
                    type="text" 
                    required
                    value={country} 
                    onChange={e => setCountry(e.target.value)} 
                    placeholder="España"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddressForm(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#48484a] rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 cursor-pointer">Guardar Dirección</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
