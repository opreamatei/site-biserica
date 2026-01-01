"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { Priest, SpovEvent } from "@/lib/events";
import type { BookingRecord } from "@/lib/bookings";
import YellowTexture from "@/components/yellowbg";
import IconFrame1 from "@/components/gen/IconFrame";
import IconFrame from "@/components/optimized/components/FrameButton";
import IconFrame2 from "@/components/gen/IconFrame2";
import Logo from "@/components/optimized/components/Logo";
type Props = {
  availability: SpovEvent[];
  priests: Priest[];
};

function sortBookings(list: BookingRecord[]): BookingRecord[] {
  return [...list].sort((a, b) => {
    if (a.date === b.date) {
      const timeCompare = a.startTime.localeCompare(b.startTime);
      if (timeCompare !== 0) return timeCompare;
      const createdCompare = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      if (createdCompare !== 0) return createdCompare;
      return a._id.localeCompare(b._id);
    }
    return a.date.localeCompare(b.date);
  });
}

function formatRoDate(date: string) {
  if (!date) return "";

  const formatted = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(date));

  // Capitalizează prima literă (luni → Luni)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function HomeClient({ availability, priests }: Props) {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const desiredDuration = session?.user?.allocatedMinutes ?? 30;

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    priestId: priests[0]?.id ?? "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [resetRequestedToken, setResetRequestedToken] = useState<string | null>(
    null
  );
  const [resetBusy, setResetBusy] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [availabilityState, setAvailabilityState] =
    useState<SpovEvent[]>(availability);
  const [selectedDay, setSelectedDay] = useState<string>(
    availabilityState[0]?.date ?? ""
  );
  const [showPolicy, setShowPolicy] = useState(false);
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [selectedPriestId, setSelectedPriestId] = useState(priests[0]?.id ?? "");
  const [priestChangeBusy, setPriestChangeBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const statusLabels: Record<string, { text: string; className: string }> = {
    booked: { text: "Înscris", className: "text-emerald-300" },
    cancelled: { text: "Anulat", className: "text-red-300" },
  };
  type AuthView = "choice" | "login" | "register" | "reset";
  const [authView, setAuthView] = useState<AuthView>("choice");

  const handleAuthView = (view: AuthView) => {
    setError(null);
    setMessage(null);
    setAuthView(view);
  };

  const handlePressStart = (id: string) => {
    setPressedId(id);
  };

  const handlePressEnd = () => {
    setPressedId(null);
  };

  const renderPasswordToggle = (visible: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Ascunde parola" : "Arata parola"}
      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center text-white/70 hover:text-white"
    >
      {visible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.7 10.7a2 2 0 002.6 2.6"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.9 4.7A10.6 10.6 0 0112 4c4.8 0 8.8 3 10 7.5a11.3 11.3 0 01-3.3 4.9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.2 6.2A11 11 0 002 11.5C3.2 16 7.2 19 12 19c1.3 0 2.6-.2 3.8-.6"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 12c1.8-4.5 5.8-7.5 10-7.5S20.2 7.5 22 12c-1.8 4.5-5.8 7.5-10 7.5S3.8 16.5 2 12z"
          />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );

  const formatResetError = (raw: string, status?: number) => {
    const normalized = raw.toLowerCase();
    if (status === 404 && normalized.includes("email") && normalized.includes("inregistrat")) {
      return "Emailul nu este înregistrat.";
    }
    if (status === 400 && normalized.includes("token") && normalized.includes("expirat")) {
      return "Cod expirat. Generați un cod nou.";
    }
    if (status === 400 && normalized.includes("token") && normalized.includes("invalid")) {
      return "Cod invalid. Verificați codul introdus.";
    }
    if (status === 400 && normalized.includes("email") && normalized.includes("parola")) {
      return "Completați emailul, codul și parola nouă.";
    }
    return raw || "Nu s-a putut reseta parola.";
  };

  const formatBookingError = (raw: string, status?: number) => {
    if (status === 401) {
      return "Este necesar să fiți autentificat pentru a face o programare.";
    }
    if (status === 400 && raw) {
      return raw;
    }
    return raw || "Nu s-a putut efectua programarea. Reîncercați.";
  };

  const formatAuthError = (raw: string) => {
    const normalized = raw.toLowerCase();
    if (normalized.includes("credentialssignin") || normalized.includes("invalid credentials")) {
      return "Email sau parolă greșită.";
    }
    if (normalized.includes("oauthaccountnotlinked")) {
      return "Acest email este deja folosit cu altă metodă de autentificare.";
    }
    if (normalized.includes("accessdenied")) {
      return "Acces refuzat. Verificați drepturile contului.";
    }
    return raw;
  };

  const formatRegisterError = (raw: string, status?: number) => {
    if (status === 409) {
      return "Există deja un cont cu acest email.";
    }
    if (status === 400 && !raw) {
      return "Completați toate câmpurile și alegeți un preot duhovnic.";
    }
    return raw || "Nu s-a putut crea contul.";
  };

  const validatePassword = (value: string): string | null => {
    const requirements = [
      { ok: value.length >= 8, text: "minim 8 caractere" },
      { ok: /[A-Z]/.test(value), text: "cel puțin o literă mare" },
      { ok: /\d/.test(value), text: "cel puțin o cifră" },
      { ok: /[^\w\s]/.test(value), text: "cel puțin un caracter special" },
    ];
    const missing = requirements.filter((req) => !req.ok).map((req) => `- ${req.text}`);
    if (missing.length === 0) return null;
    return `Parola trebuie să conțină:\n${missing.join("\n")}`;
  };


  const handlePriestChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPriestId = event.target.value;
    if (!nextPriestId || nextPriestId === selectedPriestId) return;

    setSelectedPriestId(nextPriestId);
    setError(null);
    setMessage(null);
    setPriestChangeBusy(true);

    const res = await fetch("/api/user/priest", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priestId: nextPriestId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Nu s-a putut actualiza preotul duhovnic.");
      setPriestChangeBusy(false);
      return;
    }

    if (update) {
      await update({ user: { priestId: nextPriestId } });
    }
    router.refresh();
    void refreshBookings();
    setPriestChangeBusy(false);
  };

  const refreshBookings = useCallback(async () => {
    const res = await fetch("/api/bookings", { cache: "no-store" });
    if (!res.ok) {
      setError("Nu s-au putut încărca modificările. Reîncărcați pagina.");
      return;
    }
    const data = await res.json();
    setBookings(sortBookings(data.bookings ?? []));
    setAllBookings(data.allBookings ?? []);
    setPage(1);
    if (Array.isArray(data.availability)) {
      setAvailabilityState(data.availability);
      if (!data.availability.some((d: SpovEvent) => d.date === selectedDay)) {
        setSelectedDay(data.availability[0]?.date ?? "");
      }
    }
  }, [selectedDay]);

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refreshBookings();
    }
  }, [status, refreshBookings]);

  useEffect(() => {
    if (status !== "authenticated" || priestChangeBusy) return;
    const sessionPriestId = session?.user?.priestId ?? "";
    if (sessionPriestId && sessionPriestId !== selectedPriestId) {
      setSelectedPriestId(sessionPriestId);
    }
  }, [status, priestChangeBusy, session?.user?.priestId, selectedPriestId]);

  useEffect(() => {
    if (!message || error) return;
    const timeout = setTimeout(() => {
      setMessage(null);
    }, 3500);
    return () => clearTimeout(timeout);
  }, [error, message]);

  const dates = useMemo(
    () => Array.from(new Set(availabilityState.map((e) => e.date))),
    [availabilityState]
  );

  const eventsForDay = useMemo(
    () => availabilityState.filter((e) => e.date === selectedDay),
    [availabilityState, selectedDay]
  );
  const remainingForEvent = useCallback(
    (event: SpovEvent) => {
      const eventBookings = allBookings.filter(
        (b) => b.eventId === event.id && b.status !== "cancelled"
      );
      const used = eventBookings.reduce(
        (sum, b) => sum + (b.durationMinutes ?? 30),
        0
      );
      return Math.max(0, event.durationMinutes - used);
    },
    [allBookings]
  );

  const hasAvailableInterval = useMemo(
    () => eventsForDay.some((event) => remainingForEvent(event) >= desiredDuration),
    [eventsForDay, remainingForEvent, desiredDuration]
  );
  const hasBookingForSelectedDay = useMemo(
    () => bookings.some((b) => b.status !== "cancelled" && b.date === selectedDay),
    [bookings, selectedDay]
  );
  const activeOtherPriestBooking = useMemo(
    () =>
      bookings.find(
        (b) =>
          b.status !== "cancelled" &&
          b.priestId &&
          selectedPriestId &&
          b.priestId !== selectedPriestId
      ) ?? null,
    [bookings, selectedPriestId]
  );
  const activeOtherPriestName = useMemo(() => {
    if (!activeOtherPriestBooking?.priestId) return null;
    return priests.find((p) => p.id === activeOtherPriestBooking.priestId)?.name ?? null;
  }, [activeOtherPriestBooking?.priestId, priests]);

  const pagedBookings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return bookings.slice(start, start + pageSize);
  }, [bookings, page]);

  const totalPages = Math.max(1, Math.ceil(bookings.length / pageSize));

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (busy) return;

    if (registerForm.password !== registerForm.confirm) {
      setError("Parolele nu coincid.");
      return;
    }
    if (!acceptedPolicy) {
      setError("Trebuie sŽŸ acceptaE>i politica de confidenE>ialitate.");
      return;
    }
    const passwordError = validatePassword(registerForm.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setBusy(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        priestId: registerForm.priestId,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(formatRegisterError(data.error, res.status));
      setBusy(false);
      return;
    }

    await signIn("credentials", {
      email: registerForm.email,
      password: registerForm.password,
      redirect: false,
    });

    setRegisterForm({ name: "", email: "", password: "", confirm: "", priestId: "" });
    setAcceptedPolicy(false);
    setBusy(false);
    router.refresh();
    void refreshBookings();
  };

  const handleRequestReset = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setResetRequestedToken(null);
    if (resetBusy) return;
    setResetBusy(true);

    const res = await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(formatResetError(data.error, res.status));
      setResetBusy(false);
      return;
    }

    setMessage("Codul a fost generat verificați emailul.");
    if (data.token) setResetRequestedToken(data.token as string);
    setResetBusy(false);
  };

  const handleResetPassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (resetBusy) return;

    if (resetPassword !== resetConfirm) {
      setError("Parolele noi nu coincid.");
      return;
    }
    const passwordError = validatePassword(resetPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setResetBusy(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: resetEmail,
        token: resetToken,
        password: resetPassword,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(formatResetError(data.error, res.status));
      setResetBusy(false);
      return;
    }

    setMessage("Parola a fost resetată. Vă puteți autentifica.");
    setResetPassword("");
    setResetConfirm("");
    setResetToken("");
    setResetBusy(false);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (busy) return;
    setBusy(true);

    const res = await signIn("credentials", {
      email: loginForm.email,
      password: loginForm.password,
      redirect: false,
    });

    if (res?.error) {
      setError(formatAuthError(res.error));
      setBusy(false);
      return;
    }

    setBusy(false);
    router.refresh();
    void refreshBookings();
  };

  const handleBook = async (eventId: string) => {
    if (!session?.user) {
      setError("Vă rugăm să vă autentificați pentru a face o programare.");
      return;
    }
    if (activeOtherPriestBooking) {
     
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (bookingBusy) return;
    setBookingBusy(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(formatBookingError(data.error, res.status));
      setBookingBusy(false);
      return;
    }

    const nextBookings = sortBookings(
      [...(bookings ?? []), data.booking].filter(Boolean)
    );
    setBookings(nextBookings);
    setAllBookings(data.allBookings ?? []);
    setMessage("Înscrierea a fost înregistrată.");
    setBookingBusy(false);
    //setShowScheduler(false);
  };

  const handleCancel = async (id: string) => {
    if (bookingBusy) return;
    setBookingBusy(true);
    setError(null);
    setMessage(null);

    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Nu s-a putut anula programarea.");
      setBookingBusy(false);
      return;
    }

    setBookings((prev) =>
      prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b))
    );
    setAllBookings(data.allBookings ?? []);
    setMessage("Înscrierea a fost anulată.");
    setBookingBusy(false);
  };

  const myPriest = useMemo(
    () =>
      priests.find((p) => p.id === selectedPriestId) ??
      priests.find((p) => p.id === session?.user?.priestId),
    [priests, selectedPriestId, session?.user?.priestId]
  );


  return (
    <YellowTexture>
      <div className="min-h-screen flex flex-col p-4 md:p-6 rounded-2xl">
        {status !== "authenticated" && (
          <div className="flex-1 grid place-items-center">
            {authView === "choice" && (
              <div className="w-full max-w-md text-center grid gap-12 px-4 ">
                <p className="text-4xl md:text-5xl font-bold tracking-tight mt-[15vh] mb-[10vh]">
                  Ai deja un cont?
                </p>
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  <IconFrame1 bgColor="bg-[#AE4B32]">
                    <button
                      className={`w-full py-3 md:py-3 px-4 md:px-6 text-lg md:text-xl font-semibold text-center whitespace-nowrap cursor-pointer transition-transform duration-150 ${pressedId === "auth-login" ? "scale-95" : "scale-100"}`}
                      onClick={() => handleAuthView("login")}
                      onTouchStart={() => handlePressStart("auth-login")}
                      onTouchEnd={handlePressEnd}
                    >
                      Da, am cont
                    </button>
                  </IconFrame1>
                  <IconFrame1 bgColor="bg-[#BE5237]">
                    <button
                      className={`w-full  py-3 md:py-3 px-4 md:px-6 text-lg md:text-xl font-semibold text-center whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer transition-transform duration-150 ${pressedId === "auth-register" ? "scale-95" : "scale-100"}`}
                      onClick={() => handleAuthView("register")}
                      onTouchStart={() => handlePressStart("auth-register")}
                      onTouchEnd={handlePressEnd}
                    >
                      Nu, vreau să-mi fac cont
                    </button>
                  </IconFrame1>
                </div>
                <div className="flex justify-center mt-16">
                  <Logo />
                </div>
              </div>
            )}

            {/* ================= LOGIN ================= */}
            {authView === "login" && (
              <form
                onSubmit={handleLogin}
                className="w-full max-w-md md:max-w-lg grid gap-6 rounded-2xl mt-4 p-4 md:p-8"
              >
                <p className="text-4xl font-bold text-center tracking-tight mb-10 mt-15 text-white/80">
                  Autentificare
                </p>
                {(error || message) && (
                  <div>
                    {error && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm text-red-100 whitespace-pre-line">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">
                        {message}
                      </div>
                    )}
                  </div>
                )}

                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 md:py-3"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm((s) => ({ ...s, email: e.target.value }))
                  }
                />

                <div className="relative mb-5">
                  <input
                    required
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Parolă"
                    className="w-full rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 pr-12 md:py-3"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((s) => ({ ...s, password: e.target.value }))
                    }
                  />
                  {renderPasswordToggle(showLoginPassword, () =>
                    setShowLoginPassword((v) => !v)
                  )}
                </div>

                <IconFrame bgColor="bg-[#AE4B32]">
                  <button
                    type="submit"
                    disabled={busy}
                    className={`w-full py-2 md:py-3 text-lg text-white/80 font-semibold cursor-pointer transition-transform duration-150 ${pressedId === "login-submit" ? "scale-95" : "scale-100"}`}
                    onTouchStart={() => handlePressStart("login-submit")}
                    onTouchEnd={handlePressEnd}
                  >
                    {busy ? "Se autentifică..." : "Intră în cont"}
                  </button>
                </IconFrame>

                <div className="flex flex-col items-center gap-3 pt-4">
                  <button
                    type="button"
                    className={`text-sm underline text-white/70 hover:text-white cursor-pointer transition-transform duration-150 ${pressedId === "login-reset" ? "scale-95" : "scale-100"}`}
                    onClick={() => handleAuthView("reset")}
                    onTouchStart={() => handlePressStart("login-reset")}
                    onTouchEnd={handlePressEnd}
                  >
                    Ai uitat parola?
                  </button>
                  <button
                    type="button"
                    className={`text-sm underline text-white/70 hover:text-white cursor-pointer transition-transform duration-150 ${pressedId === "login-back" ? "scale-95" : "scale-100"}`}
                    onClick={() => handleAuthView("choice")}
                    onTouchStart={() => handlePressStart("login-back")}
                    onTouchEnd={handlePressEnd}
                  >
                    ← Înapoi
                  </button>
                </div>

                <div className="flex justify-center">
                  <Logo />
                </div>
              </form>
            )}

            {/* ================= RESET  ================= */}
            {authView === "reset" && (
              <div className="w-full max-w-md md:max-w-lg grid gap-6 rounded-2xl mt-4 p-4 md:p-8">
                <p className="text-4xl font-bold text-center tracking-tight mt-7 mt-15 mb-10 text-white/90">
                  Resetare parolă
                </p>
                {(error || message) && (
                  <div>
                    {error && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm text-red-100 whitespace-pre-line">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">
                        {message}
                      </div>
                    )}
                  </div>
                )}

                <form className="grid gap-4" onSubmit={handleRequestReset}>
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    className="rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 mb-5 md:py-3"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />

                  <IconFrame bgColor="bg-[#BE5237]">
                    <button
                      type="submit"
                      disabled={resetBusy}
                      className={`w-full py-2 md:py-3 text-lg font-semibold text-white/80 cursor-pointer transition-transform duration-150 ${pressedId === "reset-request" ? "scale-95" : "scale-100"}`}
                      onTouchStart={() => handlePressStart("reset-request")}
                      onTouchEnd={handlePressEnd}
                    >
                      {resetBusy ? "Se trimite codul..." : "Trimite cod resetare"}
                    </button>
                  </IconFrame>
                </form>

                <form className="grid gap-4 mt-6" onSubmit={handleResetPassword}>
                  <input
                    required
                    type="text"
                    placeholder="Cod primit"
                    className="rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 -mt-2 md:py-3"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />

                  <div className="relative">
                    <input
                      required
                      type={showResetPassword ? "text" : "password"}
                      placeholder="Parolă nouă"
                      className="w-full rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 pr-12 md:py-3"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                    {renderPasswordToggle(showResetPassword, () =>
                      setShowResetPassword((v) => !v)
                    )}
                  </div>

                  <div className="relative mb-5">
                    <input
                      required
                      type={showResetConfirm ? "text" : "password"}
                      placeholder="Confirmă parola"
                      className="w-full rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 pr-12 md:py-3"
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                    />
                    {renderPasswordToggle(showResetConfirm, () =>
                      setShowResetConfirm((v) => !v)
                    )}
                  </div>

                  <IconFrame bgColor="bg-[#BE5237]">
                    <button
                      type="submit"
                      disabled={resetBusy}
                      className={`w-full py-2 md:py-3 text-lg font-semibold text-white/80 cursor-pointer transition-transform duration-150 ${pressedId === "reset-submit" ? "scale-95" : "scale-100"}`}
                      onTouchStart={() => handlePressStart("reset-submit")}
                      onTouchEnd={handlePressEnd}
                    >
                      {resetBusy ? "Resetează parola..." : "Resetează parola"}
                    </button>
                  </IconFrame>
                </form>

                <button
                  className={`text-sm underline text-white/70 text-center mt-6 cursor-pointer transition-transform duration-150 ${pressedId === "reset-back" ? "scale-95" : "scale-100"}`}
                  onClick={() => handleAuthView("login")}
                  onTouchStart={() => handlePressStart("reset-back")}
                  onTouchEnd={handlePressEnd}
                >
                  ← Înapoi la autentificare
                </button>

                <div className="flex justify-center">
                  <Logo />
                </div>
              </div>
            )}

            {/* ================= REGISTER ================= */}
            {authView === "register" && (
              <form
                onSubmit={handleRegister}
                className="w-full max-w-md md:max-w-lg grid gap-6 rounded-2xl mt-4 p-4 md:p-8"
              >
                <p className="text-4xl font-bold text-center text-white/90 mt-10 mb-10 tracking-tight">
                  Creează cont
                </p>
                {(error || message) && (
                  <div>
                    {error && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm text-red-100 whitespace-pre-line">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">
                        {message}
                      </div>
                    )}
                  </div>
                )}

                <input
                  required
                  type="text"
                  placeholder="Nume complet"
                  className="rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 md:py-3"
                  value={registerForm.name}
                  onChange={(e) =>
                    setRegisterForm((s) => ({ ...s, name: e.target.value }))
                  }
                />

                <input
                  required
                  type="email"
                  placeholder="Email"
                  className="rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 md:py-3"
                  value={registerForm.email}
                  onChange={(e) =>
                    setRegisterForm((s) => ({ ...s, email: e.target.value }))
                  }
                />

                <div className="relative">
                  <input
                    required
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Parolă"
                    className="w-full rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 pr-12 md:py-3"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm((s) => ({ ...s, password: e.target.value }))
                    }
                  />
                  {renderPasswordToggle(showRegisterPassword, () =>
                    setShowRegisterPassword((v) => !v)
                  )}
                </div>

                <div className="relative">
                  <input
                    required
                    type={showRegisterConfirm ? "text" : "password"}
                    placeholder="Confirmă parola"
                    className="w-full rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 pr-12 md:py-3"
                    value={registerForm.confirm}
                    onChange={(e) =>
                      setRegisterForm((s) => ({ ...s, confirm: e.target.value }))
                    }
                  />
                  {renderPasswordToggle(showRegisterConfirm, () =>
                    setShowRegisterConfirm((v) => !v)
                  )}
                </div>

                <select
                  required
                  className="rounded-lg border border-black/20 bg-[#AE4B32]/50 px-4 py-2 mb-5 md:py-3"
                  value={registerForm.priestId}
                  onChange={(e) =>
                    setRegisterForm((s) => ({ ...s, priestId: e.target.value }))
                  }
                >
                  {priests.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-3 text-black/80">
                  <input
                    id="accept-policy"
                    type="checkbox"
                    required
                    checked={acceptedPolicy}
                    onChange={(event) => setAcceptedPolicy(event.target.checked)}
                    className="h-4 w-4 accent-[#AE4B32]"
                  />
                  <label htmlFor="accept-policy" className="text-xs md:text-md lg:text-[15px]">
                    Sunt de acord cu {" "}
                    <button
                      type="button"
                      onClick={() => setShowPolicy(true)}
                      className="underline hover:text-black/100"
                    >
                      politica de confidențialitate
                    </button>
                  </label>
                </div>
                {showPolicy && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
                    onClick={() => setShowPolicy(false)}
                  >
                    <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-black/20 bg-[#f7f0e2] text-black shadow-2xl">
                      <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
                        <p className="text-xl lg:text-2xl font-semibold">
                          Politica de confidențialitate
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPolicy(false)}
                          className="rounded-full border border-black/20 px-3 py-1 text-sm font-semibold text-black/70 hover:bg-black/10"
                          aria-label="Inchide"
                        >
                          x
                        </button>
                      </div>
                      <div
                        className="max-h-[calc(80vh-64px)] overflow-y-auto px-6 py-4 text-sm lg:text-base leading-relaxed text-black/80"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <p className="font-semibold text-black/90">1. Introducere</p>
                        <p className="mt-2">
                          Politica de Confidențialitate explică ce date colectăm, cum le folosim și care sunt drepturile
                          utilizatorilor atunci când folosesc site-ul nostru (programări, cont, resetare parolă).
                        </p>

                        <p className="mt-4 font-semibold text-black/90">2. Operatorul de date</p>
                        <p className="mt-2">
                          Operator: Biserica Foișor
                          <br />
                          Adresa: Str. Foișorului Nr. 119, București
                          <br />
                          Email: contact@bisericafoisor.ro
                          <br />
                          Telefon: +40 723 257 569
                        </p>

                        <p className="mt-4 font-semibold text-black/90">3. Ce date colectăm</p>
                        <p className="mt-2">
                          - Date de contact: nume, email, telefon (pentru cont și confirmarea programărilor).
                          <br />
                          - Date de programare: data, ora, tipul programarii și alte informații necesare.
                          <br />
                          - Date de autentificare: parola (stocată criptat/hashed).
                          <br />
                          - Date tehnice minime: informații necesare funcționării site-ului (ex. cod de resetare).
                        </p>

                        <p className="mt-4 font-semibold text-black/90">4. Scopurile prelucrării</p>
                        <p className="mt-2">
                          - Creare cont și autentificare.
                          <br />
                          - Gestionarea programărilor și comunicarea lor.
                          <br />
                          - Resetarea parolei prin email.
                          <br />
                          - Siguranța și funcționarea platformei.
                        </p>

                        <p className="mt-4 font-semibold text-black/90">5. Temeiul legal</p>
                        <p className="mt-2">
                          Prelucrăm datele pe baza:
                          <br />
                          - executării unui contract (art. 6(1)(b) GDPR) pentru cont și programări;
                          <br />
                          - consimțământului (art. 6(1)(a)) acolo unde este cazul;
                          <br />
                          - interesului legitim (art. 6(1)(f)) pentru securitatea și integritatea serviciului.
                        </p>

                        <p className="mt-4 font-semibold text-black/90">6. Destinatari / terți</p>
                        <p className="mt-2">
                          Datele pot fi prelucrate de furnizori terți, strict pentru funcționarea serviciului:
                          <br />
                          - Sanity – stocarea datelor de programări și conturi;
                          <br />
                          - Resend – trimiterea emailurilor pentru resetarea parolei.
                          <br />
                          Acești furnizori acționează ca împuterniciți și au obligații GDPR.
                        </p>

                        <p className="mt-4 font-semibold text-black/90">7. Transferuri internaționale</p>
                        <p className="mt-2">
                          Dacă datele sunt transferate în afara SEE prin furnizori (ex. servicii cloud), acestea sunt
                          protejate prin garanții adecvate (ex. clauze contractuale standard).
                        </p>

                        <p className="mt-4 font-semibold text-black/90">8. Durata stocării</p>
                        <p className="mt-2">
                          - Datele de programare: păstrate până la finalizarea programării, apoi șterse/anonimizate
                          conform politicii interne.
                          <br />
                          - Datele de cont: păstrate cât timp contul este activ.
                          <br />
                          - Date de resetare: păstrate doar până la expirarea programării.
                          <br />
                        </p>

                        <p className="mt-4 font-semibold text-black/90">9. Drepturile dumneavoastră</p>
                        <p className="mt-2">
                          Aveți dreptul la:
                          <br />
                          - acces, rectificare, ștergere;
                          <br />
                          - restricționare, portabilitate;
                          <br />
                          - opoziție la prelucrare;
                          <br />
                          - retragerea consimțământului;
                          <br />
                          - depunerea unei plângeri la ANSPDCP.
                          <br />
                          Cereri: anspdcp@dataprotection.ro
                        </p>

                        <p className="mt-4 font-semibold text-black/90">10. Securitatea datelor</p>
                        <p className="mt-2">
                          Aplicăm măsuri tehnice și organizatorice adecvate pentru protecția datelor, inclusiv
                          criptare/hashed pentru parole, acces controlat și monitorizare.
                        </p>

                        <p className="mt-4 font-semibold text-black/90">11. Modificări ale politicii</p>
                        <p className="mt-2">
                          Putem actualiza periodic această politică. Versiunea curentă este disponibilă pe această
                          pagină.
                        </p>

                        <p className="mt-4 font-semibold text-black/90">12. Contact</p>
                        <p className="mt-2 mb-4">
                          Pentru întrebări:
                          <br />
                          Email: contact@bisericafoisor.ro
                          <br />
                          Telefon: +40 723 257 569
                          <br />
                          Adresa: Str. Foișorului Nr. 119, București
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                    <IconFrame bgColor="bg-[#BE5237]" textColor="text-white/80">
                      <button
                        type="submit"
                        disabled={busy}
                        className={`w-full py-2 md:py-3 text-lg font-semibold transition-transform duration-150 ${pressedId === "register-submit" ? "scale-95" : "scale-100"}`}
                        onTouchStart={() => handlePressStart("register-submit")}
                        onTouchEnd={handlePressEnd}
                      >
                        {busy ? "Se creează cont..." : "Creează cont"}
                      </button>
                    </IconFrame>

                    <button
                      type="button"
                      className={`text-sm underline text-white/70 text-center transition-transform duration-150 ${pressedId === "register-back" ? "scale-95" : "scale-100"}`}
                      onClick={() => handleAuthView("choice")}
                      onTouchStart={() => handlePressStart("register-back")}
                      onTouchEnd={handlePressEnd}
                    >
                      ← Înapoi
                    </button>

                    <div className="flex justify-center">
                      <Logo />
                    </div>
                  </form>
                )}
              </div>
            )}
            {/* ------------------ PROGRAMARI ------------------------ */}
            {status === "authenticated" && (
              <div className="min-h-screen flex items-center justify-center ">
                <div className="w-full max-w-md md:max-w-lg grid gap-6 mt-10 rounded-2xl p-4 md:p-6">
                  {/* Heading */}
                  {/* <div className="flex items-center justify-between">
                 <div className="w-full text-center">
                  <p className="text-4xl font-bold tracking-tight mt-10 mb-10 md:mb-10">
                    Programările tale
                  </p> 
                </div> 
              </div> */}

                  {/* User Info Section */}
                  <div className="mt-6 grid gap-4">
                    <div className="w-full px-2 py-4 md:p-4">
                      <p className="text-sm uppercase text-center tracking-wide text-white/60">Bine ai venit</p>
                      <h3 className="text-4xl my-5 uppercase text-center font-semibold text-white/80 text-shadow-xs text-shadow-black/30">
                        {session?.user?.name ?? "Fara nume"}
                      </h3>
                      <p className="text-md text-center opacity-80 text-white/60">{session?.user?.email}</p>

                      {priests.length > 0 && (
                        <div className="mt-2 flex flex-col items-center gap-2 text-md text-white/60">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <span className="t whitespace-nowrap">Preot duhovnic:</span>
                            <div className="relative">
                              <select
                                value={selectedPriestId}
                                onChange={handlePriestChange}
                                disabled={priestChangeBusy}
                                className="appearance-none rounded-full border border-white/20 bg-white/10 py-1 pl-3 pr-8 text-xs text-white/90 focus:border-white/40 focus:outline-none"
                              >
                                {priests.map((priest) => (
                                  <option key={priest.id} value={priest.id} className="text-black">
                                    {priest.name}
                                  </option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="m6 9 6 6 6-6" />
                                </svg>
                              </span>
                            </div>
                          </div>
                          {activeOtherPriestBooking && (
                            <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-sm text-red-100 leading-snug">
                              <div className="flex items-start gap-2">
                                <span className="mt-1 h-2 w-2 flex-none rounded-full bg-red-400" />
                                <div>
                                  Aveți deja o înscriere activă
                                  {activeOtherPriestName ? ` la ${activeOtherPriestName}` : ""}.
                                  <br />
                                  Anulați-o pentru a vă putea înscrie la {myPriest?.name ?? "acest preot"}.
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {priestChangeBusy && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/70">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Se actualizează programările...
                        </div>
                      )}

                      {/* Sign Out Button */}
                      <button
                        onClick={() => signOut({ redirect: false }).then(() => router.refresh())}
                        className={`rounded-md absolute -translate-1/2 left-1/2 mt-12 border border-white/20 bg-red-500/30 px-3 py-1 text-sm text-white hover:border-white/40 cursor-pointer transition-transform duration-150 ${pressedId === "signout" ? "scale-95" : "scale-100"}`}
                        onTouchStart={() => handlePressStart("signout")}
                        onTouchEnd={handlePressEnd}
                      >
                        Delogare
                      </button>
                    </div>
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <div className="w-full">
                        <p className="text-sm text-center mt-[10vh] text-white/60">Alege ziua</p>
                        <p className="md:text-2xl text-xl text-center font-semibold text-white/90 uppercase text-shadow-xs text-shadow-black/30 mb-6">
                          {selectedDay ? formatRoDate(selectedDay) : "Nicio zi"}
                        </p>
                      </div>
                    </div>

                    {/* Available Dates */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availabilityState.length === 0 && (
                        <p className="text-sm text-white/60">
                          Nu există zile disponibile pentru preotul duhovnic ales.
                        </p>
                      )}
                      {dates.map((day) => (
                        <IconFrame2 bgColor="bg-gradient-to-r from-amber-400 to-yellow-400 opacity-90 mx-5" key={day}>
                          <button
                            onClick={() => setSelectedDay(day)}
                            className={`relative rounded-xl px-4 py-2 text-sm transition cursor-pointer transition-transform duration-150 ${selectedDay === day
                              ? "bg-white/5 text-black"
                              : "opacity-50 text-black/80"
                              } ${pressedId === `day-${day}` ? "scale-95" : "scale-100"}`}
                            onTouchStart={() => handlePressStart(`day-${day}`)}
                            onTouchEnd={handlePressEnd}
                          >
                            {formatRoDate(day)}
                            {!availabilityState.some((e) => e.date === day) && (
                              <span className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 text-[10px] uppercase tracking-wide opacity-70 group-hover:opacity-90">
                                closed
                              </span>
                            )}
                          </button>
                        </IconFrame2>
                      ))}
                    </div>

                    {/* Events for Selected Day */}
                    <div className="mt-4 rounded-xl p-4">
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
                        {!hasBookingForSelectedDay && (
                          <span className="flex items-center gap-1">
                            <span
                              className={`h-3 w-3 rounded-full ${hasAvailableInterval ? "bg-green-500" : "bg-red-500"}`}
                            />{" "}
                            {hasAvailableInterval ? "Interval disponibil" : "Interval indisponibil"}
                          </span>
                        )}
                        {hasBookingForSelectedDay && (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600" /> Programarea ta
                          </span>
                        )}
                      </div>
                      <div className="grid gap-3">
                        {eventsForDay.map((event) => {
                          const remaining = remainingForEvent(event);

                          // Check if user is already booked for this event
                          const isAlreadyBooked = bookings.some(
                            (b) => b.status !== "cancelled" && b.date === event.date && b.eventId === event.id
                          );

                          // Check if user is already booked for any event on that day
                          const userHasBookingForDay = bookings.some((b) => b.status !== "cancelled" && b.date === event.date);

                          return (
                            <div
                              key={event.id}
                              className={`flex items-center justify-between rounded-lg border border-white/10 px-3 py-3 ${remaining < desiredDuration ? "bg-white/5 opacity-60" : "bg-white/20"}`}
                              title={remaining < desiredDuration ? "Nu se mai pot face înscrieri" : "Disponibil"}
                            >
                              <div>
                                {event.endTime && (
                                  <p className="text-sm font-semibold text-shadow-xs text-shadow-black/30 text-white/90">
                                    Interval: {event.startTime} – {event.endTime}
                                  </p>
                                )}
                                {isAlreadyBooked && (
                                  <p className="text-xs bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent drop-shadow-md">V-ați înscris aici.</p>
                                )}
                                {userHasBookingForDay && !isAlreadyBooked && (
                                  <p className="text-xs text-white/70 italic">Aveți deja o programare în această zi.</p>
                                )}
                                {remaining < desiredDuration && !isAlreadyBooked && (
                                  <p className="text-xs text-red-600/90">Nu se mai pot face înscrieri.</p>
                                )}
                              </div>

                              {!userHasBookingForDay && remaining >= desiredDuration && !isAlreadyBooked && (
                                <button
                                  onClick={() => void handleBook(event.id)}
                                  className={`rounded-md px-3 py-2 text-xs text-white/90 font-semibold bg-green-600 cursor-pointer hover:bg-green-500 whitespace-nowrap transition-transform duration-150 ${pressedId === `book-${event.id}` ? "scale-95" : "scale-100"}`}
                                  onTouchStart={() => handlePressStart(`book-${event.id}`)}
                                  onTouchEnd={handlePressEnd}
                                >
                                  Înscrie-te
                                </button>
                              )}
                            </div>
                          );
                        })}

                        {eventsForDay.length === 0 && (
                          <p className="text-sm text-white/60">Nu există evenimente în această zi.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* <div className="border-b border-white/30 mt-5 pb-4" /> */}
                  {(error || message) && (
                    <div>
                      {error && (
                        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-3 text-sm text-red-100 whitespace-pre-line">
                          {error}
                        </div>
                      )}
                      {message && (
                        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">
                          {message}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex justify-center">
                    <IconFrame1 bgColor="bg-[#AE4B32]">
                      <button
                        type="button"
                        onClick={() => setShowMyBookings((v) => !v)}
                        className={`w-full py-2 md:py-3 px-4 text-sm md:text-base font-semibold text-center whitespace-nowrap cursor-pointer transition-transform duration-150 ${pressedId === "my-bookings-toggle" ? "scale-95" : "scale-100"}`}
                        onTouchStart={() => handlePressStart("my-bookings-toggle")}
                        onTouchEnd={handlePressEnd}
                      >
                        {showMyBookings ? "Ascunde programările" : "Programările tale"}
                      </button>
                    </IconFrame1>
                  </div>
                  {/* Bookings Section */}
                  {showMyBookings && (
                    <div className="mt-1 md:mt-10 space-y-3 rounded-xl p-4">

                      {bookings.length === 0 ? (
                        <p className="text-white/60">Nu există programări active.</p>
                      ) : (
                        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                          {pagedBookings.map((booking) => (
                            <div
                              key={booking._id}
                              className={`flex items-center justify-between rounded-md border px-3 py-2 ${booking.status === "cancelled"
                                ? "border-red-500/30 border-2 bg-red-500/10"
                                : "border-green-500/30 bg-green-500/10"
                                }`}
                            >
                              <div>
                                <p className="text-sm text-white/90 text-shadow-xs text-shadow-black/20 font-semibold">{formatRoDate(booking.date)}</p>
                                <p className="text-xs text-white/80 text-shadow-xs text-shadow-black/30">Ora: {booking.startTime}</p>
                                <p className="text-xs text-white/60">
                                  Stare:{" "}
                                  <span
                                    className={statusLabels[booking.status]?.className ?? "text-white"}
                                  >
                                    {statusLabels[booking.status]?.text ?? booking.status}
                                  </span>
                                </p>
                              </div>
                              {booking.status !== "cancelled" && (
                                <button
                                  disabled={bookingBusy}
                                  onClick={() => void handleCancel(booking._id)}
                                  className={`rounded-md border border-white/20 bg-red-500/40  px-3 py-1 text-xs text-red-100 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-transform duration-150 ${pressedId === `cancel-${booking._id}` ? "scale-95" : "scale-100"}`}
                                  onTouchStart={() => handlePressStart(`cancel-${booking._id}`)}
                                  onTouchEnd={handlePressEnd}
                                >
                                  Anulează
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pagination */}
                      {bookings.length > pageSize && (
                        <div className="flex items-center justify-between text-xs text-white/70">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className={`mr-1 text-white hover:underline md:inline transition-transform duration-150 ${page === 1 ? "invisible" : ""} ${pressedId === "page-prev" ? "scale-95" : "scale-100"}`}
                            onTouchStart={() => handlePressStart("page-prev")}
                            onTouchEnd={handlePressEnd}
                          >
                            ← Anterior
                          </button>
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className={`ml-2 text-white hover:underline transition-transform duration-150 ${page >= totalPages ? "invisible" : ""} ${pressedId === "page-next" ? "scale-95" : "scale-100"}`}
                            onTouchStart={() => handlePressStart("page-next")}
                            onTouchEnd={handlePressEnd}
                          >
                            Următor →
                          </button>
                        </div>
                      )}
                    </div>
                  )}


                  <div className="flex justify-center md:mt-20">
                    <Logo />
                  </div>
                </div>
              </div>
            )}
          </div>

    </YellowTexture>
  )
}

