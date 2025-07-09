import { useEffect, useRef } from "react";

export default function StripeEmbeddedCheckout() {
  const checkoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stripe: any;
    let checkout: any;

    const loadStripe = async () => {
      if (!window.Stripe) {
        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.onload = initStripe;
        document.body.appendChild(script);
      } else {
        initStripe();
      }
    };

    const initStripe = async () => {
      stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      const fetchClientSecret = async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription/embedded-checkout-session`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        });
        const { clientSecret } = await res.json();
        return clientSecret;
      };

      checkout = await stripe.initEmbeddedCheckout({ fetchClientSecret });
      checkout.mount("#checkout-element");
    };

    loadStripe();

    return () => {
      if (checkout) checkout.destroy();
    };
  }, []);

  return <div id="checkout-element" ref={checkoutRef} />;
} 