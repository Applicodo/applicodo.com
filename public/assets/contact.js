(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const verification = document.getElementById("verification");
  const retry = document.getElementById("verification-retry");
  const submit = document.getElementById("send-message");
  if (!form || !status || !verification || !retry || !submit) return;

  let configuration = null;
  let setupPromise = null;
  let scriptPromise = null;
  let widgetId = null;
  let token = "";
  let sending = false;
  let sent = false;
  let observer = null;

  function announce(message, state = "info") {
    status.textContent = message;
    status.dataset.state = state;
  }

  function showRetry(message) {
    token = "";
    retry.hidden = false;
    announce(message, "error");
  }

  function loadTurnstile() {
    if (window.turnstile?.render) return Promise.resolve(window.turnstile);
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      let timeout;
      function fail() {
        clearTimeout(timeout);
        script.remove();
        reject(new Error("Verification did not load"));
      }
      script.addEventListener("load", () => {
        clearTimeout(timeout);
        if (window.turnstile?.render) resolve(window.turnstile);
        else fail();
      }, { once: true });
      script.addEventListener("error", fail, { once: true });
      timeout = window.setTimeout(fail, 15000);
      document.head.append(script);
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
    return scriptPromise;
  }

  async function readConfiguration() {
    const response = await fetch("/api/contact-config", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Contact unavailable");
    const value = await response.json();
    if (typeof value?.deliveryEnabled !== "boolean" || typeof value?.siteKey !== "string"
      || typeof value?.preview !== "boolean") {
      throw new Error("Contact unavailable");
    }
    return value;
  }

  async function prepareVerification() {
    if (setupPromise) return setupPromise;
    observer?.disconnect();
    retry.hidden = true;
    announce("Loading spam protection…");
    setupPromise = (async () => {
      configuration = await readConfiguration();
      if (!configuration.deliveryEnabled) {
        if (configuration.preview) {
          announce("This is a preview. Messages cannot be sent from this version of the page.");
        } else {
          showRetry("The contact form is temporarily unavailable. Please try again shortly.");
        }
        return false;
      }
      if (!configuration.siteKey) throw new Error("Contact unavailable");
      const turnstile = await loadTurnstile();
      if (widgetId !== null) turnstile.remove(widgetId);
      widgetId = turnstile.render(verification, {
        sitekey: configuration.siteKey,
        action: "contact",
        theme: "light",
        size: "flexible",
        "response-field": false,
        callback(value) {
          token = value;
          retry.hidden = true;
          if (!sending && !sent && status.dataset.state !== "error") {
            announce("Verification complete. Your message is ready to send.");
          }
        },
        "expired-callback"() {
          token = "";
          if (!sending && !sent) announce("Verification expired. Please verify again before sending.");
        },
        "error-callback"() {
          showRetry("Verification could not finish. Check your connection and retry verification.");
        },
        "timeout-callback"() {
          showRetry("Verification timed out. Please retry verification.");
        },
      });
      announce("Complete the verification, then send your message.");
      return true;
    })().catch(() => {
      configuration = null;
      showRetry("The contact form could not load. Check your connection and retry verification.");
      return false;
    }).finally(() => {
      setupPromise = null;
    });
    return setupPromise;
  }

  function ensureVerification() {
    if (widgetId === null && !setupPromise && configuration?.deliveryEnabled !== false) {
      void prepareVerification();
    }
  }

  form.addEventListener("focusin", ensureVerification);
  retry.addEventListener("click", () => {
    token = "";
    sent = false;
    void prepareVerification();
  });
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) ensureVerification();
    }, { rootMargin: "250px" });
    observer.observe(form);
  } else {
    ensureVerification();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    if (!configuration) await prepareVerification();
    if (configuration?.deliveryEnabled !== true) {
      if (configuration?.deliveryEnabled === false && configuration.preview) {
        announce("Messages cannot be sent from this preview. Visit applicodo.com to send your enquiry.", "error");
      } else if (configuration?.deliveryEnabled === false) {
        showRetry("The contact form is temporarily unavailable. Please try again shortly.");
      }
      return;
    }
    if (!token) {
      announce("Please complete the spam verification before sending your message.", "error");
      verification.scrollIntoView({ block: "nearest", behavior: "auto" });
      return;
    }

    const name = form.elements.namedItem("name");
    const email = form.elements.namedItem("email");
    const message = form.elements.namedItem("message");
    if (!(name instanceof HTMLInputElement) || !(email instanceof HTMLInputElement)
      || !(message instanceof HTMLTextAreaElement)) return;

    const payload = { name: name.value, email: email.value, message: message.value, turnstileToken: token };
    sending = true;
    sent = false;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    announce("Sending your message…");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.ok === true) {
        sent = true;
        form.reset();
        announce("Your message has been sent. Thanks for telling me about your project.", "success");
      } else if (response.status === 429) {
        announce("Too many attempts in a short time. Please wait a moment, verify again, and retry.", "error");
      } else {
        const error = typeof result?.error === "string" && result.error.length <= 300
          ? result.error
          : "Your message could not be sent. Your text is still here. Please verify again and retry.";
        announce(error, "error");
      }
    } catch {
      announce("The connection was interrupted, so I could not confirm delivery. Your text is still here. Please verify again before retrying.", "error");
    } finally {
      token = "";
      sending = false;
      submit.disabled = false;
      form.removeAttribute("aria-busy");
      if (widgetId !== null && window.turnstile?.reset) window.turnstile.reset(widgetId);
    }
  });
})();
