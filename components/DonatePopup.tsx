"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

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
  onSuccess: (msg: string, ok: boolean) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

    setLoading(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?donate=success`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      onError(result.error.message || "Plata a eșuat.");
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      onSuccess("Mulțumim! Plata a fost efectuată cu succes.", true);
    } else {
      onSuccess("Plata este în curs. Verificați mai târziu.", false);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <PaymentElement />
      <button
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-[#C59D30] px-3 py-2 text-black font-semibold hover:bg-[#d5ad3a] transition"
      >
        {loading ? "Se procesează..." : submitLabel}
      </button>
    </form>
  );
}

export default function DonatePopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [paymentMode, setPaymentMode] = useState<"one-time" | "recurring" | null>(null);
  const [donationAmount, setDonationAmount] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  const [quickCustom, setQuickCustom] = useState("");
  const [recurringAmount, setRecurringAmount] = useState<number | null>(null);
  const [recurringCustom, setRecurringCustom] = useState("");

  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };

    if (open) window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPaymentMode(null);
      setDonationAmount(null);
      setClientSecret(null);
      setQuickCustom("");
      setRecurringCustom("");
      setRecurringAmount(null);
      setNotice(null);
    }
  }, [open]);

  const parseAmount = (val: string) => {
    const n = parseInt(val);
    return isNaN(n) ? null : Math.max(1, n);
  };

  const handleDonate = async (amount: number) => {
    setPaymentMode("one-time");

    // RESET recurring
    setRecurringAmount(null);
    setRecurringCustom("");

    setDonationAmount(amount);
    setClientSecret(null);
    setLoadingAmount(amount);

    try {
      const res = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClientSecret(data.clientSecret);
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setLoadingAmount(null);
    }
  };

  const handleRecurring = (amount: number) => {
    setPaymentMode("recurring");
    setRecurringAmount(amount);

    // RESET one-time
    setQuickCustom("");
  };

  const handleRecurringConfirm = async () => {
    const val = recurringAmount || parseAmount(recurringCustom);
    if (!val) return;

    setPaymentMode("recurring");

    setLoadingConfirm(true);
    setDonationAmount(val);
    setClientSecret(null);
    setLoadingAmount(val);

    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: val }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClientSecret(data.clientSecret);
    } catch (e: any) {
      setNotice(e.message);
    } finally {
      setLoadingAmount(null);
      setLoadingConfirm(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/60 px-4">
      <div
        ref={ref}
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-[#02021fd5] p-6 text-white shadow-xl backdrop-blur-xl"
      >
        <button onClick={onClose} className="absolute top-3 right-3">
          <Image src="/icons/close-circle.svg" alt="close" width={18} height={18} />
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

        {/* RECURRING */}
        {paymentMode !== "one-time" && (
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-xs uppercase text-white/70">Donație recurentă</p>

            <div className="grid grid-cols-2 gap-3">
              {RECURRING_OPTIONS.map((a, i) => (
                <button
                  key={a}
                  onClick={() => handleRecurring(a)}
                  className={`rounded-lg border border-white/20 bg-[#1f2a3f] py-2
                    ${recurringAmount === a ? "ring-2 ring-[#C59D30]" : ""}
                    ${RECURRING_OPTIONS.length % 2 !== 0 && i === RECURRING_OPTIONS.length - 1
                      ? "col-span-2 mx-auto w-1/2"
                      : ""}`}
                >
                  {a} RON
                </button>
              ))}
            </div>

            <input
              value={recurringCustom}
              onChange={(e) => {
                setRecurringCustom(e.target.value);
                setRecurringAmount(null);
              }}
              placeholder="Sumă personalizată"
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white"
            />

            {(recurringAmount || recurringCustom) && (
              <button
                onClick={handleRecurringConfirm}
                disabled={loadingConfirm}
                className="bg-[#C59D30] py-2 text-black font-semibold rounded-lg disabled:opacity-50"
              >
                {loadingConfirm ? "Se procesează..." : "Confirmă donația lunară"}
              </button>
            )}
          </div>
        )}

        {/* ONE TIME */}
        {paymentMode !== "recurring" && (
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4">
            <p className="text-xs uppercase text-white/70">Donați rapid</p>

            <div className="grid grid-cols-2 gap-3">
              {DONATION_OPTIONS.map((a, i) => (
                <button
                  key={a}
                  onClick={() => handleDonate(a)}
                  className={`rounded-lg border border-white/20 bg-[#2a2a46] py-2
                    ${donationAmount === a ? "ring-2 ring-[#C59D30]" : ""}
                    ${DONATION_OPTIONS.length % 2 !== 0 && i === DONATION_OPTIONS.length - 1
                      ? "col-span-2 mx-auto w-1/2"
                      : ""}`}
                >
                  {a} RON
                </button>
              ))}
            </div>

            <input
              value={quickCustom}
              onChange={(e) => {
                setQuickCustom(e.target.value);
                setRecurringAmount(null);
                setRecurringCustom("");
              }}
              placeholder="Sumă personalizată"
              className="w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-sm text-white"
            />

            {quickCustom && (
              <button
                onClick={async () => {
                  const val = parseAmount(quickCustom);
                  if (!val) return;

                  setLoadingConfirm(true);
                  await handleDonate(val);
                  setLoadingConfirm(false);
                }}
                disabled={loadingConfirm}
                className="bg-[#C59D30] py-2 text-black rounded font-semibold disabled:opacity-50"
              >
                {loadingConfirm ? "Se procesează..." : "Confirmă donația"}
              </button>
            )}
          </div>
        )}

        {clientSecret && donationAmount && stripePromise && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
            <DonationForm
              amount={donationAmount}
              submitLabel={
                paymentMode === "recurring"
                  ? `Donează ${donationAmount} RON/lună`
                  : `Donează ${donationAmount} RON`
              }
              onSuccess={(msg) => {
                setNotice(msg);
                setClientSecret(null);
              }}
              onError={(msg) => setNotice(msg)}
            />
          </Elements>
        )}

        {notice && <p className="mt-3 text-center text-sm">{notice}</p>}
      </div>
    </div>,
    document.body
  );
}