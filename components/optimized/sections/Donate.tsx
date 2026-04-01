"use client";

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { signIn, useSession } from "next-auth/react";
import useFixedViewportHeight from "@/components/hooks/useFixedViewport";
import useIsMobile from "@/components/hooks/useMobile";
import IconFrame from "../components/FrameButton";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const DONATION_OPTIONS = [30, 50, 120, 230, 490];
const RECURRING_OPTIONS = [20, 30, 50, 70, 100, 200, 300];

const STRIPE_APPEARANCE = {
  theme: "night",
  variables: {
    colorPrimary: "#C59D30",
    colorBackground: "#151625",
    colorText: "#ffffff",
    colorDanger: "#fca5a5",
  },
} as const;

function DonationForm({
  amount,
  submitLabel,
  onSuccess,
  onError,
}: {
  amount: number;
  submitLabel: string;
  onSuccess: (message: string, didSucceed: boolean) => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?donate=success`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      const errorMessage = result.error.message ?? "Plata a eșuat.";
      onError(errorMessage);
      setSubmitting(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      const successMessage = "Mulțumim! Plata a fost efectuată cu succes.";
      onSuccess(successMessage, true);
    } else {
      onSuccess("Plata este în curs. Verificați mai tarziu.", false);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-[#C59D30] px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#d5ad3a] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Se procesează..." : submitLabel}
      </button>
    </form>
  );
}

export default function DonatePage({ opacity = 1, x = 0, y = 0 }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fixedViewportHeight = useFixedViewportHeight();
  const pinnedHeight = fixedViewportHeight ? `${fixedViewportHeight}px` : undefined;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const clampedProgress = useTransform(scrollYProgress, (value) =>
    Math.min(Math.max(value, 0), 1)
  );

  const scale = useTransform(clampedProgress, [0, 0.5, .8], [1.15, 1.3, 1.2]);
  const baseY = useTransform(clampedProgress, [0, 0.65, .7], [-120, 40, 0]);
  const imageY = useTransform(baseY, (value) => value + y);

  const titleOpacity = useTransform(clampedProgress, [0.35, 0.55], [0, 1]);
  const titleY = useTransform(clampedProgress, [0.35, 0.45, 0.55, 0.9], [-100, 50, 80, -50]);
  const subtitleY = useTransform(clampedProgress, [0.4, 0.5, 0.6, 0.95], [-30, 60, 80, -50]);
  const subtitleOpacity = useTransform(clampedProgress, [0.3, 0.4], [0, 1]);

  const { data: session } = useSession();

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"one-time" | "recurring" | null>(null);
  const [donationAmount, setDonationAmount] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [donationLoadingAmount, setDonationLoadingAmount] = useState<number | null>(null);
  const [quickCustom, setQuickCustom] = useState("");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [recurringAmount, setRecurringAmount] = useState<number | null>(null);
  const [recurringCustom, setRecurringCustom] = useState("");
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [recurringConfirm, setRecurringConfirm] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const popOutElement = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click_event = (ev: MouseEvent) => {
      const el = popOutElement.current;
      if (!el) return;

      const { x, y } = { x: ev.clientX, y: ev.clientY };
      const { left, right, top, bottom } = el.getBoundingClientRect();

      if (!(x > left && x < right && y > top && y < bottom)) {
        setShowPopup(false);
      }
    }

    window.addEventListener('mousedown', click_event);
    return () => {
      window.removeEventListener('mousedown', click_event);
    }
  }, []);

  // Disable page scroll when popup is open
  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {

    const html = document.documentElement;
    const body = document.body;

    if (showPopup) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
    }

    return () => {
      html.style.overflow = "";
      body.style.overflow = "";

    };
  }, [showPopup]);

  useEffect(() => {
    if (!showPopup) {
      setPaymentMode(null);
      setDonationAmount(null);
      setClientSecret(null);
      setDonationLoadingAmount(null);
      setQuickCustom("");
      setQuickError(null);
      setRecurringAmount(null);
      setRecurringCustom("");
      setRecurringError(null);
      setRecurringConfirm(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthBusy(false);
      setNotice(null);
      setHasActiveSubscription(false);
      setSubscriptionLoading(false);
      setCancelConfirm(false);
    }
  }, [showPopup]);

  useEffect(() => {
    if (!showPopup || !clientSecret) return;
    const el = paymentSectionRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const container = popOutElement.current;
    if (!container) return;
    const offset = 140;
    const timeoutId = window.setTimeout(() => {
      container.scrollBy({ top: offset, behavior: "smooth" });
    }, 120);
    return () => window.clearTimeout(timeoutId);
  }, [clientSecret, showPopup]);

  useEffect(() => {
    if (!showPopup || !session?.user) return;
    setSubscriptionLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/stripe/subscription", { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as {
          active?: boolean;
          cancelAtPeriodEnd?: boolean;
        };
        if (res.ok) {
          setHasActiveSubscription(Boolean(data.active && !data.cancelAtPeriodEnd));
        }
      } catch {
        // ignore
      } finally {
        setSubscriptionLoading(false);
      }
    })();
  }, [showPopup, session?.user]);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const pushNotice = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
  };

  const handleDonate = async (amount: number, source: "quick" | "preset" = "preset") => {
    if (donationLoadingAmount !== null) return;
    if (source === "quick") {
      setQuickError(null);
    } else {
      setNotice(null);
    }
    setQuickError(null);
    setQuickCustom("");
    setPaymentMode("one-time");
    setRecurringAmount(null);
    setRecurringCustom("");
    setRecurringConfirm(false);
    setDonationAmount(amount);
    setClientSecret(null);
    setDonationLoadingAmount(amount);
    try {
      if (!stripePromise) {
        throw new Error("Stripe nu este configurat.");
      }
      const res = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        clientSecret?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Nu s-a putut porni plata.");
      }
      if (!data.clientSecret) {
        throw new Error("Raspuns invalid.");
      }
      setClientSecret(data.clientSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut porni plata.";
      if (source === "quick") {
        setQuickError(message);
      } else {
        pushNotice("error", message);
      }
      setDonationAmount(null);
    } finally {
      setDonationLoadingAmount(null);
    }
  };

  const createSubscriptionIntent = async (amount: number) => {
    setNotice(null);
    setRecurringError(null);
    setPaymentMode("recurring");
    setDonationAmount(amount);
    setClientSecret(null);
    setDonationLoadingAmount(amount);
    try {
      if (!stripePromise) {
        throw new Error("Stripe nu este configurat.");
      }
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        clientSecret?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Nu s-a putut porni plata recurenta.");
      }
      if (!data.clientSecret) {
        throw new Error("Raspuns invalid.");
      }
      setClientSecret(data.clientSecret);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut porni plata recurenta.";
      setRecurringError(message);
      setDonationAmount(null);
    } finally {
      setDonationLoadingAmount(null);
    }
  };

  const resolveCustomAmount = (custom: string) => {
    const parsed = Number.parseInt(custom, 10);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(1, parsed);
  };

  const resolveRecurringAmount = (amount: number | null, custom: string) => {
    if (amount) return amount;
    return resolveCustomAmount(custom);
  };

  const handleRecurring = async (amount: number | null) => {
    setRecurringAmount(amount);
    setPaymentMode("recurring");
    setRecurringConfirm(false);
    setNotice(null);
    setRecurringError(null);
    setDonationAmount(null);
    setClientSecret(null);
  };

  const handleRecurringConfirm = async () => {
    setPaymentMode("recurring");
    setRecurringConfirm(true);
    setRecurringError(null);
    const selectedAmount = resolveRecurringAmount(recurringAmount, recurringCustom);
    if (!selectedAmount) {
      setRecurringError("Introduceți o sumă validă.");
      return;
    }
    setDonationAmount(selectedAmount);
    if (session?.user) {
      await createSubscriptionIntent(selectedAmount);
      return;
    }
  };

  const handleQuickCustomConfirm = async () => {
    const selectedAmount = resolveCustomAmount(quickCustom);
    if (!selectedAmount) {
      setQuickError("Introduceti o suma valida.");
      return;
    }
    await handleDonate(selectedAmount, "quick");
  };

  const handleAuthAndSubscribe = async () => {
    const selectedAmount = resolveRecurringAmount(recurringAmount, recurringCustom);
    if (!selectedAmount) {
      setRecurringError("Introduceți o sumă validă.");
      return;
    }
    if (!authEmail || !authPassword) {
      setRecurringError("Completează emailul și parola.");
      return;
    }
    setAuthBusy(true);
    setNotice(null);
    setRecurringError(null);
    try {
      const res = await fetch("/api/register-donor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      if (res.status === 409) {
        const login = await signIn("credentials", {
          email: authEmail,
          password: authPassword,
          redirect: false,
        });
        if (!login || login.error) {
          throw new Error("Email sau parola gresita.");
        }
      } else if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Nu s-a putut crea contul.");
      } else {
        await signIn("credentials", {
          email: authEmail,
          password: authPassword,
          redirect: false,
        });
      }
      await createSubscriptionIntent(selectedAmount);
    } catch (error) {
      setRecurringError(
        error instanceof Error ? error.message : "Nu s-a putut continua.",
      );
    } finally {
      setAuthBusy(false);
    }
  };

  const handleUpdateSubscription = async () => {
    const selectedAmount = resolveRecurringAmount(recurringAmount, recurringCustom);
    if (!selectedAmount) {
      setRecurringError("Introduceti o suma valida.");
      return;
    }
    setRecurringError(null);
    setDonationLoadingAmount(selectedAmount);
    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Nu s-a putut modifica suma.");
      }
      pushNotice("success", "Suma a fost actualizată.");
    } catch (error) {
      setRecurringError(
        error instanceof Error ? error.message : "Nu s-a putut modifica suma.",
      );
    } finally {
      setDonationLoadingAmount(null);
    }
  };

  const handleCancelSubscription = async () => {
    setNotice(null);
    setCancelConfirm(false);
    try {
      const res = await fetch("/api/stripe/subscription", { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Nu s-a putut anula.");
      }
      pushNotice("success", "Nu se vor mai face donații începând cu finalul perioadei curente.");
      setHasActiveSubscription(false);
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "Nu s-a putut anula abonamentul.");
    }
  };

  const isMobile = useIsMobile(700);

  return (
    <section
      ref={sectionRef}
      className="relative z-2 w-screen text-lg text-black bg-[#171813] mask-top-fade"

    >
      <div
        className="sticky top-0 h-screen w-screen overflow-hidden bg-black"
        style={
          !isMobile ? {
            height: pinnedHeight,
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black calc(100% - 200px), transparent 100%)",
            maskImage:
              "linear-gradient(to top, black 0%, black calc(100% - 200px), transparent 100%)",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",

          } : {
            height: pinnedHeight
          }}

      >

        {/* <div className="absolute top-0 md:block hidden w-full h-15 overflow-hidden z-1">
        <Image
          src="/patterns/top-bar.png"
          alt="top-bar-pattern"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/10 z-2  " />
      </div> */}

        <motion.div
          className="relative h-full  w-full object-top left-1/2 top-1/2 -translate-1/2"
          style={{
            scale,
            opacity,
            x,
            y: imageY,
            transformOrigin: "center bottom",
          }}
        >
          <Image
            fill
            sizes="100vw"
            src="/assets/iesire(1).png"
            priority
            quality={100}
            className="object-cover object-bottom md:hidden z-2"
            alt="background"
          />
          <div>
            <Image
              fill
              sizes="100vw"
              src="/assets/poza-wide-md.png"
              priority
              quality={100}
              className="object-cover object-top hidden md:block  z-2"
              alt="background"
            />
            <div className="absolute inset-0 bg-black/50 z-2 hidden md:block " />

          </div>

          <div className="absolute inset-0 z-0 md:hidden md:scale-250 scale-180 left-1/2 top-2/3 -translate-1/2">
            <Image
              fill
              sizes="100vw"
              src="/assets/poza-wide-md.png"
              quality={100}
              className="object-cover object-bottom"
              alt="stars background"
            />
            <div className="absolute inset-0 bg-black/50 z-2  md:hidden " />
          </div>

          <div className="absolute  inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <motion.h2
              style={{ opacity: titleOpacity, y: titleY }}
              className="text-2xl lg:text-5xl font-semibold tracking-tight drop-shadow-2xl z-3 text-shadow-black/20 text-shadow-xs bg-gradient-to-b from-yellow-600 to-orange-50 bg-clip-text text-transparent "
            >
              Daruind <span className="text-2xl lg:text-4xl byzantin">vei</span> dobandi
            </motion.h2>

            <div className=" flex flex-col items-center z-15">
              <motion.p
                style={{ opacity: subtitleOpacity, y: subtitleY }}
                className="max-w-[60vw] text-base sm:text-lg text-white/90 z-13 "
              >
                <p className="mb-8 text-shadow-xs text-shadow-black">
                  „Foișorul” Smarandei Doamna, numit și al Mavrocordaților, are atâta nevoie
                  de ajutorul tău, privitorule și omule drag, pentru a renaște din negura vremii.
                </p>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  onTap={() => setShowPopup(true)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <IconFrame
                    bgColor="bg-[#786543]"
                    textColor="text-[#ddd] text-sm w-fit px-2 md:max-w-60 mx-auto active:brightness-90
"
                  >
                    <p
                      className={`py-1 px-2 p-2 z-2 transition-transform duration-150 inline-flex ${isPressed ? "scale-95" : "scale-100"}`}
                    >
                      Detalii pentru donație
                    </p>
                  </IconFrame>
                </motion.div>
              </motion.p>
              {/* <motion.p
                style={{ opacity: subtitleOpacity, y: subtitleY }}
                className="max-w-[60vw] text-base sm:text-lg text-white/90 z-3 drop-shadow-xl flex flex-col items-center"
              >
                vremii și cenușa veacului trecut la mareția-i de odinioară. Dacă ai dare
                de suflet și dare de mână poți ajuta chiar acum lăsând darul tău
                <strong> aici </strong>.

              </motion.p> */}
            </div>


          </div>
        </motion.div>
      </div>

      {showPopup &&
        portalReady &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4"
          >
            <div
              ref={popOutElement}
              className="relative z-[2147483647] max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[#02021fd5] p-6 text-white shadow-xl backdrop-blur-xl"
              style={{ WebkitOverflowScrolling: "touch" }}
              onClick={(e) => e.stopPropagation()} // prevents closing when tapping inside
            >
              <button
                onClick={() => setShowPopup(false)}
                className="absolute z-5 top-3 right-3 w-4 h-4  flex items-center justify-center 
  cursor-pointer hover:scale-110 transition z-6"
              >
                <Image
                  src="/icons/close-circle.svg"
                  alt="Close"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </button>


              <p className="text-base leading-relaxed pt-2">
                Dacă ai dare
                de suflet și dare de mână poți ajuta chiar acum, lăsând darul tău
                <strong> aici </strong>.
                <br />
                Pentru depunerile ce le efectuați, contul Bisericii Foișor este
                <strong className="text-[#C59D30] animate-pulse"> RO77RNCB0069148541980001 </strong> deschis la BCR, CIF 13360648.
                <br /><br />
                Pentru sumele ce le depuneți vă rugăm să menționați la detalii:
                <strong className="text-[#C59D30]"> DONAȚIE </strong>.
              </p>
            <div className="mt-6 flex flex-col gap-4">

  {/* ================= RECURRING FIRST ================= */}
  {paymentMode !== "one-time" && (
    <div className="flex flex-col gap-3 border-white/10">
      <p className="text-xs uppercase tracking-wide text-white/70">
        Donație recurentă
      </p>

      <div className="grid grid-cols-2 gap-3">
        {RECURRING_OPTIONS.map((amount, index) => {
          const isLastOdd =
            RECURRING_OPTIONS.length % 2 === 1 &&
            index === RECURRING_OPTIONS.length - 1;

          return (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setRecurringCustom("");
                setPaymentMode("recurring"); // select recurring
                void handleRecurring(amount);
              }}
              disabled={donationLoadingAmount !== null || !stripePromise}
              className={`rounded-lg border border-white/20 bg-[#1f2a3f] px-3 py-2 text-sm font-semibold text-white transition ${
                recurringAmount === amount ? "ring-2 ring-[#C59D30]" : "hover:bg-[#2a3550]"
              } ${
                isLastOdd ? "col-span-2 mx-auto w-full max-w-[calc((100%-0.75rem)/2)]" : ""
              }`}
            >
              {donationLoadingAmount === amount ? "Se încarcă..." : `${amount} RON`}
            </button>
          );
        })}
      </div>

      <input
        type="number"
        min={1}
        value={recurringCustom}
        onChange={(e) => {
          setRecurringCustom(e.target.value);
          setRecurringAmount(null);
        }}
        placeholder="Sumă personalizată"
        className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white"
      />

      {(recurringAmount !== null || recurringCustom.trim().length > 0) && (
        <button
          onClick={() => void handleRecurringConfirm()}
          className="w-full rounded-lg bg-[#C59D30] px-3 py-2 text-black font-semibold"
        >
          Confirmă donația lunară
        </button>
      )}

      {/* 🔥 STRIPE RECURRING */}
      {paymentMode === "recurring" && clientSecret && donationAmount && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE, locale: "ro" }}>
          <DonationForm
            amount={donationAmount}
            submitLabel={`Donează ${donationAmount} RON/lună`}
            onSuccess={(message, didSucceed) => {
              pushNotice("success", message);
              if (didSucceed) {
                setClientSecret(null);
                setDonationAmount(null);
                setPaymentMode(null);
                setRecurringConfirm(false);
                setRecurringAmount(null);
                setRecurringCustom("");
                setQuickError(null);
                setRecurringError(null);
              }
            }}
            onError={(message) => pushNotice("error", message)}
          />
        </Elements>
      )}
    </div>
  )}

  {/* ================= QUICK DONATION ================= */}
  {paymentMode !== "recurring" && (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
      <p className="text-xs uppercase tracking-wide text-white/70">
        Donați rapid
      </p>

      <div className="grid grid-cols-2 gap-3">
        {DONATION_OPTIONS.map((amount, index) => {
          const isLastOdd =
            DONATION_OPTIONS.length % 2 === 1 &&
            index === DONATION_OPTIONS.length - 1;

          return (
            <button
              key={amount}
              onClick={() => {
                setPaymentMode("one-time"); // select quick
                void handleDonate(amount, "preset");
              }}
              className={`rounded-lg border border-white/20 bg-[#2a2a46] px-3 py-2 text-white ${
                isLastOdd ? "col-span-2" : ""
              }`}
            >
              Donează {amount} RON
            </button>
          );
        })}
      </div>

      <input
        type="number"
        value={quickCustom}
        onChange={(e) => setQuickCustom(e.target.value)}
        placeholder="Sumă personalizată"
        className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white"
      />

      {quickCustom.trim().length > 0 && (
        <button
          onClick={() => void handleQuickCustomConfirm()}
          className="w-full rounded-lg bg-[#C59D30] px-3 py-2 text-black font-semibold"
        >
          Confirmă donația
        </button>
      )}

      {paymentMode === "one-time" && clientSecret && donationAmount && stripePromise && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <DonationForm
            amount={donationAmount}
            submitLabel={`Plătește ${donationAmount} RON`}
            onSuccess={(message, didSucceed) => {
              pushNotice("success", message);
              if (didSucceed) {
                setClientSecret(null);
                setDonationAmount(null);
                setPaymentMode(null); // reset modul după succes
              }
            }}
            onError={(message) => pushNotice("error", message)}
          />
        </Elements>
      )}
    </div>
  )}
</div>
            </div>
          </div>,
          document.body,
        )}

    </section>
  );
}
