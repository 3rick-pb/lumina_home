"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldAlert,
  Trash2, 
  MapPin, 
  Check, 
  Star, 
  Navigation,
  Sparkles,
  ArrowRightLeft,
  Copy,
  AlertTriangle,
  Users,
  X,
  RefreshCw
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import InteractiveAddressMap from "@/components/ui/InteractiveAddressMap";
import { useUserStore, clearAdminCache, syncAddressesToCloud, validateStrongPassword } from "@/lib/userStore";
import { supabase } from "@/lib/supabase";
import { CloudSyncStatus } from "../CloudSyncStatus";
import { BlobatarAvatar } from "@/components/ui/BlobatarAvatar";
import { useAvatarSettingsStore } from "@/lib/avatarSettingsStore";
import {
  getRefinedCoordinates,
  getImmediateRawGpsPosition,
  type RawGpsHardwareData,
} from "@/lib/locationUtils";
import { resolveEcuadorExactAddressLngLat } from "../RadarMapboxCanvas";
import { StrongPasswordMeter } from "@/components/ui/StrongPasswordMeter";

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

  // Avatar Settings vinculados a la tabla dedicada public.user_avatar_settings
  const { 
    showAvatarInNavbar, 
    setShowAvatarInNavbar,
    backgroundShape,
    setBackgroundShape,
    customSeed,
    setCustomSeed,
    loadSettingsFromDatabase,
  } = useAvatarSettingsStore();

  useEffect(() => {
    if (user?.id) {
      loadSettingsFromDatabase(user.id);
    }
  }, [user?.id, loadSettingsFromDatabase]);

  // Settings State
  const [editName, setEditName] = useState("");
  const [newPass, setNewPass] = useState("");
  const [invitedAdmins, setInvitedAdmins] = useState<string[]>([]);
  const [subAdminProfiles, setSubAdminProfiles] = useState<Record<string, { displayName?: string; email: string }>>({});
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState<string>("admin@lumina.com");
  const [adminInviteInput, setAdminInviteInput] = useState("");
  const [isSyncingAdmins, setIsSyncingAdmins] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [settingsFeedback, setSettingsFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isSyncingAddresses, setIsSyncingAddresses] = useState(false);
  const [syncAddressError, setSyncAddressError] = useState<string | null>(null);

  // Ownership Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetEmail, setTransferTargetEmail] = useState("");
  const [transferStep, setTransferStep] = useState<"select" | "challenge" | "success">("select");
  const [transferChallengeId, setTransferChallengeId] = useState<string | null>(null);
  const [transferGeneratedCode, setTransferGeneratedCode] = useState("");
  const [transferInputCode, setTransferInputCode] = useState("");
  const [transferConfirmationPhrase, setTransferConfirmationPhrase] = useState("");
  const [transferExpiresAt, setTransferExpiresAt] = useState<number | null>(null);
  const [transferTimeRemaining, setTransferTimeRemaining] = useState<number>(600);
  const [transferAckWarning, setTransferAckWarning] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
  const [recipient, setRecipient] = useState(user?.name || "");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [addrEmail, setAddrEmail] = useState(user?.email || "");
  const [street, setStreet] = useState("");
  const [exteriorNumber, setExteriorNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [interiorNumber, setInteriorNumber] = useState("");
  const [crossStreets, setCrossStreets] = useState("");
  const [addressType, setAddressType] = useState<"casa" | "departamento" | "oficina">("casa");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const [floorLevel, setFloorLevel] = useState("");
  const [label, setLabel] = useState("");
  const [reference, setReference] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Ecuador");
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [detectedRawGps, setDetectedRawGps] = useState<RawGpsHardwareData | null>(null);
  const [syncingRawGpsId, setSyncingRawGpsId] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRecipient(prev => prev || user.name || '');
      setAddrEmail(prev => prev || user.email || '');
    }
  }, [user]);

  const cleanUserEmail = (user?.email || '').toLowerCase().trim();
  const isMasterAdmin = 
    cleanUserEmail === primaryAdminEmail.toLowerCase().trim() || 
    cleanUserEmail === 'admin@lumina.com' || 
    cleanUserEmail === 'arteagae796@gmail.com';

  useEffect(() => {
    if (user?.name) setEditName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (isAdmin) {
      fetchInvitedAdmins();
    }
  }, [isAdmin, isMasterAdmin]);

  // Ownership transfer countdown timer effect
  useEffect(() => {
    if (!transferExpiresAt || transferStep !== "challenge") return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((transferExpiresAt - Date.now()) / 1000));
      setTransferTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [transferExpiresAt, transferStep]);

  const handleCopyTransferCode = () => {
    if (!transferGeneratedCode) return;
    try {
      navigator.clipboard.writeText(transferGeneratedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOpenTransferModal = () => {
    setTransferTargetEmail("");
    setTransferStep("select");
    setTransferChallengeId(null);
    setTransferGeneratedCode("");
    setTransferInputCode("");
    setTransferConfirmationPhrase("");
    setTransferExpiresAt(null);
    setTransferTimeRemaining(600);
    setTransferAckWarning(false);
    setTransferError(null);
    setTransferSuccessMsg(null);
    setShowTransferModal(true);
  };

  const handleInitiateTransfer = async (target?: string) => {
    const emailToUse = (target || transferTargetEmail).toLowerCase().trim();
    if (!emailToUse) {
      setTransferError("Por favor ingresa o selecciona un correo de destino.");
      return;
    }
    setTransferError(null);
    setTransferLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/transfer-ownership', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'request_challenge',
          targetEmail: emailToUse,
          requesterEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al iniciar la solicitud de transferencia.');
      }

      setTransferTargetEmail(data.targetEmail);
      setTransferChallengeId(data.challengeId);
      setTransferGeneratedCode(data.code);
      setTransferExpiresAt(data.expiresAt);
      setTransferTimeRemaining(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
      setTransferStep('challenge');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al solicitar el código de seguridad.';
      setTransferError(msg);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!transferInputCode.trim()) {
      setTransferError("Ingresa el código de verificación de 6 dígitos.");
      return;
    }
    if (transferConfirmationPhrase.trim().toUpperCase() !== 'TRANSFERIR') {
      setTransferError("Escribe exactamente la palabra 'TRANSFERIR' para validar la acción.");
      return;
    }

    setTransferError(null);
    setTransferLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/transfer-ownership', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'verify_and_execute',
          challengeId: transferChallengeId,
          targetEmail: transferTargetEmail,
          code: transferInputCode.trim(),
          confirmationPhrase: transferConfirmationPhrase.trim(),
          requesterEmail: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al completar la transferencia de titularidad.');
      }

      setTransferStep('success');
      setTransferSuccessMsg(data.message || 'Transferencia ejecutada con éxito.');
      setPrimaryAdminEmail(data.newPrimaryAdmin);
      clearAdminCache();
      fetchInvitedAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la transferencia.';
      setTransferError(msg);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (transferStep === 'challenge') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
        };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

        await fetch('/api/admin/transfer-ownership', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'cancel_transfer',
            requesterEmail: user?.email,
          }),
        });
      } catch {}
    }
    setShowTransferModal(false);
    setTransferStep('select');
  };

  const fetchInvitedAdmins = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 
        'Cache-Control': 'no-cache', 
        'Pragma': 'no-cache',
        'x-user-email': user?.email || '',
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/invitations', { 
        cache: 'no-store',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (data.primaryAdmin) {
          setPrimaryAdminEmail(data.primaryAdmin);
        }
        if (data.subAdminProfiles) {
          setSubAdminProfiles(data.subAdminProfiles);
        }
        if (Array.isArray(data.invitedAdmins)) {
          const currentPrimary = data.primaryAdmin || 'admin@lumina.com';
          const filtered = data.invitedAdmins
            .map((e: string) => String(e).toLowerCase().trim())
            .filter((e: string) => Boolean(e) && e !== currentPrimary);
          setInvitedAdmins(filtered);
          return;
        }
      }
    } catch {
      // Non-critical fallback
    }

    try {
      const { data: invRows } = await supabase
        .from('admin_invitations')
        .select('email')
        .eq('is_active', true);

      if (invRows && Array.isArray(invRows)) {
        const filtered = invRows
          .map((r: { email?: string }) => String(r.email || '').toLowerCase().trim())
          .filter((e: string) => Boolean(e) && e !== 'admin@lumina.com');
        setInvitedAdmins(filtered);
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
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'add',
          emails: raw,
          requesterEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al agregar sub-administradores.');
      }
      const filtered = Array.isArray(data.invitedAdmins)
        ? data.invitedAdmins
            .map((e: string) => String(e).toLowerCase().trim())
            .filter((e: string) => Boolean(e) && e !== primaryAdminEmail)
        : [];
      setInvitedAdmins(filtered);
      clearAdminCache();
      setAdminInviteInput("");
      setInviteSuccess(data.message || 'Sub-administrador(es) agregados con éxito.');
      fetchInvitedAdmins();
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
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-email': user?.email || '',
      };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'remove',
          email: targetEmail,
          requesterEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al revocar sub-administrador.');
      }
      const filtered = Array.isArray(data.invitedAdmins)
        ? data.invitedAdmins
            .map((e: string) => String(e).toLowerCase().trim())
            .filter((e: string) => Boolean(e) && e !== primaryAdminEmail)
        : [];
      setInvitedAdmins(filtered);
      clearAdminCache();
      setInviteSuccess(`Sub-administrador "${targetEmail}" revocado correctamente.`);
      fetchInvitedAdmins();
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
        const pwdCheck = validateStrongPassword(newPass.trim());
        if (!pwdCheck.isValid) {
          throw new Error(
            pwdCheck.error ||
              "La nueva contraseña debe ser fuerte (8+ caracteres, mayúscula, minúscula, número y símbolo)."
          );
        }
        const { error: pwdErr } = await updateUserPassword(newPass.trim());
        if (pwdErr) {
          throw new Error(pwdErr);
        }
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

  const applyResolvedLocation = (
    data: {
      data?: { street?: string; reference?: string; neighborhood?: string; suburb?: string; city?: string; state?: string; postalCode?: string; country?: string; exteriorNumber?: string; interiorNumber?: string; crossStreets?: string };
      street?: string;
      reference?: string;
      neighborhood?: string;
      suburb?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      exteriorNumber?: string;
      interiorNumber?: string;
      crossStreets?: string;
      source?: string;
    },
    exactGps?: { lat: number; lng: number }
  ) => {
    const rawStreet = data.data?.street || data.street || "";
    const resolvedStreet = rawStreet.replace(/^(?:calle\s+)?s\/?n$/i, "").trim();
    const resolvedExterior = data.data?.exteriorNumber || data.exteriorNumber || "";
    const resolvedInterior = data.data?.interiorNumber || data.interiorNumber || "";
    const resolvedCrossStreets = data.data?.crossStreets || data.crossStreets || "";
    const resolvedNeighborhood = data.data?.neighborhood || data.neighborhood || data.data?.suburb || data.suburb || "";
    const resolvedRef = data.data?.reference || data.reference || "";
    const resolvedCity = data.data?.city || data.city || "";
    const resolvedState = data.data?.state || data.state || "";
    const resolvedPostal = data.data?.postalCode || data.postalCode || "";
    const resolvedCountry = data.data?.country || data.country || "Ecuador";

    if (resolvedStreet) setStreet(resolvedStreet);
    if (resolvedExterior) setExteriorNumber(resolvedExterior);
    if (resolvedInterior) setInteriorNumber(resolvedInterior);
    if (resolvedCrossStreets) setCrossStreets(resolvedCrossStreets);
    if (resolvedNeighborhood) setNeighborhood(resolvedNeighborhood);
    if (resolvedRef) setReference(resolvedRef);
    if (resolvedCity) setCity(resolvedCity);
    if (resolvedState) setStateProv(resolvedState);
    if (resolvedPostal) setPostalCode(resolvedPostal);
    if (resolvedCountry) setCountry(resolvedCountry);
    if (exactGps && Number.isFinite(exactGps.lat) && Number.isFinite(exactGps.lng)) {
      setDetectedCoords(exactGps);
      setShowMiniMap(true);
    }
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

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);
    setLocationSuccess(false);

    if (typeof window === "undefined" || !navigator.geolocation) {
      await fetchIpLocationFallback();
      setIsDetectingLocation(false);
      return;
    }

    try {
      // 3 internal sequential samples, returning the finest accuracy sample + full raw GPS hardware telemetry
      const coords = await getRefinedCoordinates();
      const gpsPair = { lat: coords.latitude, lng: coords.longitude };
      setDetectedCoords(gpsPair);
      setShowMiniMap(true);
      setDetectedRawGps(coords.rawGps);

      const res = await fetch(`/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`);
      if (!res.ok) throw new Error("Error en resolución");
      const data = await res.json();
      if (data.success) {
        // Merge unformatted reverse-geocode JSON (rawDisplayName, rawNominatim) into rawGps without stripping anything
        const enrichedRawGps: RawGpsHardwareData = {
          ...coords.rawGps,
          rawDisplayName: data.rawDisplayName || data.data?.rawDisplayName || coords.rawGps.rawDisplayName,
          rawNominatim: data.rawNominatim || data.data?.rawNominatim || coords.rawGps.rawNominatim,
          rawPositionJson: JSON.stringify({
            gpsChip: coords.rawGps,
            reverseGeocodeRaw: data.rawNominatim || data.data?.rawNominatim || data,
          }),
        };
        setDetectedRawGps(enrichedRawGps);
        applyResolvedLocation(data, gpsPair);
      } else {
        await fetchIpLocationFallback();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      const ok = await fetchIpLocationFallback();
      if (!ok) {
        setLocationError(msg || "No se pudo detectar la ubicación. Por favor, ingresa los datos manualmente.");
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleCaptureRawGpsForSavedAddress = async (addrId: string) => {
    setSyncingRawGpsId(addrId);
    try {
      const rawGps = await getImmediateRawGpsPosition();
      let enrichedRawGps = rawGps;
      try {
        const res = await fetch(`/api/geocode?lat=${rawGps.latitude}&lon=${rawGps.longitude}`);
        if (res.ok) {
          const geoData = await res.json();
          enrichedRawGps = {
            ...rawGps,
            rawDisplayName: geoData.rawDisplayName || geoData.data?.rawDisplayName,
            rawNominatim: geoData.rawNominatim || geoData.data?.rawNominatim,
            rawPositionJson: JSON.stringify({
              gpsChip: rawGps,
              reverseGeocodeRaw: geoData.rawNominatim || geoData,
            }),
          };
        }
      } catch {}

      const updatedAddresses = addresses.map((a) =>
        a.id === addrId
          ? {
              ...a,
              lat: enrichedRawGps.latitude,
              lng: enrichedRawGps.longitude,
              rawGps: enrichedRawGps,
              rawGpsString: enrichedRawGps.rawPositionJson,
            }
          : a
      );
      const updatedActive =
        updatedAddresses.find((a) => a.isDefault) || updatedAddresses[0] || null;

      useUserStore.setState({
        addresses: updatedAddresses,
        address: updatedActive,
      });
      await syncAddressesToCloud(user?.id, updatedAddresses, updatedActive);
    } catch (err) {
      console.warn("No se pudo capturar el GPS crudo:", err);
    } finally {
      setSyncingRawGpsId(null);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAddress) return;
    setAddressValidationError(null);

    // Explicit validation so user is never confused about what is missing
    const missing: string[] = [];
    if (!street.trim()) missing.push("Calle Principal");
    if (!city.trim()) missing.push("Ciudad / Cantón");

    if (missing.length > 0) {
      setAddressValidationError(`Por favor completa: ${missing.join(", ")}.`);
      return;
    }

    if (addresses.length >= 4) {
      setAddressValidationError("Has alcanzado el límite máximo de 4 direcciones.");
      return;
    }

    setIsSubmittingAddress(true);

    try {
      const finalCity = city.trim();
      const finalState = stateProv.trim() || "Pichincha";
      const finalPostal = postalCode.trim() || "170150";
      const finalCountry = country.trim() || "Ecuador";
      const finalStreet = street.trim();
      const finalRecipient = recipient.trim() || user?.name || "Destinatario";

      const resolvedLat = detectedCoords?.lat ?? detectedRawGps?.latitude;
      const resolvedLng = detectedCoords?.lng ?? detectedRawGps?.longitude;

      const finalRawGps: RawGpsHardwareData | undefined =
        typeof resolvedLat === "number" && typeof resolvedLng === "number"
          ? {
              ...(detectedRawGps || {
                accuracy: 5,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                timestamp: Date.now(),
                rawPositionJson: JSON.stringify({ latitude: resolvedLat, longitude: resolvedLng }),
              }),
              latitude: resolvedLat,
              longitude: resolvedLng,
              rawCoordsString: `${resolvedLat},${resolvedLng}`,
            }
          : detectedRawGps || undefined;

      const newAddressPayload = {
        recipient: finalRecipient,
        idNumber: idNumber.trim() || undefined,
        phone: phone.trim() || undefined,
        email: addrEmail.trim() || user?.email || undefined,
        street: finalStreet,
        exteriorNumber: exteriorNumber.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        interiorNumber: interiorNumber.trim() || undefined,
        crossStreets: crossStreets.trim() || undefined,
        addressType: addressType,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        hasElevator: hasElevator,
        floorLevel: floorLevel.trim() || undefined,
        label: label.trim() || undefined,
        reference: reference.trim() || undefined,
        city: finalCity,
        state: finalState,
        postalCode: finalPostal,
        country: finalCountry,
        lat: resolvedLat,
        lng: resolvedLng,
        rawGps: finalRawGps,
        rawGpsString: finalRawGps?.rawPositionJson || finalRawGps?.rawCoordsString || undefined,
        isDefault: addresses.length === 0,
      };

      // 1. Instantly close form and reset fields so UI is responsive and double clicks are impossible
      setShowAddressForm(false);
      setShowMiniMap(false);
      setRecipient(user?.name || "");
      setIdNumber("");
      setPhone("");
      setAddrEmail(user?.email || "");
      setStreet("");
      setExteriorNumber("");
      setNeighborhood("");
      setInteriorNumber("");
      setCrossStreets("");
      setAddressType("casa");
      setDeliveryInstructions("");
      setHasElevator(false);
      setFloorLevel("");
      setLabel("");
      setReference("");
      setCity("");
      setStateProv("");
      setPostalCode("");
      setCountry("Ecuador");
      setDetectedCoords(null);
      setDetectedRawGps(null);
      setLocationError(null);
      setLocationSuccess(false);

      // 2. Persist to store (renders immediately in address list) and syncs to cloud
      await addAddress(newAddressPayload);
    } catch (err) {
      console.error("Error al guardar dirección:", err);
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in items-start">
      {/* Account & Credentials (7 cols) */}
      <div className="lg:col-span-7 bg-white/90 dark:bg-[#202022]/5 backdrop-blur-3xl p-8 md:p-10 rounded-[3rem] border border-white/80 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-10 relative overflow-hidden">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-600 dark:text-amber-400" /> Configuración
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

        {/* Blobatar Avatar Showcase Card con sincronización a tabla dedicada Supabase */}
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-[#f59e0b]/10 via-gray-50/50 to-white/40 dark:from-[#f59e0b]/15 dark:via-black/20 dark:to-transparent border border-amber-500/20 dark:border-white/10 relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group shrink-0">
              <BlobatarAvatar
                name={customSeed || user.id || user.email || user.name}
                size={84}
                animate="always"
                background={backgroundShape}
                role={user.role}
                showGlow
                title={`Avatar oficial de ${user.name}`}
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10.5px] font-bold tracking-tight">
                <Sparkles className="w-3 h-3" />
                <span>Avatar Automático Blobatar</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Identidad Geométrica Determinística</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Tu avatar es generado de forma matemática a partir de tu identidad digital. Cada cuenta tiene una criatura viviente única con expresión, silueta geométrica y paleta cromática propia.
              </p>
            </div>
          </div>

          {/* Selector de Forma Geométrica con botones claramente separados y previsualización táctil */}
          <div className="pt-4 border-t border-gray-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Forma del Contenedor
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Elige entre el contorno squircle orgánico Liquid Glass o círculo completo.
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={() => setBackgroundShape("squircle", user?.id, user?.email)}
                className={`flex-1 sm:flex-initial px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 border ${
                  backgroundShape === "squircle"
                    ? "bg-white dark:bg-[#252528] text-gray-900 dark:text-white border-[#e07a3f] ring-2 ring-[#e07a3f]/20 shadow-md shadow-[#e07a3f]/10"
                    : "bg-gray-100/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border-gray-200/80 dark:border-white/10 hover:bg-gray-200/70 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Seleccionar contorno squircle orgánico"
              >
                <div
                  className={`w-4 h-4 rounded-[5px] border-2 transition-colors ${
                    backgroundShape === "squircle"
                      ? "border-[#e07a3f] bg-[#e07a3f]/20"
                      : "border-gray-400 dark:border-gray-500"
                  }`}
                  aria-hidden="true"
                />
                <span>Squircle</span>
              </button>

              <button
                type="button"
                onClick={() => setBackgroundShape("circle", user?.id, user?.email)}
                className={`flex-1 sm:flex-initial px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 border ${
                  backgroundShape === "circle"
                    ? "bg-white dark:bg-[#252528] text-gray-900 dark:text-white border-[#e07a3f] ring-2 ring-[#e07a3f]/20 shadow-md shadow-[#e07a3f]/10"
                    : "bg-gray-100/80 dark:bg-white/[0.05] text-gray-600 dark:text-gray-400 border-gray-200/80 dark:border-white/10 hover:bg-gray-200/70 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
                }`}
                title="Seleccionar contorno de círculo completo"
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${
                    backgroundShape === "circle"
                      ? "border-[#e07a3f] bg-[#e07a3f]/20"
                      : "border-gray-400 dark:border-gray-500"
                  }`}
                  aria-hidden="true"
                />
                <span>Círculo</span>
              </button>
            </div>
          </div>

          {/* Toggle para la barra de navegación de Inicio (Pastilla Liquid Glass) */}
          <div className="pt-4 border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Mostrar avatar en la barra de Inicio
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Muestra tu criatura en el menú pastilla Liquid Glass del inicio. Por defecto está apagado conservando el icono clásico.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showAvatarInNavbar}
              onClick={() => setShowAvatarInNavbar(!showAvatarInNavbar, user?.id, user?.email)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                showAvatarInNavbar ? "bg-amber-500 dark:bg-amber-400" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  showAvatarInNavbar ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Variación / Personalización de Criatura */}
          <div className="pt-4 border-t border-gray-200/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Variante y Semilla de Criatura
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Genera variaciones de tu personaje o vuelve a la semilla nativa original.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const rand = `${user?.id || 'lumina'}-${Math.random().toString(36).substring(2, 7)}`;
                  setCustomSeed(rand, user?.id, user?.email);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-[#2c2c2e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c] text-gray-700 dark:text-gray-200 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Generar nueva variación de criatura"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Nueva Criatura</span>
              </button>
              {customSeed && (
                <button
                  type="button"
                  onClick={() => setCustomSeed(null, user?.id, user?.email)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Restablecer a la criatura nativa original de la cuenta"
                >
                  Restablecer
                </button>
              )}
            </div>
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
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
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
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 pl-1">Nueva Contraseña Segura (Opcional)</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input 
                type="password" 
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Mín. 8 caracteres, mayúscula, minúscula, número y símbolo"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            {newPass.length > 0 && <StrongPasswordMeter password={newPass} />}
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-4">
              {!isMasterAdmin ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <BlobatarAvatar name={user?.name || user?.email} role="SUBADMIN" size={42} showGlow />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Sub Administrador Lumina</span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">ROL DELEGADO</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                        Tienes permisos activos para gestión de catálogo, pedidos y analítica comercial. La asignación de roles está reservada al Administrador Principal.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Administrador Principal (Titularidad Única) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-stone-900 via-zinc-900 to-black text-white dark:from-[#202024] dark:via-[#19191c] dark:to-[#121214] border border-stone-800 dark:border-white/10 space-y-4 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <BlobatarAvatar name={user?.name || primaryAdminEmail} role="ADMIN" size={44} showGlow />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                              Administrador Principal
                            </h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 tracking-wider uppercase">
                              TITULAR ACTIVO
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 font-mono mt-0.5">
                            {primaryAdminEmail}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenTransferModal}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-white border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:border-amber-400/40 hover:text-amber-300 self-start sm:self-auto"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                        <span>Transferir Titularidad</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-white/10 text-[11px] text-gray-400 leading-relaxed flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Cuenta exclusiva con autoridad suprema sobre la infraestructura, roles y base de datos de la plataforma.</span>
                    </div>
                  </div>

                  {/* Sub Administradores */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-[#2a2a2c]/80 dark:to-[#222224]/80 border border-gray-200/80 dark:border-white/10 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                            Sub Administradores
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Delega permisos operativos a un máximo de 3 cuentas registradas en Lumina Home.
                          </p>
                        </div>
                      </div>

                      {/* Discrete Capacity Indicator */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-200/70 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/5">
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 mr-1">
                          {invitedAdmins.length} de 3 cupos
                        </span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map((slotIndex) => (
                            <div
                              key={slotIndex}
                              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                slotIndex < invitedAdmins.length
                                  ? "bg-amber-500"
                                  : "bg-gray-300 dark:bg-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pre-registered requirement alert */}
                    <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <span className="font-bold">Requisito de Seguridad:</span> El usuario debe tener una cuenta registrada previamente en Lumina Home con ese correo antes de poder ser agregado como sub-administrador.
                      </div>
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
                            placeholder="correo@ejemplo.com (separados por coma si son varios)"
                            disabled={invitedAdmins.length >= 3 || isSyncingAdmins}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddAdminInvite()}
                          disabled={!adminInviteInput.trim() || invitedAdmins.length >= 3 || isSyncingAdmins}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                        >
                          {isSyncingAdmins ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>Agregar Sub Admin</span>
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
                        Sub Administradores Activos ({invitedAdmins.length})
                      </p>
                      {invitedAdmins.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic bg-white/60 dark:bg-[#1a1a1c]/60 p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center">
                          No hay sub-administradores registrados. Los 3 cupos están disponibles.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {invitedAdmins.map((admEmail) => {
                            const profile = subAdminProfiles[admEmail];
                            const displayName = profile?.displayName || admEmail.split('@')[0];
                            return (
                              <div
                                key={admEmail}
                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#1e1e20] border border-gray-100 dark:border-white/5 text-xs shadow-xs gap-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <BlobatarAvatar
                                    name={profile?.displayName || admEmail}
                                    role="SUBADMIN"
                                    size={38}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs">
                                        {displayName}
                                      </span>
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 shrink-0">
                                        SUB ADMIN
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono">
                                      {admEmail}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdminInvite(admEmail)}
                                  disabled={isSyncingAdmins}
                                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                                  title="Revocar acceso de sub-administrador"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isUpdatingSettings}
              className="px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-2xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer"
            >
              {isUpdatingSettings ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>

        <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Conexión segura a Supabase Auth</span>
          <span>ID: {user.id.substring(0, 8)}...</span>
        </div>
      </div>

      {/* Shipping Address Manager (5 cols) */}
      <div className="lg:col-span-5 bg-white/90 dark:bg-[#202022]/90 backdrop-blur-xl p-6 md:p-8 rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col space-y-4 h-fit">
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
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Direcciones de Entrega</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-mono font-semibold">
                {addresses.length}/4
              </span>
            </div>
            {addresses.length < 4 && !showAddressForm && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setShowMiniMap(false);
                  setShowAddressForm(true);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
              >
                + Añadir
              </motion.button>
            )}
          </div>

          {addresses.length > 0 ? (
            <motion.div layout className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {addresses.map((addr) => (
                  <motion.div 
                    key={addr.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94, y: -12 }}
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-2xl border transition-shadow duration-200 flex flex-col justify-between ${
                      addr.isDefault 
                        ? "bg-white dark:bg-[#202022] border-emerald-500/60 shadow-md dark:shadow-none ring-1 ring-emerald-500/20" 
                        : "bg-gray-50/80 dark:bg-[#2a2a2c]/80 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:shadow-sm"
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
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400" /> Predeterminada
                          </span>
                        ) : (
                          <button 
                            onClick={() => setDefaultAddress(addr.id)}
                            className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white border border-blue-200 dark:border-blue-800/40 hover:border-blue-600 transition-all cursor-pointer shadow-2xs shrink-0 group active:scale-95"
                            title="Establecer como dirección predeterminada"
                          >
                            <Star className="w-2.5 h-2.5 text-blue-500 group-hover:text-white transition-colors" />
                            <span>Hacer predeterminada</span>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 text-xs font-medium">{addr.street}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                        {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postalCode}
                      </p>
                      <p className="text-gray-400 text-[10px] font-medium mt-0.5">{String(addr.country || "Ecuador").split("||LUMINA_RAW_GPS||")[0]}</p>

                      {/* Raw GPS Chip Telemetry Badge (Ubicación Cruda sin formatear) */}
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                        {addr.rawGps || (typeof addr.lat === "number" && typeof addr.lng === "number") ? (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="inline-flex items-center gap-1 text-[9.5px] font-mono font-bold text-amber-700 dark:text-amber-400">
                              <Navigation className="w-2.5 h-2.5 shrink-0" />
                              GPS Crudo: {(addr.rawGps?.latitude ?? addr.lat)?.toFixed(7)}, {(addr.rawGps?.longitude ?? addr.lng)?.toFixed(7)}
                              {addr.rawGps?.accuracy ? ` (±${Math.round(addr.rawGps.accuracy)}m)` : ""}
                            </span>
                            {addr.rawGps?.rawDisplayName && (
                              <span className="text-[9px] font-mono text-gray-400 truncate max-w-[260px]" title={addr.rawGps.rawDisplayName}>
                                {addr.rawGps.rawDisplayName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            Sin telemetría cruda del chip GPS
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCaptureRawGpsForSavedAddress(addr.id)}
                          disabled={syncingRawGpsId === addr.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-white/10 hover:bg-gray-800 dark:hover:bg-white/15 text-white dark:text-amber-400 text-[9.5px] font-mono font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
                          title="Capturar la ubicación cruda directamente del chip GPS del dispositivo y guardarla en esta dirección"
                        >
                          {syncingRawGpsId === addr.id ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Navigation className="w-2.5 h-2.5" />
                          )}
                          <span>{addr.rawGps ? "Actualizar GPS Crudo" : "Capturar GPS Crudo"}</span>
                        </button>
                      </div>

                      {(addr.idNumber || addr.phone || addr.email) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-gray-100 dark:border-white/5">
                          {addr.idNumber && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#3a3a3c] text-gray-700 dark:text-gray-300 font-mono font-medium">
                              C.I.: {addr.idNumber}
                            </span>
                          )}
                          {addr.phone && (
                            <a 
                              href={`https://wa.me/${String(addr.phone || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 font-mono font-medium hover:underline flex items-center gap-1 transition-colors"
                              title="Contactar vía WhatsApp"
                            >
                              <span>WhatsApp:</span>
                              <span>{addr.phone}</span>
                            </a>
                          )}
                          {addr.email && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40 truncate max-w-[180px]" title={addr.email}>
                              {addr.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`pt-2.5 mt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center ${addr.isDefault ? 'justify-end' : 'justify-between'}`}>
                      {!addr.isDefault && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          Dirección secundaria
                        </span>
                      )}
                      <button 
                        onClick={() => removeAddress(addr.id)}
                        className="text-[11px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-2 bg-gray-50/40 dark:bg-[#2a2a2c]/40"
            >
              <MapPin className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Sin direcciones registradas</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Puedes guardar hasta 4 direcciones para agilizar el proceso de compra.
              </p>
              {!showAddressForm && (
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setRecipient(user.name);
                    setShowMiniMap(false);
                    setShowAddressForm(true);
                  }}
                  className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
                >
                  + Agregar Primera Dirección
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showAddressForm && (
            <motion.div
              key="address-form-panel"
              initial={{ opacity: 0, height: 0, y: 15 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden pt-4 border-t border-gray-100 dark:border-white/5"
            >
              <form onSubmit={handleAddressSubmit} className="space-y-4 bg-gray-50/70 dark:bg-[#2a2a2c]/70 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Nueva Dirección de Entrega
                  </span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLocationError(null);
                      setLocationSuccess(false);
                      setShowMiniMap(false);
                      setShowAddressForm(false);
                    }} 
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer transition-colors"
                  >
                    Cerrar
                  </button>
                </div>

                {/* Geolocation Auto-fill Button */}
                <div className="pt-1">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed
                    bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 text-blue-700 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 dark:text-blue-300 border-blue-200/90 dark:border-blue-800/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 active:scale-[0.99]"
                  >
                    {isDetectingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                        <span>Detectando ubicación real del dispositivo...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Autocompletar con mi ubicación actual</span>
                      </>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {locationError && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-[11px] text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 mt-2 leading-tight"
                      >
                        {locationError}
                      </motion.p>
                    )}

                    {locationSuccess && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-[11px] text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-2.5 mt-2 leading-tight flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>¡Ubicación detectada! Revisa los campos y escribe el nombre de quién recibe.</span>
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Mini-map: ONLY appears after clicking "Autocompletar con mi ubicación actual" */}
                  <AnimatePresence>
                    {showMiniMap && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.98 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Ubicación Exacta en Mapa</span>
                          </label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                            Pin activo
                          </span>
                        </div>
                        <InteractiveAddressMap
                          initialLat={detectedCoords?.lat || -0.1807}
                          initialLng={detectedCoords?.lng || -78.4678}
                          onLocationSelect={(lat, lng) => setDetectedCoords({ lat, lng })}
                          onAddressResolved={(addr) => {
                            const cleanStreet = (addr.street || "").replace(/^(?:calle\s+)?s\/?n$/i, "").trim();
                            if (cleanStreet) setStreet(cleanStreet);
                            if (addr.exteriorNumber) setExteriorNumber(addr.exteriorNumber);
                            if (addr.neighborhood) setNeighborhood(addr.neighborhood);
                            if (addr.crossStreets) setCrossStreets(addr.crossStreets);
                            if (addr.landmark || addr.neighborhood) setReference(addr.landmark || addr.neighborhood || "");
                            if (addr.city) setCity(addr.city);
                            if (addr.state) setStateProv(addr.state);
                            if (addr.postalCode) setPostalCode(addr.postalCode);
                            if (addr.country) setCountry(addr.country);
                          }}
                          className="h-56 w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm"
                        />
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                          <span>💡</span>
                          <span>Arrastra el pin para guardar tu ubicación exacta con máxima precisión de entrega.</span>
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="relative flex py-0.5 items-center mt-2">
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                  <span className="flex-shrink mx-2 text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider">o llena los datos manualmente</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                </div>

                {/* Symmetrical & Responsive Input Fields */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">Campos Obligatorios</h4>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Cédula / Identificación
                      </label>
                      <input 
                        type="text" 
                        required
                        value={idNumber} 
                        onChange={e => setIdNumber(e.target.value)} 
                        placeholder="Ej: 1712345678" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Número con WhatsApp
                      </label>
                      <input 
                        type="tel"
                        required
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="+593 99 123 4567" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calle Principal</label>
                      <input 
                        type="text" 
                        required 
                        value={street} 
                        onChange={e => setStreet(e.target.value)} 
                        placeholder="Ej: Av. República del Salvador" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Número Exterior</label>
                      <input 
                        type="text"
                        value={exteriorNumber} 
                        onChange={e => setExteriorNumber(e.target.value)} 
                        placeholder="Ej: N34-120" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Ciudad / Cantón</label>
                      <input 
                        type="text" 
                        required 
                        value={city} 
                        onChange={e => setCity(e.target.value)} 
                        placeholder="Quito" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Provincia/Estado</label>
                      <input 
                        type="text" 
                        required
                        value={stateProv} 
                        onChange={e => setStateProv(e.target.value)} 
                        placeholder="Pichincha" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Código Postal</label>
                      <input 
                        type="text" 
                        required 
                        value={postalCode} 
                        onChange={e => setPostalCode(e.target.value)} 
                        placeholder="170505" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">País</label>
                      <input 
                        type="text" 
                        required
                        value={country} 
                        onChange={e => setCountry(e.target.value)} 
                        placeholder="Ecuador"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-5 pt-3 border-t border-gray-200 dark:border-white/10">Campos Opcionales</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Propiedad</label>
                      <select
                        value={addressType}
                        onChange={e => setAddressType(e.target.value as 'casa' | 'departamento' | 'oficina')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 cursor-pointer"
                      >
                        <option value="casa">Casa</option>
                        <option value="departamento">Departamento</option>
                        <option value="oficina">Oficina</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Número Interior/Depto</label>
                      <input 
                        type="text"
                        value={interiorNumber} 
                        onChange={e => setInteriorNumber(e.target.value)} 
                        placeholder="Ej: Apto 4B" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Calles Intersección</label>
                    <input 
                      type="text"
                      value={crossStreets} 
                      onChange={e => setCrossStreets(e.target.value)} 
                      placeholder="Ej: y Naciones Unidas" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Sector / Barrio</label>
                      <input 
                        type="text" 
                        value={neighborhood} 
                        onChange={e => setNeighborhood(e.target.value)} 
                        placeholder="Ej: La Carolina, Iñaquito..." 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Referencia o Lugar Cercano</label>
                      <input 
                        type="text" 
                        value={reference} 
                        onChange={e => setReference(e.target.value)} 
                        placeholder="Ej: Frente al parque" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Instrucciones de Entrega</label>
                    <input 
                      type="text" 
                      value={deliveryInstructions} 
                      onChange={e => setDeliveryInstructions(e.target.value)} 
                      placeholder="Ej: Dejar en portería" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div className="flex items-center h-full pt-2 sm:pt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">
                        <input 
                          type="checkbox" 
                          checked={hasElevator} 
                          onChange={e => setHasElevator(e.target.checked)} 
                          className="w-4 h-4 rounded border-gray-300 text-amber-600 dark:text-amber-400 focus:ring-amber-500 cursor-pointer" 
                        />
                        <span>Tiene ascensor el edificio</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Piso / Nivel</label>
                      <input 
                        type="text" 
                        value={floorLevel} 
                        onChange={e => setFloorLevel(e.target.value)} 
                        placeholder="Ej: 4" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {addressValidationError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2 mt-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>{addressValidationError}</span>
                  </motion.div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-gray-200 dark:border-white/10">
                  <motion.button 
                    whileHover={{ scale: isSubmittingAddress ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmittingAddress ? 1 : 0.98 }}
                    type="button" 
                    disabled={isSubmittingAddress}
                    onClick={() => {
                      setShowMiniMap(false);
                      setShowAddressForm(false);
                      setAddressValidationError(null);
                    }} 
                    className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-white/10 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: isSubmittingAddress ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmittingAddress ? 1 : 0.98 }}
                    type="submit" 
                    disabled={isSubmittingAddress}
                    className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl shadow-sm shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingAddress ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar Dirección</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Transferencia de Titularidad de Administrador Principal */}
        <AnimatePresence>
          {showTransferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900 dark:text-gray-100 overflow-hidden space-y-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-950 dark:text-white">
                        Transferencia de Titularidad
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Protocolo de seguridad de Administrador Principal
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelTransfer}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* STEP 1: Select Target */}
                {transferStep === 'select' && (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Acción de Alta Seguridad</span>
                      </div>
                      <p>
                        Solo puede haber <strong>1 solo Administrador Principal</strong> en Lumina Home. Al completar el traspaso, tu cuenta pasará a ser Sub Administrador de forma inmediata y automática.
                      </p>
                    </div>

                    {invitedAdmins.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Seleccionar Sub Administrador Existente
                        </label>
                        <div className="space-y-1.5">
                          {invitedAdmins.map((admEmail) => {
                            const isSelected = transferTargetEmail.toLowerCase() === admEmail.toLowerCase();
                            const prof = subAdminProfiles[admEmail];
                            return (
                              <button
                                key={admEmail}
                                type="button"
                                onClick={() => setTransferTargetEmail(admEmail)}
                                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500/10 border-amber-500 text-gray-900 dark:text-white ring-1 ring-amber-500/50"
                                    : "bg-gray-50 dark:bg-[#222226] border-gray-200 dark:border-white/5 hover:border-gray-300 text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <BlobatarAvatar name={prof?.displayName || admEmail} role="SUBADMIN" size={32} />
                                  <div>
                                    <div className="font-bold text-xs">{prof?.displayName || admEmail.split('@')[0]}</div>
                                    <div className="text-[11px] font-mono text-gray-500 dark:text-gray-400">{admEmail}</div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                                    <Check className="w-3 h-3" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        O Ingresar Otro Correo Registrado en Lumina
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                        <input
                          type="email"
                          value={transferTargetEmail}
                          onChange={(e) => setTransferTargetEmail(e.target.value)}
                          placeholder="nuevo.administrador@lumina.com"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-xs bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#222226] border border-gray-200 dark:border-white/5 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={transferAckWarning}
                        onChange={(e) => setTransferAckWarning(e.target.checked)}
                        className="mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-gray-600 dark:text-gray-300 leading-relaxed text-[11px]">
                        Entiendo y acepto que esta acción transferirá la titularidad exclusiva del sistema a esta cuenta y mi usuario actual continuará con privilegios de Sub Administrador.
                      </span>
                    </label>

                    {transferError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{transferError}</span>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleCancelTransfer}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!transferTargetEmail.trim() || !transferAckWarning || transferLoading}
                        onClick={() => handleInitiateTransfer()}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        {transferLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Generando Código...</span>
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Continuar a Seguridad</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Generative Code & Word Confirmation Challenge */}
                {transferStep === 'challenge' && (
                  <div className="space-y-5">
                    {/* Security Code Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          Código de Seguridad Generado
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span>{formatTimer(transferTimeRemaining)}</span>
                        </div>
                      </div>

                      {/* Monospace Code Boxes */}
                      <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                        {transferGeneratedCode.split('').map((digit, i) => (
                          <div
                            key={i}
                            className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl bg-white dark:bg-[#121214] border-2 border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono text-xl sm:text-2xl font-black flex items-center justify-center shadow-inner"
                          >
                            {digit}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          Destinatario: <strong className="text-gray-900 dark:text-white font-mono">{transferTargetEmail}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyTransferCode}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCode ? "Copiado" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Verification Inputs */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          1. Ingresa el Código de 6 Dígitos
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={transferInputCode}
                          onChange={(e) => setTransferInputCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-center font-mono text-lg font-bold tracking-widest bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          2. Escribe la palabra &ldquo;TRANSFERIR&rdquo; para autorizar
                        </label>
                        <input
                          type="text"
                          value={transferConfirmationPhrase}
                          onChange={(e) => setTransferConfirmationPhrase(e.target.value)}
                          placeholder="TRANSFERIR"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-center font-mono text-sm font-bold tracking-wider uppercase bg-white dark:bg-[#141416] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    {transferError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{transferError}</span>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleCancelTransfer}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                      >
                        Abortar
                      </button>
                      <button
                        type="button"
                        disabled={
                          transferInputCode.trim().length !== 6 ||
                          transferConfirmationPhrase.trim().toUpperCase() !== 'TRANSFERIR' ||
                          transferLoading ||
                          transferTimeRemaining <= 0
                        }
                        onClick={handleExecuteTransfer}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        {transferLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Ejecutando Traspaso...</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Ejecutar Transferencia</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Success Screen */}
                {transferStep === 'success' && (
                  <div className="space-y-5 text-center py-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-gray-950 dark:text-white">
                        ¡Transferencia Exitosa!
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                        {transferSuccessMsg || "El rol de Administrador Principal ha sido transferido. Tu cuenta continúa con privilegios activos de Sub Administrador."}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#222226] border border-gray-200 dark:border-white/5 text-xs text-left max-w-sm mx-auto space-y-1">
                      <div className="text-[11px] text-gray-400">Nuevo Administrador Principal:</div>
                      <div className="font-mono font-bold text-gray-900 dark:text-white">{transferTargetEmail}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTransferModal(false)}
                      className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:opacity-90"
                    >
                      Aceptar y Cerrar
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
