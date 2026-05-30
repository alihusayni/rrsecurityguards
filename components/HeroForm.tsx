"use client";

import { useState, useEffect, useRef } from "react";

export default function HeroForm() {
  const [captchaA, setCaptchaA] = useState(0);
  const [captchaB, setCaptchaB] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("Mobile Patrol");
  const [details, setDetails] = useState("");

  const submittedRef = useRef(false);
  const abandonedSentRef = useRef(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const formStartTimeRef = useRef(Date.now());

  useEffect(() => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
  }, []);

  // --- Abandoned form detection ---
  useEffect(() => {
    const sendAbandonment = () => {
      if (submittedRef.current || abandonedSentRef.current) return;
      if (confirmEmailRef.current) return;

      const timeElapsed = Date.now() - formStartTimeRef.current;
      if (timeElapsed < 4000) return;

      const currentName = nameRef.current;
      const currentEmail = emailRef.current;
      const currentPhone = phoneRef.current;

      const hasData = !!(currentName || currentEmail || currentPhone);
      if (!hasData) return;

      abandonedSentRef.current = true;

      const payload = JSON.stringify({
        name: currentName,
        email: currentEmail,
        phone: currentPhone,
        service: serviceRef.current,
        details: detailsRef.current,
        abandoned: true,
        pageUrl: window.location.href,
        confirm_email: confirmEmailRef.current,
        timeElapsed: timeElapsed,
      });

      navigator.sendBeacon(
        "/api/contact",
        new Blob([payload], { type: "application/json" })
      );
    };

    const onBeforeUnload = () => sendAbandonment();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") sendAbandonment();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Keep refs in sync with state so the abandonment handler reads fresh values
  const nameRef = useRef(name);
  const emailRef = useRef(email);
  const phoneRef = useRef(phone);
  const serviceRef = useRef(service);
  const detailsRef = useRef(details);
  const confirmEmailRef = useRef(confirmEmail);

  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { phoneRef.current = phone; }, [phone]);
  useEffect(() => { serviceRef.current = service; }, [service]);
  useEffect(() => { detailsRef.current = details; }, [details]);
  useEffect(() => { confirmEmailRef.current = confirmEmail; }, [confirmEmail]);

  const resetCaptcha = () => {
    setCaptchaA(Math.floor(Math.random() * 9) + 1);
    setCaptchaB(Math.floor(Math.random() * 9) + 1);
    setCaptchaInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmEmail) {
      // Fake success for bots
      submittedRef.current = true;
      setStatus("success");
      return;
    }

    if (parseInt(captchaInput) !== captchaA + captchaB) {
      alert("Incorrect answer. Please try again.");
      resetCaptcha();
      return;
    }

    setStatus("sending");
    const timeElapsed = Date.now() - formStartTimeRef.current;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          service,
          details,
          pageUrl: window.location.href,
          confirm_email: confirmEmail,
          timeElapsed,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      submittedRef.current = true;
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setService("Mobile Patrol");
      setDetails("");
      resetCaptcha();
    } catch (err: any) {
      setStatus("error");
      try {
        await fetch("https://www.despora.ai/api/alerts/form-failure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteName: "RR Security Guards",
            pageUrl: window.location.href,
            errorDetails: err.message || "Form API failed or network issue",
            clientEmail: "nakibw@gmail.com",
            leadData: { name, email, phone, service, details },
          }),
        });
      } catch (backupErr) {
        console.error("Backup outage alert report failed:", backupErr);
      }
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[var(--color-primary)]";

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Thank You!</h3>
        <p className="text-sm text-gray-400">
          Your quote request has been sent. We&apos;ll get back to you within 24 hours.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-[var(--color-primary)] hover:underline"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          type="tel"
          placeholder="Phone Number"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
        <select
          aria-label="Select a security service"
          required
          value={service}
          onChange={(e) => setService(e.target.value)}
          className={`${inputClass} text-gray-400`}
        >
          <option value="Mobile Patrol">Mobile Patrol</option>
          <option value="Construction Site Security">
            Construction Site Security
          </option>
          <option value="Fire Watch">Fire Watch</option>
          <option value="Event Security">Event Security</option>
          <option value="Unarmed Security">Unarmed Security</option>
          <option value="Executive Protection/ Body Guard">
            Executive Protection/ Body Guard
          </option>
          <option value="Armed Security">Armed Security</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <textarea
        placeholder="Tell us more about your security requirements, property details, or any specific concerns..."
        rows={4}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className={`${inputClass} resize-none`}
      />

      {/* Honeypot — hidden from humans, bots fill it */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <input
          type="text"
          name="confirm_email"
          tabIndex={-1}
          autoComplete="off"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
        />
      </div>

      {/* Simple Math Captcha */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-300 whitespace-nowrap">
          What is {captchaA} + {captchaB}?
        </span>
        <input
          type="text"
          inputMode="numeric"
          required
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value)}
          placeholder="Answer"
          className="w-20 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[var(--color-primary)] text-center"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-400">
        <input type="checkbox" className="mt-0.5" required />
        I agree to the terms and conditions
      </label>

      {status === "error" && (
        <p className="text-sm text-red-400">
          Something went wrong. Please try again or call us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "sending" ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </form>
  );
}
